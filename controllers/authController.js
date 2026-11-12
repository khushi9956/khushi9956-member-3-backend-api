const { User, Organization, Workspace, Membership } = require('../models');
const { generateToken } = require('../utils/token');

/**
 * @desc    Register a new user (and auto-create Organization & Workspace if creating new account)
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, organizationName } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    // Determine role (default to owner if user supplies orgName or first signup, else employee)
    const assignedRole = role || (organizationName ? 'owner' : 'employee');

    // Create user (temporarily without org to obtain _id)
    const user = new User({
      name,
      email,
      password,
      role: assignedRole,
    });
    await user.save();

    // Create or link Organization
    let organization;
    if (organizationName) {
      organization = await Organization.create({
        name: organizationName,
        owner: user._id,
      });
    } else {
      // Find an existing default org or create one
      organization = await Organization.findOne();
      if (!organization) {
        organization = await Organization.create({
          name: `${name}'s Organization`,
          owner: user._id,
        });
      }
    }

    // Ensure at least one Workspace exists for this org
    let workspace = await Workspace.findOne({ organization: organization._id });
    if (!workspace) {
      workspace = await Workspace.create({
        name: 'General Workspace',
        organization: organization._id,
        description: 'Default project collaboration workspace',
      });
    }

    // Update user's organization
    user.organization = organization._id;
    await user.save();

    // Create Membership record
    await Membership.create({
      user: user._id,
      organization: organization._id,
      role: assignedRole,
      status: 'active',
    });

    // Generate JWT token
    const token = generateToken({
      id: user._id,
      role: user.role,
      organization: organization._id,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: {
          id: organization._id,
          name: organization.name,
        },
        defaultWorkspaceId: workspace._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    // Find user with password included
    const user = await User.findOne({ email }).select('+password').populate('organization');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials',
      });
    }

    // Fetch workspace
    const workspace = await Workspace.findOne({ organization: user.organization?._id });

    // Generate JWT token
    const token = generateToken({
      id: user._id,
      role: user.role,
      organization: user.organization?._id,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization
          ? {
              id: user.organization._id,
              name: user.organization.name,
            }
          : null,
        defaultWorkspaceId: workspace ? workspace._id : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current authenticated user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('organization');
    const workspace = await Workspace.findOne({ organization: user.organization?._id });

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization
          ? {
              id: user.organization._id,
              name: user.organization.name,
            }
          : null,
        defaultWorkspaceId: workspace ? workspace._id : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all users in the same organization (for assigning tasks/members)
 * @route   GET /api/auth/users
 * @access  Private
 */
const getOrganizationUsers = async (req, res, next) => {
  try {
    const orgId = req.user.organization?._id || req.user.organization;
    const users = await User.find({ organization: orgId }).select('_id name email role avatar');

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  getOrganizationUsers,
};
