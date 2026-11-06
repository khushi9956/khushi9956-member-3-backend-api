const User = require('./User');
const Organization = require('./Organization');
const Workspace = require('./Workspace');
const Project = require('./Project');
const Task = require('./Task');
const Membership = require('./Membership');

const {
  MemoryUser,
  MemoryOrganization,
  MemoryWorkspace,
  MemoryProject,
  MemoryTask,
  MemoryMembership,
} = require('../config/memoryDb');

/**
 * Proxy wrapper: Automatically delegates to Mongoose model when connected to MongoDB,
 * or to MemoryModel when running in Zero-Setup In-Memory mode!
 */
const proxyModel = (mongooseModel, memoryModel) => {
  return new Proxy(mongooseModel, {
    get(target, prop) {
      if (global.useMemoryDb) {
        if (prop in memoryModel) {
          return memoryModel[prop];
        }
      }
      return target[prop];
    },
    construct(target, args) {
      if (global.useMemoryDb) {
        return memoryModel.create(args[0]);
      }
      return new target(...args);
    },
  });
};

module.exports = {
  User: proxyModel(User, MemoryUser),
  Organization: proxyModel(Organization, MemoryOrganization),
  Workspace: proxyModel(Workspace, MemoryWorkspace),
  Project: proxyModel(Project, MemoryProject),
  Task: proxyModel(Task, MemoryTask),
  Membership: proxyModel(Membership, MemoryMembership),
};
