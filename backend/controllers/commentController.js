const db = require('../config/database');
const { validationResult } = require('express-validator');

// Get comments for a task
const getComments = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const result = await db.query(
      `SELECT c.*, u.username, u.full_name, u.avatar_url
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.task_id = $1
       ORDER BY c.created_at ASC`,
      [taskId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

// Create new comment
const createComment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { taskId } = req.params;
    const { content } = req.body;

    // Check if task exists
    const taskResult = await db.query('SELECT project_id, title FROM tasks WHERE id = $1', [taskId]);

    if (taskResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const result = await db.query(
      `INSERT INTO comments (task_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [taskId, req.user.id, content]
    );

    // Log activity
    await db.query(
      `INSERT INTO activity_logs (user_id, project_id, task_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.user.id,
        taskResult.rows[0].project_id,
        taskId,
        'commented',
        'comment',
        result.rows[0].id,
        JSON.stringify({ task_title: taskResult.rows[0].title }),
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: {
        ...result.rows[0],
        username: req.user.username,
        full_name: req.user.full_name,
        avatar_url: req.user.avatar_url,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update comment
const updateComment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const { content } = req.body;

    const result = await db.query(
      `UPDATE comments
       SET content = $1
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [content, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found or you are not the author',
      });
    }

    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: {
        ...result.rows[0],
        username: req.user.username,
        full_name: req.user.full_name,
        avatar_url: req.user.avatar_url,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete comment
const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM comments WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found or you are not the author',
      });
    }

    res.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getComments,
  createComment,
  updateComment,
  deleteComment,
};
