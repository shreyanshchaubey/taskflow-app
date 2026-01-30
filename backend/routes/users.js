const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const db = require('../config/database');

// All routes require authentication
router.use(auth);

// GET /api/users/search - Search users by email or username
router.get('/search', async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters',
      });
    }

    const result = await db.query(
      `SELECT id, username, email, full_name, avatar_url
       FROM users
       WHERE (username ILIKE $1 OR email ILIKE $1 OR full_name ILIKE $1)
       AND id != $2
       LIMIT 10`,
      [`%${q}%`, req.user.id]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:id - Get user profile
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT id, username, email, full_name, avatar_url, created_at
       FROM users WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:id/activity - Get user's recent activity
router.get('/:id/activity', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 20 } = req.query;

    const result = await db.query(
      `SELECT al.*, p.name as project_name, t.title as task_title
       FROM activity_logs al
       LEFT JOIN projects p ON al.project_id = p.id
       LEFT JOIN tasks t ON al.task_id = t.id
       WHERE al.user_id = $1
       ORDER BY al.created_at DESC
       LIMIT $2`,
      [id, parseInt(limit)]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
