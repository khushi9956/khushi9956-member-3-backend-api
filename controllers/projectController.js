const { Project, Task, Workspace, User } = require('../models');

// Returns the ids from `memberIds` that do not belong to this organization.
const findOutsideMembers = async (memberIds, organizationId) => {
  if (!Array.isArray(memberIds) || memberIds.length === 0) return [];
  const people = await User.find({ organization: organizationId });
  const allowed = new Set(people.map((p) => p._id.toString()));
  return memberIds.filter((id) => !allowed.has(String(id)));
};

const outsideMembersResponse = (res) =>
  res.status(400).json({
    success: false,
    message: 'Every project member must belong to your organization.',
  });


/**
 * @desc    Get all projects for authenticated user's organization
 * @route   GET /api/projects
 * @access  Private
 */
const getProjects = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    const { workspaceId, status } = req.query;

    const filter = { organization: orgId };
    if (workspaceId) filter.workspace = workspaceId;
    if (status) filter.status = status;

    const projects = await Project.find(filter)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar')
      .sort({ createdAt: -1 });

    // Enhance projects with live task progress metrics
    const enhancedProjects = await Promise.all(
      projects.map(async (project) => {
        const totalTasks = await Task.countDocuments({ project: project._id });
        const completedTasks = await Task.countDocuments({ project: project._id, status: 'done' });
        const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        const base = typeof project.toObject === 'function' ? project.toObject() : project;
        return {
          ...base,
          totalTasks,
          completedTasks,
          progressPercentage,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: enhancedProjects.length,
      projects: enhancedProjects,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single project by ID with members & task statistics
 * @route   GET /api/projects/:id
 * @access  Private
 */
const getProjectById = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    const project = await Project.findOne({
      _id: req.params.id,
      organization: orgId,
    })
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar')
      .populate('workspace', 'name');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found in your organization',
      });
    }

    const totalTasks = await Task.countDocuments({ project: project._id });
    const completedTasks = await Task.countDocuments({ project: project._id, status: 'done' });
    const inProgressTasks = await Task.countDocuments({ project: project._id, status: 'in_progress' });
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const base = typeof project.toObject === 'function' ? project.toObject() : project;
    res.status(200).json({
      success: true,
      project: {
        ...base,
        totalTasks,
        completedTasks,
        inProgressTasks,
        progressPercentage,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new project
 * @route   POST /api/projects
 * @access  Private (Owner, Manager)
 */
const createProject = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    const { name, key, description, workspaceId, members, dueDate } = req.body;

    if ((await findOutsideMembers(members, orgId)).length > 0) return outsideMembersResponse(res);

    // Check key uniqueness within organization
    const existingKey = await Project.findOne({
      organization: orgId,
      key: key.toUpperCase().trim(),
    });

    if (existingKey) {
      return res.status(409).json({
        success: false,
        message: `Project key '${key.toUpperCase()}' is already used in this organization.`,
      });
    }

    // Find or fallback to default workspace
    let targetWorkspaceId = workspaceId;
    if (!targetWorkspaceId) {
      const defaultWs = await Workspace.findOne({ organization: orgId });
      if (defaultWs) {
        targetWorkspaceId = defaultWs._id;
      } else {
        const newWs = await Workspace.create({
          name: 'Main Workspace',
          organization: orgId,
        });
        targetWorkspaceId = newWs._id;
      }
    }

    // Include creator in members if not already
    const projectMembers = Array.isArray(members) ? members : [];
    if (!projectMembers.includes(req.user._id.toString())) {
      projectMembers.push(req.user._id);
    }

    const project = await Project.create({
      name: name.trim(),
      key: key.toUpperCase().trim(),
      description: description || '',
      organization: orgId,
      workspace: targetWorkspaceId,
      owner: req.user._id,
      members: projectMembers,
      dueDate: dueDate || null,
      status: 'active',
    });

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project: populatedProject,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update project
 * @route   PUT /api/projects/:id
 * @access  Private (Owner, Manager)
 */
const updateProject = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    let project = await Project.findOne({ _id: req.params.id, organization: orgId });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found in your organization',
      });
    }

    const { name, description, status, members, dueDate } = req.body;

    if (members && (await findOutsideMembers(members, orgId)).length > 0) {
      return outsideMembersResponse(res);
    }

    if (name) project.name = name.trim();
    if (description !== undefined) project.description = description;
    if (status) project.status = status;
    if (members && Array.isArray(members)) project.members = members;
    if (dueDate !== undefined) project.dueDate = dueDate;

    await project.save();

    const updated = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      project: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete project and its associated tasks
 * @route   DELETE /api/projects/:id
 * @access  Private (Owner only)
 */
const deleteProject = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    const project = await Project.findOne({ _id: req.params.id, organization: orgId });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found in your organization',
      });
    }

    // Cascade delete project's tasks
    await Task.deleteMany({ project: project._id });
    await Project.deleteOne({ _id: project._id });

    res.status(200).json({
      success: true,
      message: 'Project and all associated tasks deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
