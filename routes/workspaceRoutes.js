const express = require('express');
const router = express.Router();
const { getWorkspaces, getStats } = require('../controllers/workspaceController');
const { protect } = require('../middlewares/authMiddleware');
const { scopeToOrganization } = require('../middlewares/roleMiddleware');

router.use(protect);
router.use(scopeToOrganization);

router.get('/', getWorkspaces);
router.get('/stats', getStats);

module.exports = router;
