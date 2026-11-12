const { Workspace, Project, Task, User } = require('../../member-4-database-auth/models');

/**
 * @desc    Get all workspaces for organization
 * @route   GET /api/workspaces
 * @access  Private
 */
const getWorkspaces = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    const workspaces = await Workspace.find({ organization: orgId }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: workspaces.length,
      workspaces,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get dashboard metrics & KPIs (Week 1 & 2 requirements)
 * @route   GET /api/stats
 * @access  Private
 */
const getStats = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    const now = new Date();

    const [
      totalTasks,
      completedTasks,
      inProgressTasks,
      reviewTasks,
      todoTasks,
      activeProjects,
      totalUsers,
      assignedTasks,
    ] = await Promise.all([
      Task.countDocuments({ organization: orgId }),
      Task.countDocuments({ organization: orgId, status: 'done' }),
      Task.countDocuments({ organization: orgId, status: 'in_progress' }),
      Task.countDocuments({ organization: orgId, status: 'review' }),
      Task.countDocuments({ organization: orgId, status: 'todo' }),
      Project.countDocuments({ organization: orgId, status: 'active' }),
      User.countDocuments({ organization: orgId }),
      Task.countDocuments({ organization: orgId, assignee: { $ne: null } }),
    ]);

    // Overdue tasks: dueDate exists, dueDate < now, and status is NOT done
    const overdueTasks = await Task.countDocuments({
      organization: orgId,
      dueDate: { $lt: now },
      status: { $ne: 'done' },
    });

    // Core KPIs
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const assignmentCoverageRate = totalTasks > 0 ? Math.round((assignedTasks / totalTasks) * 100) : 0;

    res.status(200).json({
      success: true,
      kpis: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        reviewTasks,
        todoTasks,
        activeProjects,
        totalTeamMembers: totalUsers,
        overdueTasks,
        taskCompletionRate,
        assignmentCoverageRate,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWorkspaces,
  getStats,
};
