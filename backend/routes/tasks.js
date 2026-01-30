const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const { auth } = require('../middleware/auth');
const taskController = require('../controllers/taskController');

// Validation rules
const createTaskValidation = [
  body('project_id')
    .isInt({ min: 1 })
    .withMessage('Valid project ID is required'),
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Task title is required and cannot exceed 200 characters'),
  body('description')
    .optional()
    .trim(),
  body('status')
    .optional()
    .isIn(['todo', 'in_progress', 'review', 'done'])
    .withMessage('Invalid status value'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority value'),
  body('assigned_to')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Invalid assignee ID'),
  body('due_date')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Invalid date format'),
  body('labels')
    .optional()
    .isArray()
    .withMessage('Labels must be an array'),
];

const updateTaskValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Task title cannot exceed 200 characters'),
  body('description')
    .optional()
    .trim(),
  body('status')
    .optional()
    .isIn(['todo', 'in_progress', 'review', 'done'])
    .withMessage('Invalid status value'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority value'),
  body('assigned_to')
    .optional({ nullable: true }),
  body('due_date')
    .optional({ nullable: true }),
  body('labels')
    .optional()
    .isArray()
    .withMessage('Labels must be an array'),
];

const moveTaskValidation = [
  body('status')
    .optional()
    .isIn(['todo', 'in_progress', 'review', 'done'])
    .withMessage('Invalid status value'),
  body('position')
    .isInt({ min: 0 })
    .withMessage('Position must be a non-negative integer'),
];

// All routes require authentication
router.use(auth);

// GET /api/tasks - Get all tasks for a project
router.get('/', taskController.getTasks);

// GET /api/tasks/my - Get tasks assigned to current user
router.get('/my', taskController.getMyTasks);

// POST /api/tasks - Create new task
router.post('/', createTaskValidation, taskController.createTask);

// GET /api/tasks/:id - Get single task with comments
router.get('/:id', taskController.getTask);

// PUT /api/tasks/:id - Update task
router.put('/:id', updateTaskValidation, taskController.updateTask);

// PUT /api/tasks/:id/move - Move task (drag-and-drop)
router.put('/:id/move', moveTaskValidation, taskController.moveTask);

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', taskController.deleteTask);

module.exports = router;
