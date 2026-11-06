// Unit & Integration Tests for Member 3: Backend & REST API Service
// Run with: npm test

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'member-3-test-jwt-secret';
global.useMemoryDb = true;

const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');

const { initMemoryStore, memoryStore } = require('../config/memoryDb');
const { Project, Task, Workspace, User, Organization } = require('../models');
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  toggleSubtask,
  deleteTask,
} = require('../controllers/taskController');
const { getWorkspaces, getStats } = require('../controllers/workspaceController');
const {
  validateProjectInput,
  validateProjectUpdate,
  validateTaskInput,
  validateTaskUpdate,
  validateStatusUpdate,
} = require('../middlewares/validate');
const errorHandler = require('../middlewares/errorHandler');

// Lightweight mock helper for Express req and res
const mockReqRes = (overrides = {}) => {
  const req = {
    body: {},
    headers: {},
    params: {},
    query: {},
    user: null,
    organizationId: null,
    ip: '127.0.0.1',
    ...overrides,
  };

  const res = {
    statusCode: 200,
    headers: {},
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = JSON.parse(JSON.stringify(payload));
      return this;
    },
    set(header, value) {
      this.headers[header] = value;
      return this;
    },
  };

  return { req, res };
};

let testOwner;
let testManager;
let testEmployee;
let testOrg;
let testWorkspace;

before(async () => {
  await initMemoryStore();
  testOwner = await User.findOne({ email: 'owner@apex.com' });
  testManager = await User.findOne({ email: 'manager@apex.com' });
  testEmployee = await User.findOne({ email: 'dev@apex.com' });
  testOrg = await Organization.findOne({ slug: 'apex-innovations' });
  testWorkspace = await Workspace.findOne({ organization: testOrg._id });
});

