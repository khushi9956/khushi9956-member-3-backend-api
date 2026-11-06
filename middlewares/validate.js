// Request validation for projects and tasks.

const TASK_STATUSES = ['todo', 'in_progress', 'review', 'done'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const PROJECT_STATUSES = ['planning', 'active', 'completed', 'on_hold', 'archived'];

const isBlank = (value) => typeof value !== 'string' || value.trim().length === 0;

// An empty value means "no date". Anything else must be a real date string.
const dateProblem = (value, label) => {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || Number.isNaN(new Date(value).getTime())) {
    return `${label} is not a valid date.`;
  }
  return null;
};

const idListProblem = (value, label) => {
  if (value === undefined) return null;
  if (!Array.isArray(value) || value.some((id) => typeof id !== 'string')) {
    return `${label} must be a list of ids.`;
  }
  return null;
};

const reject = (res, message, errors) =>
  res.status(400).json({ success: false, message, errors });

const projectProblems = (body, { creating }) => {
  const { name, key, dueDate, status, members, description } = body;
  const errors = [];

  if (creating || name !== undefined) {
    if (isBlank(name)) errors.push('Project name is required and must be non-empty.');
    else if (name.trim().length > 100) errors.push('Project name cannot exceed 100 characters.');
  }
  if (creating) {
    if (isBlank(key)) errors.push('Project key is required (e.g., SAAS, DEV).');
    else if (key.trim().length > 10) errors.push('Project key cannot exceed 10 characters.');
  }
  if (description !== undefined && (typeof description !== 'string' || description.length > 2000)) {
    errors.push('Description must be text of at most 2000 characters.');
  }
  if (status !== undefined && !PROJECT_STATUSES.includes(status)) {
    errors.push(`Status must be one of: ${PROJECT_STATUSES.join(', ')}.`);
  }
  [dateProblem(dueDate, 'Due date'), idListProblem(members, 'Members')].forEach((p) => p && errors.push(p));
  return errors;
};

const taskProblems = (body, { creating }) => {
  const { title, project, priority, status, dueDate, assignee, description, labels, subtasks } = body;
  const errors = [];

  if (creating || title !== undefined) {
    if (isBlank(title)) errors.push('Task title is required.');
    else if (title.trim().length > 200) errors.push('Task title cannot exceed 200 characters.');
  }
  if (creating && (typeof project !== 'string' || !project)) {
    errors.push('Associated project ID is required for task creation.');
  }
  if (priority !== undefined && !PRIORITIES.includes(priority)) {
    errors.push(`Priority must be one of: ${PRIORITIES.join(', ')}.`);
  }
  if (status !== undefined && !TASK_STATUSES.includes(status)) {
    errors.push(`Status must be one of: ${TASK_STATUSES.join(', ')}.`);
  }
  if (assignee !== undefined && assignee !== null && typeof assignee !== 'string') {
    errors.push('Assignee must be a user id.');
  }
  if (description !== undefined && (typeof description !== 'string' || description.length > 5000)) {
    errors.push('Description must be text of at most 5000 characters.');
  }
  if (labels !== undefined && (!Array.isArray(labels) || labels.some((l) => typeof l !== 'string'))) {
    errors.push('Labels must be a list of text values.');
  }
  if (subtasks !== undefined) {
    const ok = Array.isArray(subtasks) && subtasks.every((s) => s && typeof s.title === 'string' && s.title.trim());
    if (!ok) errors.push('Each subtask needs a title.');
  }
  const dateError = dateProblem(dueDate, 'Due date');
  if (dateError) errors.push(dateError);
  return errors;
};

const validateProjectInput = (req, res, next) => {
  const errors = projectProblems(req.body, { creating: true });
  if (errors.length) return reject(res, 'Validation failed for project payload', errors);
  next();
};

const validateProjectUpdate = (req, res, next) => {
  const errors = projectProblems(req.body, { creating: false });
  if (errors.length) return reject(res, 'Validation failed for project payload', errors);
  next();
};

const validateTaskInput = (req, res, next) => {
  const errors = taskProblems(req.body, { creating: true });
  if (errors.length) return reject(res, 'Validation failed for task payload', errors);
  next();
};

const validateTaskUpdate = (req, res, next) => {
  const errors = taskProblems(req.body, { creating: false });
  if (errors.length) return reject(res, 'Validation failed for task payload', errors);
  next();
};

const validateStatusUpdate = (req, res, next) => {
  const { status, order } = req.body;
  if (!TASK_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${TASK_STATUSES.join(', ')}.`,
    });
  }
  if (order !== undefined && !Number.isFinite(order)) {
    return res.status(400).json({ success: false, message: 'Order must be a number.' });
  }
  next();
};

module.exports = {
  validateProjectInput,
  validateProjectUpdate,
  validateTaskInput,
  validateTaskUpdate,
  validateStatusUpdate,
};
