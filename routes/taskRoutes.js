const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  toggleSubtask,
  deleteTask,
} = require('../controllers/taskController');
const { protect } = require('../middlewares/authMiddleware');
const { scopeToOrganization } = require('../middlewares/roleMiddleware');
const {
  validateTaskInput,
  validateTaskUpdate,
  validateStatusUpdate,
} = require('../middlewares/validate');

// All task routes require authentication & organization scoping
router.use(protect);
router.use(scopeToOrganization);

router
  .route('/')
  .get(getTasks)
  .post(validateTaskInput, createTask);

router
  .route('/:id')
  .get(getTaskById)
  .put(validateTaskUpdate, updateTask)
  .delete(deleteTask);

// Kanban drag-and-drop status update
router.patch('/:id/status', validateStatusUpdate, updateTaskStatus);

// Subtask checkbox toggle
router.patch('/:id/subtasks/:subtaskId', toggleSubtask);

module.exports = router;
