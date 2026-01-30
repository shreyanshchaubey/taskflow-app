const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { auth, requireProjectMember, requireProjectOwner } = require('../middleware/auth');
const projectController = require('../controllers/projectController');

// Validation rules
const createProjectValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Project name is required and cannot exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color code'),
];

const updateProjectValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Project name cannot exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color code'),
  body('status')
    .optional()
    .isIn(['active', 'archived', 'completed'])
    .withMessage('Status must be active, archived, or completed'),
];

const addMemberValidation = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('role')
    .optional()
    .isIn(['admin', 'member', 'viewer'])
    .withMessage('Role must be admin, member, or viewer'),
];

// All routes require authentication
router.use(auth);

// GET /api/projects - Get all projects for current user
router.get('/', projectController.getProjects);

// POST /api/projects - Create new project
router.post('/', createProjectValidation, projectController.createProject);

// GET /api/projects/:id - Get single project
router.get('/:id', requireProjectMember, projectController.getProject);

// PUT /api/projects/:id - Update project (owner only)
router.put('/:id', requireProjectOwner, updateProjectValidation, projectController.updateProject);

// DELETE /api/projects/:id - Delete project (owner only)
router.delete('/:id', requireProjectOwner, projectController.deleteProject);

// POST /api/projects/:id/members - Add member to project (owner only)
router.post('/:id/members', requireProjectOwner, addMemberValidation, projectController.addMember);

// DELETE /api/projects/:id/members/:userId - Remove member from project (owner only)
router.delete('/:id/members/:userId', requireProjectOwner, projectController.removeMember);

// GET /api/projects/:id/activity - Get project activity log
router.get('/:id/activity', requireProjectMember, projectController.getProjectActivity);

module.exports = router;
