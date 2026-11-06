const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');
const { protect } = require('../middlewares/authMiddleware');
const {
  authorizeRoles,
  scopeToOrganization,
} = require('../middlewares/roleMiddleware');
const { validateProjectInput, validateProjectUpdate } = require('../middlewares/validate');

// All project routes require authentication and organization scoping
router.use(protect);
router.use(scopeToOrganization);

router
  .route('/')
  .get(getProjects)
  .post(authorizeRoles('owner', 'manager'), validateProjectInput, createProject);

router
  .route('/:id')
  .get(getProjectById)
  .put(authorizeRoles('owner', 'manager'), validateProjectUpdate, updateProject)
  .delete(authorizeRoles('owner'), deleteProject);

module.exports = router;
