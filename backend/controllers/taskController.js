const db = require('../config/database');
const { validationResult } = require('express-validator');

// Get all tasks for a project
const getTasks = async (req, res, next) => {
  try {
    const { projectId, status, assignedTo, priority, search } = req.query;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required',
      });
    }

    let query = `
      SELECT t.*, 
        u.username as assigned_username,
        u.full_name as assigned_name,
        u.avatar_url as assigned_avatar,
        creator.username as creator_username,
        creator.full_name as creator_name,
        (SELECT COUNT(*) FROM comments WHERE task_id = t.id) as comment_count,
        (SELECT COUNT(*) FROM attachments WHERE task_id = t.id) as attachment_count
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users creator ON t.created_by = creator.id
      WHERE t.project_id = $1
    `;

    const params = [projectId];
    let paramIndex = 2;

    if (status) {
      query += ` AND t.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (assignedTo) {
      query += ` AND t.assigned_to = $${paramIndex}`;
      params.push(assignedTo);
      paramIndex++;
    }

    if (priority) {
      query += ` AND t.priority = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }

    if (search) {
      query += ` AND (t.title ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ' ORDER BY t.position ASC, t.created_at DESC';

    const result = await db.query(query, params);

    // Group tasks by status for Kanban view
    const tasksByStatus = {
      todo: [],
      in_progress: [],
      review: [],
      done: [],
    };

    result.rows.forEach((task) => {
      if (tasksByStatus[task.status]) {
        tasksByStatus[task.status].push(task);
      }
    });

    res.json({
      success: true,
      data: {
        tasks: result.rows,
        tasksByStatus,
        totalCount: result.rows.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get single task by ID
const getTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const taskResult = await db.query(
      `SELECT t.*, 
        u.username as assigned_username,
        u.full_name as assigned_name,
        u.avatar_url as assigned_avatar,
        creator.username as creator_username,
        creator.full_name as creator_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       LEFT JOIN users creator ON t.created_by = creator.id
       WHERE t.id = $1`,
      [id]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Get comments
    const commentsResult = await db.query(
      `SELECT c.*, u.username, u.full_name, u.avatar_url
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.task_id = $1
       ORDER BY c.created_at ASC`,
      [id]
    );

    // Get attachments
    const attachmentsResult = await db.query(
      `SELECT a.*, u.username, u.full_name
       FROM attachments a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.task_id = $1
       ORDER BY a.created_at DESC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...taskResult.rows[0],
        comments: commentsResult.rows,
        attachments: attachmentsResult.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create new task
const createTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { project_id, title, description, status, priority, assigned_to, due_date, labels } = req.body;

    // Get max position for the status column
    const positionResult = await db.query(
      'SELECT COALESCE(MAX(position), 0) + 1 as next_position FROM tasks WHERE project_id = $1 AND status = $2',
      [project_id, status || 'todo']
    );

    const result = await db.query(
      `INSERT INTO tasks (project_id, title, description, status, priority, assigned_to, created_by, due_date, labels, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        project_id,
        title,
        description || null,
        status || 'todo',
        priority || 'medium',
        assigned_to || null,
        req.user.id,
        due_date || null,
        labels || [],
        positionResult.rows[0].next_position,
      ]
    );

    // Get assignee info if assigned
    let assignee = null;
    if (assigned_to) {
      const assigneeResult = await db.query(
        'SELECT id, username, full_name, avatar_url FROM users WHERE id = $1',
        [assigned_to]
      );
      assignee = assigneeResult.rows[0];
    }

    // Log activity
    await db.query(
      `INSERT INTO activity_logs (user_id, project_id, task_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [req.user.id, project_id, result.rows[0].id, 'created', 'task', result.rows[0].id, JSON.stringify({ title })]
    );

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: {
        ...result.rows[0],
        assigned_username: assignee?.username,
        assigned_name: assignee?.full_name,
        assigned_avatar: assignee?.avatar_url,
        creator_username: req.user.username,
        creator_name: req.user.full_name,
        comment_count: 0,
        attachment_count: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update task
const updateTask = async (req, res, next) => {
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
    const { title, description, status, priority, assigned_to, due_date, labels } = req.body;

    // Get current task to log changes
    const currentTask = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);

    if (currentTask.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const result = await db.query(
      `UPDATE tasks
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           priority = COALESCE($4, priority),
           assigned_to = $5,
           due_date = $6,
           labels = COALESCE($7, labels)
       WHERE id = $8
       RETURNING *`,
      [title, description, status, priority, assigned_to, due_date, labels, id]
    );

    // Log activity
    const changes = {};
    if (status && status !== currentTask.rows[0].status) {
      changes.status = { from: currentTask.rows[0].status, to: status };
    }
    if (assigned_to !== undefined && assigned_to !== currentTask.rows[0].assigned_to) {
      changes.assigned_to = { from: currentTask.rows[0].assigned_to, to: assigned_to };
    }

    await db.query(
      `INSERT INTO activity_logs (user_id, project_id, task_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [req.user.id, result.rows[0].project_id, id, 'updated', 'task', id, JSON.stringify({ title, changes })]
    );

    // Get assignee info
    let assignee = null;
    if (result.rows[0].assigned_to) {
      const assigneeResult = await db.query(
        'SELECT id, username, full_name, avatar_url FROM users WHERE id = $1',
        [result.rows[0].assigned_to]
      );
      assignee = assigneeResult.rows[0];
    }

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: {
        ...result.rows[0],
        assigned_username: assignee?.username,
        assigned_name: assignee?.full_name,
        assigned_avatar: assignee?.avatar_url,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Move task (drag-and-drop)
const moveTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, position } = req.body;

    // Start transaction
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // Get current task
      const currentTask = await client.query('SELECT * FROM tasks WHERE id = $1', [id]);

      if (currentTask.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Task not found',
        });
      }

      const task = currentTask.rows[0];
      const oldStatus = task.status;
      const oldPosition = task.position;

      // If moving to different column
      if (status && status !== oldStatus) {
        // Update positions in old column
        await client.query(
          'UPDATE tasks SET position = position - 1 WHERE project_id = $1 AND status = $2 AND position > $3',
          [task.project_id, oldStatus, oldPosition]
        );

        // Update positions in new column
        await client.query(
          'UPDATE tasks SET position = position + 1 WHERE project_id = $1 AND status = $2 AND position >= $3',
          [task.project_id, status, position]
        );

        // Update task
        await client.query(
          'UPDATE tasks SET status = $1, position = $2 WHERE id = $3',
          [status, position, id]
        );
      } else {
        // Moving within same column
        if (position > oldPosition) {
          await client.query(
            'UPDATE tasks SET position = position - 1 WHERE project_id = $1 AND status = $2 AND position > $3 AND position <= $4',
            [task.project_id, task.status, oldPosition, position]
          );
        } else if (position < oldPosition) {
          await client.query(
            'UPDATE tasks SET position = position + 1 WHERE project_id = $1 AND status = $2 AND position >= $3 AND position < $4',
            [task.project_id, task.status, position, oldPosition]
          );
        }

        await client.query(
          'UPDATE tasks SET position = $1 WHERE id = $2',
          [position, id]
        );
      }

      await client.query('COMMIT');

      // Get updated task
      const result = await db.query(
        `SELECT t.*, 
          u.username as assigned_username,
          u.full_name as assigned_name,
          u.avatar_url as assigned_avatar
         FROM tasks t
         LEFT JOIN users u ON t.assigned_to = u.id
         WHERE t.id = $1`,
        [id]
      );

      // Log activity if status changed
      if (status && status !== oldStatus) {
        await db.query(
          `INSERT INTO activity_logs (user_id, project_id, task_id, action, entity_type, entity_id, details)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [req.user.id, task.project_id, id, 'moved', 'task', id, JSON.stringify({ from: oldStatus, to: status })]
        );
      }

      res.json({
        success: true,
        message: 'Task moved successfully',
        data: result.rows[0],
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
};

// Delete task
const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM tasks WHERE id = $1 RETURNING id, project_id, title',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Log activity
    await db.query(
      `INSERT INTO activity_logs (user_id, project_id, task_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [req.user.id, result.rows[0].project_id, null, 'deleted', 'task', id, JSON.stringify({ title: result.rows[0].title })]
    );

    res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Get tasks assigned to current user
const getMyTasks = async (req, res, next) => {
  try {
    const { status, priority, dueDate } = req.query;

    let query = `
      SELECT t.*, 
        p.name as project_name,
        p.color as project_color,
        (SELECT COUNT(*) FROM comments WHERE task_id = t.id) as comment_count
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.assigned_to = $1
    `;

    const params = [req.user.id];
    let paramIndex = 2;

    if (status) {
      query += ` AND t.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (priority) {
      query += ` AND t.priority = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }

    if (dueDate === 'overdue') {
      query += ` AND t.due_date < CURRENT_DATE AND t.status != 'done'`;
    } else if (dueDate === 'today') {
      query += ` AND t.due_date = CURRENT_DATE`;
    } else if (dueDate === 'week') {
      query += ` AND t.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'`;
    }

    query += ' ORDER BY t.due_date ASC NULLS LAST, t.priority DESC, t.created_at DESC';

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  moveTask,
  deleteTask,
  getMyTasks,
};
