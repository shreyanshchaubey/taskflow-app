const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const authController = require('../controllers/authController');

// Validation rules
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('full_name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Full name cannot exceed 100 characters'),
];

const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

const updateProfileValidation = [
  body('full_name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Full name cannot exceed 100 characters'),
  body('avatar_url')
    .optional()
    .trim()
    .isURL()
    .withMessage('Avatar must be a valid URL'),
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
];

// Routes
// POST /api/auth/register - Register new user
router.post('/register', registerValidation, authController.register);

// POST /api/auth/login - Login user
router.post('/login', loginValidation, authController.login);

// GET /api/auth/me - Get current user profile
router.get('/me', auth, authController.getMe);

// PUT /api/auth/profile - Update user profile
router.put('/profile', auth, updateProfileValidation, authController.updateProfile);

// PUT /api/auth/password - Change password
router.put('/password', auth, changePasswordValidation, authController.changePassword);

module.exports = router;