describe('1. Project API Operations (controllers/projectController.js)', () => {
  let createdProjectId;

  test('POST createProject creates project with key and owner', async () => {
    const { req, res } = mockReqRes({
      user: testOwner,
      organizationId: testOrg._id,
      body: {
        name: 'Alpha Redesign Project',
        key: 'ALPHA',
        description: 'Frontend redesign and design systems',
        workspace: testWorkspace._id,
      },
    });

    await createProject(req, res, (err) => {
      if (err) throw err;
    });

    assert.equal(res.statusCode, 201);
    assert.equal(res.data.success, true);
    assert.equal(res.data.project.name, 'Alpha Redesign Project');
    assert.equal(res.data.project.key, 'ALPHA');
    createdProjectId = res.data.project._id;
  });

  test('POST createProject rejects duplicate key within same organization', async () => {
    const { req, res } = mockReqRes({
      user: testOwner,
      organizationId: testOrg._id,
      body: {
        name: 'Another Project With Same Key',
        key: 'ALPHA',
      },
    });

    await createProject(req, res, () => {});
    assert.equal(res.statusCode, 409);
    assert.equal(res.data.success, false);
    assert.match(res.data.message, /already (exists|used)/i);
  });

  test('GET getProjects returns list with progress metrics', async () => {
    const { req, res } = mockReqRes({
      user: testOwner,
      organizationId: testOrg._id,
    });

    await getProjects(req, res, (err) => {
      if (err) throw err;
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.data.success, true);
    assert.ok(Array.isArray(res.data.projects));
    assert.ok(res.data.projects.length >= 1);
    assert.ok(typeof res.data.projects[0].progressPercentage === 'number');
  });

  test('GET getProjectById returns single project details', async () => {
    const { req, res } = mockReqRes({
      user: testOwner,
      organizationId: testOrg._id,
      params: { id: createdProjectId },
    });

    await getProjectById(req, res, (err) => {
      if (err) throw err;
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.project._id.toString(), createdProjectId.toString());
  });

  test('PUT updateProject updates project status', async () => {
    const { req, res } = mockReqRes({
      user: testOwner,
      organizationId: testOrg._id,
      params: { id: createdProjectId },
      body: { status: 'on_hold', description: 'Updated project description' },
    });

    await updateProject(req, res, (err) => {
      if (err) throw err;
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.project.status, 'on_hold');
  });

  test('DELETE deleteProject deletes project', async () => {
    const { req, res } = mockReqRes({
      user: testOwner,
      organizationId: testOrg._id,
      params: { id: createdProjectId },
    });

    await deleteProject(req, res, (err) => {
      if (err) throw err;
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.data.success, true);
  });
});

describe('2. Task & Kanban API Operations (controllers/taskController.js)', () => {
  let createdTaskId;
  let testProject;

  before(async () => {
    testProject = await Project.findOne({ key: 'SAAS' });
  });

  test('POST createTask creates task with subtasks and priority', async () => {
    const { req, res } = mockReqRes({
      user: testOwner,
      organizationId: testOrg._id,
      body: {
        title: 'Build Member 3 REST Endpoints',
        description: 'Complete controllers and routes for projects and tasks',
        project: testProject ? testProject._id : 'proj123',
        priority: 'high',
        status: 'todo',
        assignee: testEmployee._id,
        subtasks: [
          { title: 'Project routes', completed: true },
          { title: 'Task routes', completed: false },
        ],
      },
    });

    await createTask(req, res, (err) => {
      if (err) throw err;
    });

    assert.equal(res.statusCode, 201);
    assert.equal(res.data.success, true);
    assert.equal(res.data.task.title, 'Build Member 3 REST Endpoints');
    assert.equal(res.data.task.priority, 'high');
    assert.equal(res.data.task.subtasks.length, 2);
    createdTaskId = res.data.task._id;
  });

  test('GET getTasks returns filtered tasks list', async () => {
    const { req, res } = mockReqRes({
      user: testOwner,
      organizationId: testOrg._id,
      query: { status: 'all', priority: 'high' },
    });

    await getTasks(req, res, (err) => {
      if (err) throw err;
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.data.success, true);
    assert.ok(Array.isArray(res.data.tasks));
  });

  test('GET getTaskById returns task details', async () => {
    const { req, res } = mockReqRes({
      user: testOwner,
      organizationId: testOrg._id,
      params: { id: createdTaskId },
    });

    await getTaskById(req, res, (err) => {
      if (err) throw err;
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.task._id.toString(), createdTaskId.toString());
  });

  test('PATCH updateTaskStatus updates status in Kanban column', async () => {
    const { req, res } = mockReqRes({
      user: testOwner,
      organizationId: testOrg._id,
      params: { id: createdTaskId },
      body: { status: 'in_progress', order: 1 },
    });

    await updateTaskStatus(req, res, (err) => {
      if (err) throw err;
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.task.status, 'in_progress');
  });

  test('PATCH toggleSubtask toggles subtask completion status', async () => {
    const task = await Task.findById(createdTaskId);
    const subtaskId = task.subtasks[1]._id;

    const { req, res } = mockReqRes({
      user: testOwner,
      organizationId: testOrg._id,
      params: { id: createdTaskId, subtaskId: subtaskId.toString() },
    });

    await toggleSubtask(req, res, (err) => {
      if (err) throw err;
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.subtasks[1].completed, true);
  });

  test('DELETE deleteTask removes task', async () => {
    const { req, res } = mockReqRes({
      user: testOwner,
      organizationId: testOrg._id,
      params: { id: createdTaskId },
    });

    await deleteTask(req, res, (err) => {
      if (err) throw err;
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.data.success, true);
  });
});

describe('3. Workspaces & KPI Statistics (controllers/workspaceController.js)', () => {
  test('GET getWorkspaces returns workspaces list', async () => {
    const { req, res } = mockReqRes({
      user: testOwner,
      organizationId: testOrg._id,
    });

    await getWorkspaces(req, res, (err) => {
      if (err) throw err;
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.data.success, true);
    assert.ok(Array.isArray(res.data.workspaces));
  });

  test('GET getStats returns computed KPI metrics', async () => {
    const { req, res } = mockReqRes({
      user: testOwner,
      organizationId: testOrg._id,
    });

    await getStats(req, res, (err) => {
      if (err) throw err;
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.data.success, true);
    assert.ok(res.data.kpis);
    assert.ok(typeof res.data.kpis.taskCompletionRate === 'number');
    assert.ok(typeof res.data.kpis.totalTasks === 'number');
  });
});

describe('4. Input Validation Middlewares (middlewares/validate.js)', () => {
  test('validateProjectInput rejects blank project name and missing key', () => {
    const { req, res } = mockReqRes({
      body: { name: '  ', key: '' },
    });

    let nextCalled = false;
    validateProjectInput(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 400);
    assert.equal(res.data.success, false);
    assert.ok(res.data.errors.length >= 2);
  });

  test('validateTaskInput rejects missing project and invalid priority', () => {
    const { req, res } = mockReqRes({
      body: { title: 'Test Task', priority: 'ultra-mega-urgent' },
    });

    let nextCalled = false;
    validateTaskInput(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 400);
    assert.equal(res.data.success, false);
  });

  test('validateStatusUpdate allows valid statuses and rejects unknown status', () => {
    const { req: validReq, res: validRes } = mockReqRes({
      body: { status: 'done' },
    });
    let validNext = false;
    validateStatusUpdate(validReq, validRes, () => {
      validNext = true;
    });
    assert.equal(validNext, true);

    const { req: invalidReq, res: invalidRes } = mockReqRes({
      body: { status: 'invalid_status' },
    });
    let invalidNext = false;
    validateStatusUpdate(invalidReq, invalidRes, () => {
      invalidNext = true;
    });
    assert.equal(invalidNext, false);
    assert.equal(invalidRes.statusCode, 400);
  });
});

describe('5. Error Handler Middleware (middlewares/errorHandler.js)', () => {
  test('formats CastError (bad ObjectId) as 404', () => {
    const { req, res } = mockReqRes();
    const castErr = new Error('Cast Error');
    castErr.name = 'CastError';
    castErr.value = 'invalid_id_123';

    errorHandler(castErr, req, res, () => {});
    assert.equal(res.statusCode, 404);
    assert.match(res.data.message, /Resource not found/i);
  });

  test('formats ValidationError as 400', () => {
    const { req, res } = mockReqRes();
    const valErr = new Error('Validation Error');
    valErr.name = 'ValidationError';
    valErr.errors = {
      name: { message: 'Name is required' },
      email: { message: 'Email is invalid' },
    };

    errorHandler(valErr, req, res, () => {});
    assert.equal(res.statusCode, 400);
    assert.match(res.data.message, /Name is required/i);
  });
});
