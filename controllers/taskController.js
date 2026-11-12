const { Task, Project } = require('../../member-4-database-auth/models');

/**
 * @desc    Get tasks with filtering (projectId, status, priority, assignee, search)
 * @route   GET /api/tasks
 * @access  Private
 */
const getTasks = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    const { projectId, status, priority, assignee, search } = req.query;

    const filter = { organization: orgId };

    if (projectId) {
      filter.project = projectId;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (priority && priority !== 'all') {
      filter.priority = priority;
    }

    if (assignee && assignee !== 'all') {
      filter.assignee = assignee;
    }

    if (search && search.trim() !== '') {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { labels: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const tasks = await Task.find(filter)
      .populate('assignee', 'name email avatar')
      .populate('creator', 'name email avatar')
      .populate('project', 'name key')
      .sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single task by ID
 * @route   GET /api/tasks/:id
 * @access  Private
 */
const getTaskById = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    const task = await Task.findOne({
      _id: req.params.id,
      organization: orgId,
    })
      .populate('assignee', 'name email avatar')
      .populate('creator', 'name email avatar')
      .populate('project', 'name key');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found in your organization',
      });
    }

    res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new task
 * @route   POST /api/tasks
 * @access  Private
 */
const createTask = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    const {
      title,
      description,
      project: projectId,
      assignee,
      priority,
      status,
      dueDate,
      labels,
      subtasks,
    } = req.body;

    // Validate project belongs to user's organization
    const project = await Project.findOne({
      _id: projectId,
      organization: orgId,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Associated project not found in your organization.',
      });
    }

    // Determine max order within the status column
    const highestOrderTask = await Task.findOne({
      project: project._id,
      status: status || 'todo',
    }).sort({ order: -1 });

    const order = highestOrderTask ? highestOrderTask.order + 1 : 0;

    const task = await Task.create({
      title: title.trim(),
      description: description || '',
      project: project._id,
      workspace: project.workspace,
      organization: orgId,
      creator: req.user._id,
      assignee: assignee || null,
      priority: priority || 'medium',
      status: status || 'todo',
      dueDate: dueDate || null,
      labels: Array.isArray(labels) ? labels : [],
      subtasks: Array.isArray(subtasks) ? subtasks : [],
      order,
    });

    const populated = await Task.findById(task._id)
      .populate('assignee', 'name email avatar')
      .populate('creator', 'name email avatar')
      .populate('project', 'name key');

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update task details
 * @route   PUT /api/tasks/:id
 * @access  Private
 */
const updateTask = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    let task = await Task.findOne({ _id: req.params.id, organization: orgId });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found in your organization',
      });
    }

    const {
      title,
      description,
      priority,
      status,
      assignee,
      dueDate,
      labels,
      subtasks,
    } = req.body;

    if (title) task.title = title.trim();
    if (description !== undefined) task.description = description;
    if (priority) task.priority = priority;
    if (status) task.status = status;
    if (assignee !== undefined) task.assignee = assignee || null;
    if (dueDate !== undefined) task.dueDate = dueDate || null;
    if (labels && Array.isArray(labels)) task.labels = labels;
    if (subtasks && Array.isArray(subtasks)) task.subtasks = subtasks;

    await task.save();

    const updated = await Task.findById(task._id)
      .populate('assignee', 'name email avatar')
      .populate('creator', 'name email avatar')
      .populate('project', 'name key');

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      task: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update task status & order (Dedicated for Kanban Board Drag & Drop)
 * @route   PATCH /api/tasks/:id/status
 * @access  Private
 */
const updateTaskStatus = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    const { status, order } = req.body;

    const task = await Task.findOne({ _id: req.params.id, organization: orgId });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found in your organization',
      });
    }

    task.status = status;
    if (order !== undefined) {
      task.order = order;
    }

    await task.save();

    const populated = await Task.findById(task._id)
      .populate('assignee', 'name email avatar')
      .populate('creator', 'name email avatar')
      .populate('project', 'name key');

    res.status(200).json({
      success: true,
      message: `Task moved to '${status}' successfully`,
      task: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle subtask completion
 * @route   PATCH /api/tasks/:id/subtasks/:subtaskId
 * @access  Private
 */
const toggleSubtask = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    const task = await Task.findOne({ _id: req.params.id, organization: orgId });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const subtask = task.subtasks.id(req.params.subtaskId);
    if (!subtask) {
      return res.status(404).json({
        success: false,
        message: 'Subtask not found in this task',
      });
    }

    subtask.completed = !subtask.completed;
    await task.save();

    res.status(200).json({
      success: true,
      message: 'Subtask updated',
      subtasks: task.subtasks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete task
 * @route   DELETE /api/tasks/:id
 * @access  Private (Owner, Manager, or Task Creator)
 */
const deleteTask = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    const task = await Task.findOne({ _id: req.params.id, organization: orgId });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found in your organization',
      });
    }

    // Role check: Only Owner, Manager, or the Creator can delete task
    const isOwnerOrManager = ['owner', 'manager'].includes(req.user.role);
    const isCreator = task.creator.toString() === req.user._id.toString();

    if (!isOwnerOrManager && !isCreator) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this task. Only managers, owners, or the creator can delete it.',
      });
    }

    await Task.deleteOne({ _id: task._id });

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  toggleSubtask,
  deleteTask,
};
