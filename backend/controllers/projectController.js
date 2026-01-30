const db = require('../config/database');
const { validationResult } = require('express-validator');

// Get all projects for current user
const getProjects = async (req, res, next) => {
  try {
    const { status, search } = req.query;

    let query = `
      SELECT DISTINCT p.*, 
        u.username as owner_username,
        u.full_name as owner_name,
        u.avatar_url as owner_avatar,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') as completed_task_count,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) + 1 as member_count
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE (p.owner_id = $1 OR pm.user_id = $1)
    `;

    const params = [req.user.id];
    let paramIndex = 2;

    if (status && status !== 'all') {
      query += ` AND p.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      query += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ' ORDER BY p.updated_at DESC';

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

// Get single project by ID
const getProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const projectResult = await db.query(
      `SELECT p.*, 
        u.username as owner_username,
        u.full_name as owner_name,
        u.avatar_url as owner_avatar
       FROM projects p
       JOIN users u ON p.owner_id = u.id
       WHERE p.id = $1`,
      [id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Get project members
    const membersResult = await db.query(
      `SELECT pm.role, pm.joined_at, u.id, u.username, u.email, u.full_name, u.avatar_url
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = $1
       ORDER BY pm.joined_at ASC`,
      [id]
    );

    // Get task statistics
    const taskStats = await db.query(
      `SELECT 
        status,
        COUNT(*) as count
       FROM tasks
       WHERE project_id = $1
       GROUP BY status`,
      [id]
    );

    const stats = {
      todo: 0,
      in_progress: 0,
      review: 0,
      done: 0,
    };

    taskStats.rows.forEach((row) => {
      stats[row.status] = parseInt(row.count);
    });

    res.json({
      success: true,
      data: {
        ...projectResult.rows[0],
        members: membersResult.rows,
        taskStats: stats,
        totalTasks: Object.values(stats).reduce((a, b) => a + b, 0),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create new project
const createProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { name, description, color } = req.body;

    const result = await db.query(
      `INSERT INTO projects (name, description, color, owner_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, description || null, color || '#6366f1', req.user.id]
    );

    // Log activity
    await db.query(
      `INSERT INTO activity_logs (user_id, project_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user.id, result.rows[0].id, 'created', 'project', result.rows[0].id, JSON.stringify({ name })]
    );

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Update project
const updateProject = async (req, res, next) => {
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
    const { name, description, color, status } = req.body;

    const result = await db.query(
      `UPDATE projects
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           color = COALESCE($3, color),
           status = COALESCE($4, status)
       WHERE id = $5 AND owner_id = $6
       RETURNING *`,
      [name, description, color, status, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or you are not the owner',
      });
    }

    // Log activity
    await db.query(
      `INSERT INTO activity_logs (user_id, project_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user.id, id, 'updated', 'project', id, JSON.stringify({ name })]
    );

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Delete project
const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM projects WHERE id = $1 AND owner_id = $2 RETURNING id, name',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or you are not the owner',
      });
    }

    res.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Add member to project
const addMember = async (req, res, next) => {
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
    const { email, role } = req.body;

    // Find user by email
    const userResult = await db.query(
      'SELECT id, username, email, full_name, avatar_url FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email',
      });
    }

    const user = userResult.rows[0];

    // Check if user is already a member or owner
    const projectResult = await db.query(
      'SELECT owner_id FROM projects WHERE id = $1',
      [id]
    );

    if (projectResult.rows[0].owner_id === user.id) {
      return res.status(400).json({
        success: false,
        message: 'User is already the owner of this project',
      });
    }

    // Add member
    const result = await db.query(
      `INSERT INTO project_members (project_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (project_id, user_id) DO UPDATE SET role = $3
       RETURNING *`,
      [id, user.id, role || 'member']
    );

    // Log activity
    await db.query(
      `INSERT INTO activity_logs (user_id, project_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user.id, id, 'added_member', 'project_member', result.rows[0].id, JSON.stringify({ member: user.email })]
    );

    res.status(201).json({
      success: true,
      message: 'Member added successfully',
      data: {
        ...result.rows[0],
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Remove member from project
const removeMember = async (req, res, next) => {
  try {
    const { id, userId } = req.params;

    const result = await db.query(
      'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in this project',
      });
    }

    // Log activity
    await db.query(
      `INSERT INTO activity_logs (user_id, project_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user.id, id, 'removed_member', 'project_member', result.rows[0].id, JSON.stringify({ removed_user_id: userId })]
    );

    res.json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Get project activity
const getProjectActivity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 20 } = req.query;

    const result = await db.query(
      `SELECT al.*, u.username, u.full_name, u.avatar_url
       FROM activity_logs al
       JOIN users u ON al.user_id = u.id
       WHERE al.project_id = $1
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
};

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  getProjectActivity,
};
