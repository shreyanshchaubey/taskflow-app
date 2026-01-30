const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const commentController = require('../controllers/commentController');

// Validation rules
const createCommentValidation = [
  body('content')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Comment content is required'),
];

const updateCommentValidation = [
  body('content')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Comment content is required'),
];

// All routes require authentication
router.use(auth);

// GET /api/comments/task/:taskId - Get comments for a task
router.get('/task/:taskId', commentController.getComments);

// POST /api/comments/task/:taskId - Create new comment
router.post('/task/:taskId', createCommentValidation, commentController.createComment);

// PUT /api/comments/:id - Update comment
router.put('/:id', updateCommentValidation, commentController.updateComment);

// DELETE /api/comments/:id - Delete comment
router.delete('/:id', commentController.deleteComment);

module.exports = router;
