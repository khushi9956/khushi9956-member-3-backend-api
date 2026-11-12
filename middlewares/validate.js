/**
 * Input validation helpers and middleware for Request Payloads
 */

const validateProjectInput = (req, res, next) => {
  const { name, key } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Project name is required and must be non-empty.');
  } else if (name.trim().length > 100) {
    errors.push('Project name cannot exceed 100 characters.');
  }

  if (!key || typeof key !== 'string' || key.trim().length === 0) {
    errors.push('Project key is required (e.g., SAAS, DEV).');
  } else if (key.trim().length > 10) {
    errors.push('Project key cannot exceed 10 characters.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed for project payload',
      errors,
    });
  }

  next();
};

const validateTaskInput = (req, res, next) => {
  const { title, project, priority, status } = req.body;
  const errors = [];

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push('Task title is required.');
  } else if (title.trim().length > 200) {
    errors.push('Task title cannot exceed 200 characters.');
  }

  if (!project && req.method === 'POST') {
    errors.push('Associated project ID is required for task creation.');
  }

  if (priority && !['low', 'medium', 'high', 'urgent'].includes(priority)) {
    errors.push('Priority must be one of: low, medium, high, urgent.');
  }

  if (status && !['todo', 'in_progress', 'review', 'done'].includes(status)) {
    errors.push('Status must be one of: todo, in_progress, review, done.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed for task payload',
      errors,
    });
  }

  next();
};

const validateStatusUpdate = (req, res, next) => {
  const { status } = req.body;
  if (!status || !['todo', 'in_progress', 'review', 'done'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Must be one of: todo, in_progress, review, done.',
    });
  }
  next();
};

module.exports = {
  validateProjectInput,
  validateTaskInput,
  validateStatusUpdate,
};
