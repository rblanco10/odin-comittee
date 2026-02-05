const SpotifyWebApi = require('spotify-web-api-node');

// Initialize Spotify API client
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

// Get authorization URL
const getAuthUrl = () => {
  const scopes = [
    'user-read-private',
    'user-read-email',
    'user-top-read',
    'user-read-recently-played',
    'playlist-modify-public',
    'playlist-modify-private',
    'playlist-read-private'
  ];

  return spotifyApi.createAuthorizeURL(scopes, 'state');
};

// Exchange authorization code for tokens
const getTokens = async (code) => {
  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    return {
      accessToken: data.body.access_token,
      refreshToken: data.body.refresh_token,
      expiresIn: data.body.expires_in
    };
  } catch (error) {
    console.error('Error getting tokens:', error);
    throw error;
  }
};

// Refresh access token
const refreshAccessToken = async (refreshToken) => {
  try {
    spotifyApi.setRefreshToken(refreshToken);
    const data = await spotifyApi.refreshAccessToken();
    return {
      accessToken: data.body.access_token,
      expiresIn: data.body.expires_in
    };
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
};

// Get user profile
const getUserProfile = async (accessToken) => {
  try {
    spotifyApi.setAccessToken(accessToken);
    const data = await spotifyApi.getMe();
    return data.body;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

// Get user's top artists
const getTopArtists = async (accessToken, timeRange = 'medium_term', limit = 20) => {
  try {
    spotifyApi.setAccessToken(accessToken);
    const data = await spotifyApi.getMyTopArtists({ 
      time_range: timeRange, 
      limit 
    });
    return data.body.items;
  } catch (error) {
    console.error('Error getting top artists:', error);
    throw error;
  }
};

// Get user's top tracks
const getTopTracks = async (accessToken, timeRange = 'medium_term', limit = 20) => {
  try {
    spotifyApi.setAccessToken(accessToken);
    const data = await spotifyApi.getMyTopTracks({ 
      time_range: timeRange, 
      limit 
    });
    return data.body.items;
  } catch (error) {
    console.error('Error getting top tracks:', error);
    throw error;
  }
};

// Get recently played tracks
const getRecentlyPlayed = async (accessToken, limit = 50) => {
  try {
    spotifyApi.setAccessToken(accessToken);
    const data = await spotifyApi.getMyRecentlyPlayedTracks({ limit });
    return data.body.items;
  } catch (error) {
    console.error('Error getting recently played:', error);
    throw error;
  }
};

// Search tracks by year
const searchTracksByYear = async (accessToken, year, limit = 50) => {
  try {
    spotifyApi.setAccessToken(accessToken);
    const data = await spotifyApi.searchTracks(`year:${year}`, { limit });
    return data.body.tracks.items;
  } catch (error) {
    console.error('Error searching tracks by year:', error);
    throw error;
  }
};

// Create playlist
const createPlaylist = async (accessToken, userId, name, description, tracks) => {
  try {
    spotifyApi.setAccessToken(accessToken);
    
    // Create playlist
    const playlistData = await spotifyApi.createPlaylist(userId, {
      name,
      description,
      public: true
    });
    
    const playlistId = playlistData.body.id;
    
    // Add tracks to playlist
    if (tracks && tracks.length > 0) {
      const trackUris = tracks.map(track => `spotify:track:${track.id || track}`);
      await spotifyApi.addTracksToPlaylist(playlistId, trackUris);
    }
    
    return playlistData.body;
  } catch (error) {
    console.error('Error creating playlist:', error);
    throw error;
  }
};

module.exports = {
  getAuthUrl,
  getTokens,
  refreshAccessToken,
  getUserProfile,
  getTopArtists,
  getTopTracks,
  getRecentlyPlayed,
  searchTracksByYear,
  createPlaylist
};
