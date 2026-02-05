const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  searchByYear,
  createYearPlaylist,
  getDecadeOverview
} = require('../controllers/timeMachineController');

// @route   GET /api/timemachine/year/:year
// @desc    Search tracks by year
// @access  Private
router.get('/year/:year', authenticateToken, searchByYear);

// @route   POST /api/timemachine/year/:year/playlist
// @desc    Create playlist from year
// @access  Private
router.post('/year/:year/playlist', authenticateToken, createYearPlaylist);

// @route   GET /api/timemachine/decade/:decade
// @desc    Get decade overview
// @access  Private
router.get('/decade/:decade', authenticateToken, getDecadeOverview);

module.exports = router;
