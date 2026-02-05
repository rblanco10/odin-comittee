const {
  searchTracksByYear,
  createPlaylist
} = require('../services/spotifyService');

// Search tracks by year
const searchByYear = async (req, res) => {
  try {
    const { year } = req.params;
    const { limit = 50 } = req.query;
    const accessToken = req.user.accessToken;

    // Validate year
    const currentYear = new Date().getFullYear();
    const yearNum = parseInt(year);
    
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear) {
      return res.status(400).json({ error: 'Invalid year' });
    }

    // Search tracks
    const tracks = await searchTracksByYear(accessToken, yearNum, parseInt(limit));
    
    // Sort by popularity
    const sortedTracks = tracks.sort((a, b) => b.popularity - a.popularity);

    res.json({
      year: yearNum,
      tracks: sortedTracks,
      count: sortedTracks.length
    });
  } catch (error) {
    console.error('Search by year error:', error);
    res.status(500).json({ error: 'Failed to search tracks by year' });
  }
};

// Create playlist from year
const createYearPlaylist = async (req, res) => {
  try {
    const { year } = req.params;
    const { trackIds, name, description } = req.body;
    const accessToken = req.user.accessToken;
    const userId = req.user.spotifyId;

    if (!trackIds || !Array.isArray(trackIds) || trackIds.length === 0) {
      return res.status(400).json({ error: 'Track IDs are required' });
    }

    const playlistName = name || `${year} Throwback`;
    const playlistDescription = description || `Top tracks from ${year} - Created by Musik Dash`;

    // Create playlist
    const playlist = await createPlaylist(
      accessToken,
      userId,
      playlistName,
      playlistDescription,
      trackIds
    );

    res.json({
      message: 'Playlist created successfully',
      playlist: {
        id: playlist.id,
        name: playlist.name,
        url: playlist.external_urls.spotify,
        trackCount: trackIds.length
      }
    });
  } catch (error) {
    console.error('Create year playlist error:', error);
    res.status(500).json({ error: 'Failed to create playlist' });
  }
};

// Get decade overview
const getDecadeOverview = async (req, res) => {
  try {
    const { decade } = req.params;
    const accessToken = req.user.accessToken;

    // Validate decade (e.g., 1980, 1990, 2000)
    const decadeNum = parseInt(decade);
    if (isNaN(decadeNum) || decadeNum % 10 !== 0) {
      return res.status(400).json({ error: 'Invalid decade. Use format: 1980, 1990, 2000, etc.' });
    }

    // Sample a few years from the decade
    const years = [decadeNum, decadeNum + 4, decadeNum + 9];
    const trackPromises = years.map(year => 
      searchTracksByYear(accessToken, year, 10)
    );

    const results = await Promise.all(trackPromises);
    
    const decadeData = years.map((year, index) => ({
      year,
      tracks: results[index].sort((a, b) => b.popularity - a.popularity)
    }));

    res.json({
      decade: decadeNum,
      data: decadeData
    });
  } catch (error) {
    console.error('Get decade overview error:', error);
    res.status(500).json({ error: 'Failed to get decade overview' });
  }
};

module.exports = {
  searchByYear,
  createYearPlaylist,
  getDecadeOverview
};
