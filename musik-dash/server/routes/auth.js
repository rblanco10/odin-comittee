const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  login,
  callback,
  setToken,
  getCurrentUser,
  logout
} = require('../controllers/authController');

// @route   GET /api/auth/login
// @desc    Redirect to Spotify authorization
// @access  Public
router.get('/login', login);

// @route   GET /api/auth/callback
// @desc    Handle Spotify callback
// @access  Public
router.get('/callback', callback);

// @route   GET /api/auth/set-token
// @desc    Set token cookie on localhost (after tunnel callback)
// @access  Public
router.get('/set-token', setToken);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticateToken, getCurrentUser);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authenticateToken, logout);

module.exports = router;
