const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getStats,
  getArtists,
  getTracks,
  getRecent
} = require('../controllers/statsController');

// @route   GET /api/stats
// @desc    Get all user statistics
// @access  Private
router.get('/', authenticateToken, getStats);

// @route   GET /api/stats/artists
// @desc    Get top artists
// @access  Private
router.get('/artists', authenticateToken, getArtists);

// @route   GET /api/stats/tracks
// @desc    Get top tracks
// @access  Private
router.get('/tracks', authenticateToken, getTracks);

// @route   GET /api/stats/recent
// @desc    Get recently played tracks
// @access  Private
router.get('/recent', authenticateToken, getRecent);

module.exports = router;
