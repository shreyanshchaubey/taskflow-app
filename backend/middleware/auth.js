const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Authentication middleware to verify JWT tokens
const auth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token, access denied',
      });
    }

    // Check if header starts with 'Bearer '
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format. Use: Bearer <token>',
      });
    }

    // Extract token
    const token = authHeader.slice(7);

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database to ensure they still exist
    const result = await db.query(
      'SELECT id, username, email, full_name, avatar_url, role FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists',
      });
    }

    // Attach user info to request object
    req.user = result.rows[0];
    req.token = token;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired',
      });
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication',
    });
  }
};

// Optional authentication - doesn't fail if no token present
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await db.query(
      'SELECT id, username, email, full_name, avatar_url, role FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length > 0) {
      req.user = result.rows[0];
      req.token = token;
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Role-based access control middleware
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
      });
    }

    next();
  };
};

// Project membership middleware
const requireProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id || req.body.project_id;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required',
      });
    }

    // Check if user is project owner or member
    const result = await db.query(
      `SELECT p.id, p.owner_id, pm.role as member_role
       FROM projects p
       LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = $1
       WHERE p.id = $2 AND (p.owner_id = $1 OR pm.user_id = $1)`,
      [req.user.id, projectId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this project',
      });
    }

    req.projectRole = result.rows[0].owner_id === req.user.id ? 'owner' : result.rows[0].member_role;
    next();
  } catch (error) {
    console.error('Project member check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking project membership',
    });
  }
};

// Project owner middleware
const requireProjectOwner = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required',
      });
    }

    const result = await db.query(
      'SELECT id FROM projects WHERE id = $1 AND owner_id = $2',
      [projectId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner can perform this action',
      });
    }

    next();
  } catch (error) {
    console.error('Project owner check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking project ownership',
    });
  }
};

module.exports = {
  auth,
  optionalAuth,
  requireRole,
  requireProjectMember,
  requireProjectOwner,
};
