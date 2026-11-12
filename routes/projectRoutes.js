const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');
const { protect } = require('../../member-4-database-auth/middlewares/authMiddleware');
const {
  authorizeRoles,
  scopeToOrganization,
} = require('../../member-4-database-auth/middlewares/roleMiddleware');
const { validateProjectInput } = require('../middlewares/validate');

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
  .put(authorizeRoles('owner', 'manager'), updateProject)
  .delete(authorizeRoles('owner'), deleteProject);

module.exports = router;
