const {
  getTopArtists,
  getTopTracks,
  getRecentlyPlayed
} = require('../services/spotifyService');

// Get user's music statistics
const getStats = async (req, res) => {
  try {
    const { timeRange = 'medium_term' } = req.query;
    const accessToken = req.user.accessToken;

    // Validate time range
    const validTimeRanges = ['short_term', 'medium_term', 'long_term'];
    if (!validTimeRanges.includes(timeRange)) {
      return res.status(400).json({ error: 'Invalid time range' });
    }

    // Fetch data in parallel
    const [topArtists, topTracks, recentlyPlayed] = await Promise.all([
      getTopArtists(accessToken, timeRange, 20),
      getTopTracks(accessToken, timeRange, 20),
      getRecentlyPlayed(accessToken, 50)
    ]);

    // Extract genres from top artists
    const genreMap = {};
    topArtists.forEach(artist => {
      artist.genres.forEach(genre => {
        genreMap[genre] = (genreMap[genre] || 0) + 1;
      });
    });

    // Sort genres by count
    const genres = Object.entries(genreMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate listening stats
    const listeningStats = {
      totalTracks: recentlyPlayed.length,
      uniqueArtists: new Set(recentlyPlayed.map(item => item.track.artists[0].id)).size,
      // Add more stats as needed
    };

    res.json({
      topArtists,
      topTracks,
      recentlyPlayed: recentlyPlayed.slice(0, 20),
      genres,
      listeningStats,
      timeRange
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};

// Get top artists only
const getArtists = async (req, res) => {
  try {
    const { timeRange = 'medium_term', limit = 20 } = req.query;
    const accessToken = req.user.accessToken;

    const artists = await getTopArtists(accessToken, timeRange, parseInt(limit));
    res.json(artists);
  } catch (error) {
    console.error('Get artists error:', error);
    res.status(500).json({ error: 'Failed to fetch artists' });
  }
};

// Get top tracks only
const getTracks = async (req, res) => {
  try {
    const { timeRange = 'medium_term', limit = 20 } = req.query;
    const accessToken = req.user.accessToken;

    const tracks = await getTopTracks(accessToken, timeRange, parseInt(limit));
    res.json(tracks);
  } catch (error) {
    console.error('Get tracks error:', error);
    res.status(500).json({ error: 'Failed to fetch tracks' });
  }
};

// Get recently played
const getRecent = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const accessToken = req.user.accessToken;

    const tracks = await getRecentlyPlayed(accessToken, parseInt(limit));
    res.json(tracks);
  } catch (error) {
    console.error('Get recent tracks error:', error);
    res.status(500).json({ error: 'Failed to fetch recent tracks' });
  }
};

module.exports = {
  getStats,
  getArtists,
  getTracks,
  getRecent
};
