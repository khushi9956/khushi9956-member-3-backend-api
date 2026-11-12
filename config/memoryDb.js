const bcrypt = require('bcryptjs');

// In-Memory Data Store Collections (Fallback when local MongoDB is not running)
const memoryStore = {
  users: [],
  organizations: [],
  workspaces: [],
  projects: [],
  tasks: [],
  memberships: [],
  comments: [],
  attachments: [],
  activities: [],
  notifications: [],
};

const generateId = () => {
  return Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
};

const wrapDocument = (item, collectionName) => {
  if (!item) return item;
  item.save = async function () {
    const idx = memoryStore[collectionName].findIndex(
      (x) => x._id.toString() === this._id.toString()
    );
    if (idx >= 0) memoryStore[collectionName][idx] = this;
    return this;
  };
  item.toObject = function () {
    return { ...this };
  };
  return item;
};

// Seed initial synthetic data directly into memory store
const initMemoryStore = async () => {
  if (memoryStore.users.length > 0) return;

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password123!', salt);

  // ==========================================
  // ORGANIZATION 1: Apex Innovations Corp
  // ==========================================
  const org1Id = generateId();
  const ws1Id = generateId();
  const owner1Id = generateId();
  const manager1Id = generateId();
  const dev1Id = generateId();

  const org1 = wrapDocument(
    {
      _id: org1Id,
      name: 'Apex Innovations Corp',
      slug: 'apex-innovations',
      subscriptionTier: 'enterprise',
      owner: owner1Id,
      createdAt: new Date(),
    },
    'organizations'
  );

  const ws1 = wrapDocument(
    {
      _id: ws1Id,
      name: 'Product & Engineering Workspace',
      organization: org1Id,
      description: 'Core engineering and product collaboration',
      createdAt: new Date(),
    },
    'workspaces'
  );

  const owner1 = wrapDocument(
    {
      _id: owner1Id,
      name: 'Alex Vance (Owner)',
      email: 'owner@apex.com',
      password: passwordHash,
      role: 'owner',
      organization: org1,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
      createdAt: new Date(),
      matchPassword: async function (entered) {
        return await bcrypt.compare(entered, this.password);
      },
    },
    'users'
  );

  const manager1 = wrapDocument(
    {
      _id: manager1Id,
      name: 'Sarah Connor (Manager)',
      email: 'manager@apex.com',
      password: passwordHash,
      role: 'manager',
      organization: org1,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      createdAt: new Date(),
      matchPassword: async function (entered) {
        return await bcrypt.compare(entered, this.password);
      },
    },
    'users'
  );

  const dev1 = wrapDocument(
    {
      _id: dev1Id,
      name: 'David Kim (Employee)',
      email: 'dev@apex.com',
      password: passwordHash,
      role: 'employee',
      organization: org1,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
      createdAt: new Date(),
      matchPassword: async function (entered) {
        return await bcrypt.compare(entered, this.password);
      },
    },
    'users'
  );

  memoryStore.organizations.push(org1);
  memoryStore.workspaces.push(ws1);
  memoryStore.users.push(owner1, manager1, dev1);

  // ==========================================
  // ORGANIZATION 2: Stellar Dynamics Labs (Proves Multi-Tenant Isolation)
  // ==========================================
  const org2Id = generateId();
  const ws2Id = generateId();
  const owner2Id = generateId();
  const dev2Id = generateId();

  const org2 = wrapDocument(
    {
      _id: org2Id,
      name: 'Stellar Dynamics Labs',
      slug: 'stellar-dynamics',
      subscriptionTier: 'pro',
      owner: owner2Id,
      createdAt: new Date(),
    },
    'organizations'
  );

  const ws2 = wrapDocument(
    {
      _id: ws2Id,
      name: 'Research & Operations',
      organization: org2Id,
      description: 'Stellar Dynamics isolated workspace',
      createdAt: new Date(),
    },
    'workspaces'
  );

  const owner2 = wrapDocument(
    {
      _id: owner2Id,
      name: 'Elena Rostova (Stellar Owner)',
      email: 'owner@stellar.com',
      password: passwordHash,
      role: 'owner',
      organization: org2,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena',
      createdAt: new Date(),
      matchPassword: async function (entered) {
        return await bcrypt.compare(entered, this.password);
      },
    },
    'users'
  );

  const dev2 = wrapDocument(
    {
      _id: dev2Id,
      name: 'Liam Chen (Stellar Dev)',
      email: 'dev@stellar.com',
      password: passwordHash,
      role: 'employee',
      organization: org2,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Liam',
      createdAt: new Date(),
      matchPassword: async function (entered) {
        return await bcrypt.compare(entered, this.password);
      },
    },
    'users'
  );

  memoryStore.organizations.push(org2);
  memoryStore.workspaces.push(ws2);
  memoryStore.users.push(owner2, dev2);

  // Org 2 Project & Task
  const pStellarId = generateId();
  const pStellar = wrapDocument(
    {
      _id: pStellarId,
      name: 'Quantum Engine Simulator',
      key: 'QENG',
      description: 'Confidential research project for Stellar Dynamics Labs',
      status: 'active',
      organization: org2Id,
      workspace: ws2Id,
      owner: { _id: owner2Id, name: owner2.name, email: owner2.email },
      members: [{ _id: owner2Id, name: owner2.name, email: owner2.email }],
      startDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    },
    'projects'
  );
  memoryStore.projects.push(pStellar);

  const tStellar = wrapDocument(
    {
      _id: generateId(),
      title: 'Proprietary Quantum Math Core',
      description: 'Stellar confidential task - MUST NOT be visible to Apex users',
      project: { _id: pStellarId, name: pStellar.name, key: pStellar.key },
      workspace: ws2Id,
      organization: org2Id,
      creator: { _id: owner2Id, name: owner2.name, email: owner2.email },
      assignee: { _id: owner2Id, name: owner2.name, email: owner2.email },
      status: 'in_progress',
      priority: 'urgent',
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      labels: ['confidential', 'stellar'],
      subtasks: [],
      order: 0,
      createdAt: new Date(),
    },
    'tasks'
  );
  memoryStore.tasks.push(tStellar);

  // ==========================================
  // Org 1 Projects & Tasks (Week 1 & 2 Base)
  // ==========================================
  const project1Id = generateId();
  const project2Id = generateId();

  const project1 = wrapDocument(
    {
      _id: project1Id,
      name: 'SaaS Platform v2.0',
      key: 'SAAS',
      description:
        'Next-generation team collaboration portal with Kanban board and multi-tenant isolation.',
      status: 'active',
      organization: org1Id,
      workspace: ws1Id,
      owner: { _id: owner1Id, name: owner1.name, email: owner1.email },
      members: [
        { _id: owner1Id, name: owner1.name, email: owner1.email },
        { _id: manager1Id, name: manager1.name, email: manager1.email },
        { _id: dev1Id, name: dev1.name, email: dev1.email },
      ],
      startDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    },
    'projects'
  );

  const project2 = wrapDocument(
    {
      _id: project2Id,
      name: 'Mobile Client Experience',
      key: 'MOB',
      description: 'Responsive mobile web application and offline sync features.',
      status: 'active',
      organization: org1Id,
      workspace: ws1Id,
      owner: { _id: manager1Id, name: manager1.name, email: manager1.email },
      members: [
        { _id: manager1Id, name: manager1.name, email: manager1.email },
        { _id: dev1Id, name: dev1.name, email: dev1.email },
      ],
      startDate: new Date(),
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    },
    'projects'
  );

  memoryStore.projects.push(project1, project2);

  const task1Id = generateId();
  const task2Id = generateId();
  const task3Id = generateId();
  const task4Id = generateId();

  const rawTasks = [
    {
      _id: task1Id,
      title: 'Design Multi-Tenant Architecture & Wireframes',
      description:
        'Prepare high-level component hierarchy, ER diagram, and authenticated app shell layout.',
      project: { _id: project1Id, name: project1.name, key: project1.key },
      workspace: ws1Id,
      organization: org1Id,
      creator: { _id: owner1Id, name: owner1.name, email: owner1.email },
      assignee: { _id: owner1Id, name: owner1.name, email: owner1.email },
      status: 'done',
      priority: 'high',
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      labels: ['architecture', 'ux'],
      subtasks: [
        { _id: generateId(), title: 'Create DB Schemas', completed: true },
        { _id: generateId(), title: 'Define Role Permissions', completed: true },
      ],
      order: 0,
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
    {
      _id: task2Id,
      title: 'Build Secure JWT Authentication & Role Middleware',
      description:
        'Implement login, register, token verification, and owner/manager/employee permission checks.',
      project: { _id: project1Id, name: project1.name, key: project1.key },
      workspace: ws1Id,
      organization: org1Id,
      creator: { _id: manager1Id, name: manager1.name, email: manager1.email },
      assignee: { _id: manager1Id, name: manager1.name, email: manager1.email },
      status: 'done',
      priority: 'urgent',
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      labels: ['backend', 'security'],
      subtasks: [{ _id: generateId(), title: 'Hash passwords with bcrypt', completed: true }],
      order: 1,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      _id: task3Id,
      title: 'Implement Interactive Kanban Board with Drag & Drop',
      description:
        'Build responsive Kanban columns for Todo, In Progress, Review, and Done with smooth drag-and-drop state updates.',
      project: { _id: project1Id, name: project1.name, key: project1.key },
      workspace: ws1Id,
      organization: org1Id,
      creator: { _id: manager1Id, name: manager1.name, email: manager1.email },
      assignee: { _id: dev1Id, name: dev1.name, email: dev1.email },
      status: 'in_progress',
      priority: 'high',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      labels: ['frontend', 'kanban'],
      subtasks: [
        { _id: generateId(), title: 'Column layout with status headers', completed: true },
        { _id: generateId(), title: 'HTML5 drag-and-drop handlers', completed: false },
      ],
      order: 0,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      _id: task4Id,
      title: 'Add Dynamic Task Search & Multi-criteria Filtering',
      description:
        'Filter tasks instantly by priority (low, medium, high, urgent), status, and assignee in real-time.',
      project: { _id: project1Id, name: project1.name, key: project1.key },
      workspace: ws1Id,
      organization: org1Id,
      creator: { _id: owner1Id, name: owner1.name, email: owner1.email },
      assignee: { _id: dev1Id, name: dev1.name, email: dev1.email },
      status: 'todo',
      priority: 'urgent',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      labels: ['frontend', 'filters'],
      subtasks: [{ _id: generateId(), title: 'Search query debounce', completed: false }],
      order: 0,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const t of rawTasks) {
    t.subtasks.id = function (id) {
      return this.find((st) => st._id.toString() === id.toString());
    };
    memoryStore.tasks.push(wrapDocument(t, 'tasks'));
  }

  // ==========================================
  // Week 3 Deliverables: Comments, Attachments, Activity, Notifications
  // ==========================================
  // 1. Comments
  memoryStore.comments.push(
    wrapDocument(
      {
        _id: generateId(),
        task: task3Id,
        organization: org1Id,
        user: { _id: manager1Id, name: manager1.name, avatar: manager1.avatar, role: 'manager' },
        content:
          'HTML5 Drag-and-drop test passed smoothly! Make sure to test status fallback on mobile touch screens as well.',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      },
      'comments'
    ),
    wrapDocument(
      {
        _id: generateId(),
        task: task3Id,
        organization: org1Id,
        user: { _id: dev1Id, name: dev1.name, avatar: dev1.avatar, role: 'employee' },
        content:
          'Understood, added a quick status dropdown right on each task card for accessible keyboard & mobile usage.',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      },
      'comments'
    )
  );

  // 2. Attachments
  memoryStore.attachments.push(
    wrapDocument(
      {
        _id: generateId(),
        task: task3Id,
        organization: org1Id,
        originalName: 'kanban-workflow-wireframe.png',
        fileName: 'kanban-workflow-wireframe.png',
        fileSize: 245800, // 245 KB
        mimeType: 'image/png',
        uploadedBy: { _id: manager1Id, name: manager1.name },
        downloadCount: 4,
        createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
      },
      'attachments'
    ),
    wrapDocument(
      {
        _id: generateId(),
        task: task1Id,
        organization: org1Id,
        originalName: 'system-architecture-spec.pdf',
        fileName: 'system-architecture-spec.pdf',
        fileSize: 1048576, // 1 MB
        mimeType: 'application/pdf',
        uploadedBy: { _id: owner1Id, name: owner1.name },
        downloadCount: 9,
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      },
      'attachments'
    )
  );

  // 3. Activity History Events
  memoryStore.activities.push(
    wrapDocument(
      {
        _id: generateId(),
        organization: org1Id,
        project: project1Id,
        task: task3Id,
        user: { _id: manager1Id, name: manager1.name },
        action: 'status_changed',
        details: 'moved task from "todo" to "in_progress"',
        createdAt: new Date(Date.now() - 14 * 60 * 60 * 1000),
      },
      'activities'
    ),
    wrapDocument(
      {
        _id: generateId(),
        organization: org1Id,
        project: project1Id,
        task: task3Id,
        user: { _id: manager1Id, name: manager1.name },
        action: 'comment_added',
        details: 'posted a new comment on Kanban board accessibility',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      },
      'activities'
    ),
    wrapDocument(
      {
        _id: generateId(),
        organization: org1Id,
        project: project1Id,
        task: task4Id,
        user: { _id: owner1Id, name: owner1.name },
        action: 'task_created',
        details: 'created new task "Add Dynamic Task Search & Multi-criteria Filtering"',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      'activities'
    ),
    wrapDocument(
      {
        _id: generateId(),
        organization: org1Id,
        project: project1Id,
        task: task1Id,
        user: { _id: owner1Id, name: owner1.name },
        action: 'status_changed',
        details: 'marked task as "done"',
        createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
      },
      'activities'
    )
  );

  // 4. In-App Notifications (Notification Center)
  memoryStore.notifications.push(
    wrapDocument(
      {
        _id: generateId(),
        recipient: dev1Id,
        organization: org1Id,
        sender: { _id: manager1Id, name: manager1.name },
        title: 'Task Assigned',
        message: 'Sarah Connor assigned you to "Implement Interactive Kanban Board"',
        type: 'assignment',
        link: `/tasks/${task3Id}`,
        isRead: false,
        createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
      },
      'notifications'
    ),
    wrapDocument(
      {
        _id: generateId(),
        recipient: dev1Id,
        organization: org1Id,
        sender: { _id: manager1Id, name: manager1.name },
        title: 'New Comment',
        message: 'Sarah Connor commented on "Implement Interactive Kanban Board"',
        type: 'comment',
        link: `/tasks/${task3Id}`,
        isRead: false,
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      },
      'notifications'
    ),
    wrapDocument(
      {
        _id: generateId(),
        recipient: dev1Id,
        organization: org1Id,
        sender: null,
        title: 'Deadline Approaching',
        message: 'Task "Add Dynamic Task Search" is due in 3 days',
        type: 'deadline',
        link: `/tasks/${task4Id}`,
        isRead: true,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      },
      'notifications'
    )
  );
};

class MemoryQuery {
  constructor(data) {
    this.data = Array.isArray(data) ? [...data] : data ? [{ ...data }] : [];
  }

  populate() {
    return this;
  }

  select() {
    return this;
  }

  sort(sortObj) {
    if (sortObj && typeof sortObj === 'object') {
      const field = Object.keys(sortObj)[0];
      const dir = sortObj[field];
      this.data.sort((a, b) => {
        const valA = a[field];
        const valB = b[field];
        if (dir === -1) {
          return valA > valB ? -1 : valA < valB ? 1 : 0;
        }
        return valA > valB ? 1 : valA < valB ? -1 : 0;
      });
    }
    return this;
  }

  limit(count) {
    this.data = this.data.slice(0, count);
    return this;
  }

  then(resolve, reject) {
    resolve(this.data);
  }
}

class SingleQuery {
  constructor(item) {
    this.item = item ? item : null;
  }

  populate() {
    return this;
  }

  select() {
    return this;
  }

  sort() {
    return this;
  }

  then(resolve, reject) {
    resolve(this.item);
  }
}

const createMemoryModel = (collectionName) => {
  return {
    find: (filter = {}) => {
      let list = memoryStore[collectionName] || [];
      if (filter.organization) {
        list = list.filter((item) => {
          const org = item.organization?._id || item.organization;
          return org?.toString() === filter.organization.toString();
        });
      }
      if (filter.project) {
        list = list.filter((item) => {
          const proj = item.project?._id || item.project;
          return proj?.toString() === filter.project.toString();
        });
      }
      if (filter.task) {
        list = list.filter((item) => {
          const tk = item.task?._id || item.task;
          return tk?.toString() === filter.task.toString();
        });
      }
      if (filter.recipient) {
        list = list.filter((item) => {
          const rc = item.recipient?._id || item.recipient;
          return rc?.toString() === filter.recipient.toString();
        });
      }
      if (filter.status && filter.status !== 'all') {
        list = list.filter((item) => item.status === filter.status);
      }
      if (filter.priority && filter.priority !== 'all') {
        list = list.filter((item) => item.priority === filter.priority);
      }
      if (filter.isRead !== undefined) {
        list = list.filter((item) => item.isRead === filter.isRead);
      }
      if (filter.assignee && filter.assignee !== 'all') {
        list = list.filter((item) => {
          const asg = item.assignee?._id || item.assignee;
          return asg?.toString() === filter.assignee.toString();
        });
      }
      if (filter.$or && Array.isArray(filter.$or)) {
        list = list.filter((item) => {
          return filter.$or.some((clause) => {
            if (clause.title?.$regex) {
              const regex = new RegExp(clause.title.$regex, clause.title.$options || 'i');
              if (regex.test(item.title || '')) return true;
            }
            if (clause.description?.$regex) {
              const regex = new RegExp(clause.description.$regex, clause.description.$options || 'i');
              if (regex.test(item.description || '')) return true;
            }
            return false;
          });
        });
      }
      return new MemoryQuery(list);
    },

    findOne: (filter = {}) => {
      const list = memoryStore[collectionName] || [];
      const item = list.find((it) => {
        if (filter._id && it._id.toString() !== filter._id.toString()) return false;
        if (filter.email && it.email.toLowerCase() !== filter.email.toLowerCase()) return false;
        if (filter.key && it.key !== filter.key) return false;
        if (filter.organization) {
          const org = it.organization?._id || it.organization;
          if (org?.toString() !== filter.organization.toString()) return false;
        }
        return true;
      });
      return new SingleQuery(item);
    },

    findById: (id) => {
      const list = memoryStore[collectionName] || [];
      const item = list.find((it) => it._id.toString() === id.toString());
      return new SingleQuery(item);
    },

    create: async (payload) => {
      const isArray = Array.isArray(payload);
      const items = isArray ? payload : [payload];
      const created = [];

      for (const item of items) {
        const doc = wrapDocument(
          {
            _id: generateId(),
            ...item,
            createdAt: new Date(),
          },
          collectionName
        );

        if (doc.subtasks && Array.isArray(doc.subtasks)) {
          doc.subtasks = doc.subtasks.map((st) => ({
            _id: generateId(),
            ...st,
          }));
          doc.subtasks.id = function (subId) {
            return this.find((s) => s._id.toString() === subId.toString());
          };
        }

        if (collectionName === 'users') {
          doc.matchPassword = async function (entered) {
            return await bcrypt.compare(entered, this.password);
          };
          if (!doc.password.startsWith('$2a$') && !doc.password.startsWith('$2b$')) {
            const salt = await bcrypt.genSalt(10);
            doc.password = await bcrypt.hash(doc.password, salt);
          }
        }

        memoryStore[collectionName].push(doc);
        created.push(doc);
      }

      return isArray ? created : created[0];
    },

    countDocuments: async (filter = {}) => {
      let list = memoryStore[collectionName] || [];
      if (filter.organization) {
        list = list.filter((it) => {
          const org = it.organization?._id || it.organization;
          return org?.toString() === filter.organization.toString();
        });
      }
      if (filter.recipient) {
        list = list.filter((it) => {
          const rc = it.recipient?._id || it.recipient;
          return rc?.toString() === filter.recipient.toString();
        });
      }
      if (filter.isRead !== undefined) {
        list = list.filter((it) => it.isRead === filter.isRead);
      }
      if (filter.status) {
        if (filter.status.$ne) {
          list = list.filter((it) => it.status !== filter.status.$ne);
        } else {
          list = list.filter((it) => it.status === filter.status);
        }
      }
      if (filter.project) {
        list = list.filter((it) => {
          const pr = it.project?._id || it.project;
          return pr?.toString() === filter.project.toString();
        });
      }
      if (filter.assignee && filter.assignee.$ne === null) {
        list = list.filter((it) => it.assignee !== null);
      }
      if (filter.dueDate && filter.dueDate.$lt) {
        list = list.filter((it) => it.dueDate && new Date(it.dueDate) < filter.dueDate.$lt);
      }
      return list.length;
    },

    updateMany: async (filter = {}, update = {}) => {
      let list = memoryStore[collectionName] || [];
      let updatedCount = 0;
      for (const it of list) {
        let match = true;
        if (filter.recipient && it.recipient?.toString() !== filter.recipient.toString()) {
          match = false;
        }
        if (filter.isRead !== undefined && it.isRead !== filter.isRead) {
          match = false;
        }
        if (match && update.$set) {
          Object.assign(it, update.$set);
          updatedCount++;
        }
      }
      return { acknowledged: true, modifiedCount: updatedCount };
    },

    deleteMany: async () => {
      memoryStore[collectionName] = [];
      return { acknowledged: true, deletedCount: 0 };
    },

    deleteOne: async (filter = {}) => {
      if (filter._id) {
        memoryStore[collectionName] = memoryStore[collectionName].filter(
          (it) => it._id.toString() !== filter._id.toString()
        );
      }
      return { acknowledged: true, deletedCount: 1 };
    },
  };
};

module.exports = {
  initMemoryStore,
  memoryStore,
  MemoryUser: createMemoryModel('users'),
  MemoryOrganization: createMemoryModel('organizations'),
  MemoryWorkspace: createMemoryModel('workspaces'),
  MemoryProject: createMemoryModel('projects'),
  MemoryTask: createMemoryModel('tasks'),
  MemoryMembership: createMemoryModel('memberships'),
  MemoryComment: createMemoryModel('comments'),
  MemoryAttachment: createMemoryModel('attachments'),
  MemoryActivity: createMemoryModel('activities'),
  MemoryNotification: createMemoryModel('notifications'),
};
