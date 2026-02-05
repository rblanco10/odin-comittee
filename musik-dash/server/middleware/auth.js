const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { refreshAccessToken } = require('../services/spotifyService');

// Verify JWT token and attach user to request
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from cookie
    const token = req.cookies.token;

    if (!token) {
      console.log('🔒 No token in cookies. Cookies received:', Object.keys(req.cookies));
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    
    console.log('🔓 Token found, verifying...');

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token. User not found.' });
    }

    // Check if Spotify token needs refresh
    if (user.needsTokenRefresh()) {
      try {
        const { accessToken, expiresIn } = await refreshAccessToken(user.refreshToken);
        
        // Update user's access token
        user.accessToken = accessToken;
        user.tokenExpiry = new Date(Date.now() + expiresIn * 1000);
        await user.save();
        
        console.log('✅ Spotify token refreshed for user:', user.email);
      } catch (error) {
        console.error('❌ Error refreshing Spotify token:', error);
        return res.status(401).json({ error: 'Failed to refresh Spotify token. Please login again.' });
      }
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please login again.' });
    }
    
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Internal server error during authentication.' });
  }
};

module.exports = { authenticateToken };
