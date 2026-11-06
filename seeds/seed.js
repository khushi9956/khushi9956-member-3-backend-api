const mongoose = require('mongoose');
const { User, Organization, Workspace, Project, Task, Membership } = require('../models');

const seedDatabase = async (exitOnComplete = true) => {
  try {
    console.log('[seed] Cleaning up existing synthetic demo collections...');
    await Task.deleteMany({});
    await Project.deleteMany({});
    await Membership.deleteMany({});
    await Workspace.deleteMany({});
    await Organization.deleteMany({});
    await User.deleteMany({});

    console.log('Creating Demo Organization...');
    const org = await Organization.create({
      name: 'Apex Innovations Corp',
      slug: 'apex-innovations',
      subscriptionTier: 'enterprise',
      owner: new mongoose.Types.ObjectId(), // Placeholder updated below
    });

    console.log('Creating Default Workspace...');
    const workspace = await Workspace.create({
      name: 'Product & Engineering Workspace',
      organization: org._id,
      description: 'Central engineering workspace for core platform deliverables',
    });

    console.log('Creating Role-Based Demo Users...');
    // 1. Owner
    const owner = await User.create({
      name: 'Alex Vance (Owner)',
      email: 'owner@apex.com',
      password: 'Password123!',
      role: 'owner',
      organization: org._id,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    });

    // Update org owner
    org.owner = owner._id;
    await org.save();

    // 2. Manager
    const manager = await User.create({
      name: 'Sarah Connor (Manager)',
      email: 'manager@apex.com',
      password: 'Password123!',
      role: 'manager',
      organization: org._id,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    });

    // 3. Employee
    const employee = await User.create({
      name: 'David Kim (Employee)',
      email: 'dev@apex.com',
      password: 'Password123!',
      role: 'employee',
      organization: org._id,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    });

    console.log('Creating Memberships...');
    await Membership.create([
      { user: owner._id, organization: org._id, role: 'owner', status: 'active' },
      { user: manager._id, organization: org._id, role: 'manager', status: 'active' },
      { user: employee._id, organization: org._id, role: 'employee', status: 'active' },
    ]);

    console.log('Creating projects...');
    const project1 = await Project.create({
      name: 'SaaS Platform v2.0',
      key: 'SAAS',
      description: 'Next-generation team collaboration portal with Kanban board and multi-tenant isolation.',
      status: 'active',
      organization: org._id,
      workspace: workspace._id,
      owner: owner._id,
      members: [owner._id, manager._id, employee._id],
      startDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    });

    const project2 = await Project.create({
      name: 'Mobile Client Experience',
      key: 'MOB',
      description: 'Responsive mobile web application and offline sync features.',
      status: 'active',
      organization: org._id,
      workspace: workspace._id,
      owner: manager._id,
      members: [manager._id, employee._id],
      startDate: new Date(),
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    });

    console.log('Creating tasks for the first project...');
    await Task.create([
      {
        title: 'Design Multi-Tenant Architecture & Wireframes',
        description: 'Prepare high-level component hierarchy, ER diagram, and authenticated app shell layout.',
        project: project1._id,
        workspace: workspace._id,
        organization: org._id,
        creator: owner._id,
        assignee: owner._id,
        status: 'done',
        priority: 'high',
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        labels: ['architecture', 'ux'],
        subtasks: [
          { title: 'Create DB Schemas', completed: true },
          { title: 'Define Role Permissions', completed: true },
          { title: 'Review with Team', completed: true },
        ],
        order: 0,
      },
      {
        title: 'Build Secure JWT Authentication & Role Middleware',
        description: 'Implement login, register, token verification, and owner/manager/employee permission checks.',
        project: project1._id,
        workspace: workspace._id,
        organization: org._id,
        creator: manager._id,
        assignee: manager._id,
        status: 'done',
        priority: 'urgent',
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        labels: ['backend', 'security'],
        subtasks: [
          { title: 'Hash passwords with bcrypt', completed: true },
          { title: 'Generate JWT with org context', completed: true },
          { title: 'Add RBAC guards', completed: true },
        ],
        order: 1,
      },
      {
        title: 'Implement Interactive Kanban Board with Drag & Drop',
        description: 'Build responsive Kanban columns for Todo, In Progress, Review, and Done with smooth drag-and-drop state updates.',
        project: project1._id,
        workspace: workspace._id,
        organization: org._id,
        creator: manager._id,
        assignee: employee._id,
        status: 'in_progress',
        priority: 'high',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        labels: ['frontend', 'kanban'],
        subtasks: [
          { title: 'Column layout with status headers', completed: true },
          { title: 'HTML5 drag-and-drop handlers', completed: false },
          { title: 'Keyboard/button status fallback', completed: true },
        ],
        order: 0,
      },
      {
        title: 'Add Dynamic Task Search & Multi-criteria Filtering',
        description: 'Filter tasks instantly by priority (low, medium, high, urgent), status, and assignee in real-time.',
        project: project1._id,
        workspace: workspace._id,
        organization: org._id,
        creator: owner._id,
        assignee: employee._id,
        status: 'todo',
        priority: 'medium',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        labels: ['frontend', 'filters'],
        subtasks: [
          { title: 'Search query debounce', completed: false },
          { title: 'Priority dropdown filter', completed: false },
        ],
        order: 0,
      },
      {
        title: 'Server-Side Task CRUD & Payload Validation',
        description: 'Ensure all task actions are strictly scoped to the user\'s authorized organization and project.',
        project: project1._id,
        workspace: workspace._id,
        organization: org._id,
        creator: manager._id,
        assignee: manager._id,
        status: 'review',
        priority: 'urgent',
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        labels: ['backend', 'validation'],
        subtasks: [
          { title: 'Add project ownership validator', completed: true },
          { title: 'Add title and priority validators', completed: true },
          { title: 'Sanitize user inputs', completed: false },
        ],
        order: 0,
      },
      {
        title: 'Subtask Checklist and Progress Calculation',
        description: 'Allow toggling subtasks on card click and calculate overall project completion percentage.',
        project: project1._id,
        workspace: workspace._id,
        organization: org._id,
        creator: owner._id,
        assignee: employee._id,
        status: 'todo',
        priority: 'low',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        labels: ['feature', 'ux'],
        subtasks: [
          { title: 'Toggle subtask checkbox API', completed: false },
          { title: 'Render progress bar', completed: false },
        ],
        order: 1,
      },
    ]);

    console.log('Synthetic demo data seeded successfully!');
    console.log('----------------------------------------------------');
    console.log('Demo Credentials:');
    console.log('1. Owner:    owner@apex.com   | Password: Password123!');
    console.log('2. Manager:  manager@apex.com | Password: Password123!');
    console.log('3. Employee: dev@apex.com     | Password: Password123!');
    console.log('----------------------------------------------------');

    if (exitOnComplete) {
      process.exit(0);
    }
  } catch (error) {
    console.error('Seeding error:', error);
    if (exitOnComplete) {
      process.exit(1);
    }
  }
};

// Standalone runner
if (require.main === module) {
  require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
  const connectDB = require('../config/db');
  connectDB().then(() => {
    seedDatabase(true);
  });
}

module.exports = { seedDatabase };
