const express = require('express');
const router = express.Router();
const { getWorkspaces, getStats } = require('../controllers/workspaceController');
const { protect } = require('../../member-4-database-auth/middlewares/authMiddleware');
const { scopeToOrganization } = require('../../member-4-database-auth/middlewares/roleMiddleware');

router.use(protect);
router.use(scopeToOrganization);

router.get('/', getWorkspaces);
router.get('/stats', getStats);

module.exports = router;
