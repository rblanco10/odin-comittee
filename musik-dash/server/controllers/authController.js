const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { 
  getAuthUrl, 
  getTokens, 
  getUserProfile 
} = require('../services/spotifyService');

// Redirect to Spotify authorization
const login = (req, res) => {
  try {
    const authUrl = getAuthUrl();
    console.log('🔑 Redirecting to Spotify:', authUrl);
    res.redirect(authUrl);
  } catch (err) {
    console.error('❌ Login redirect error:', err);
    res.status(500).json({ error: 'Failed to generate Spotify login URL' });
  }
};

// Handle Spotify callback
const callback = async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    console.error('Spotify auth error:', error);
    return res.redirect(`${process.env.CLIENT_URL}?error=auth_failed`);
  }

  if (!code) {
    return res.redirect(`${process.env.CLIENT_URL}?error=no_code`);
  }

  try {
    // Exchange code for tokens
    const { accessToken, refreshToken, expiresIn } = await getTokens(code);
    
    // Get user profile from Spotify
    const profile = await getUserProfile(accessToken);
    
    // Check if user exists
    let user = await User.findOne({ spotifyId: profile.id });
    
    const tokenExpiry = new Date(Date.now() + expiresIn * 1000);
    
    if (user) {
      // Update existing user
      user.accessToken = accessToken;
      user.refreshToken = refreshToken;
      user.tokenExpiry = tokenExpiry;
      user.displayName = profile.display_name;
      user.email = profile.email;
      user.profileImage = profile.images?.[0]?.url || '';
      user.country = profile.country;
      user.product = profile.product;
      user.lastLogin = new Date();
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        spotifyId: profile.id,
        displayName: profile.display_name,
        email: profile.email,
        profileImage: profile.images?.[0]?.url || '',
        country: profile.country,
        product: profile.product,
        accessToken,
        refreshToken,
        tokenExpiry
      });
    }

    // Create JWT token
    const jwtToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect to localhost with token in URL, then set cookie there
    // This is needed because the callback comes through the tunnel domain,
    // and cookies set there won't be sent to localhost
    const localCallbackUrl = `http://localhost:${process.env.PORT || 5001}/api/auth/set-token?token=${jwtToken}`;
    console.log('🔄 Redirecting to local callback to set cookie');
    res.redirect(localCallbackUrl);
  } catch (error) {
    console.error('Callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}?error=callback_failed`);
  }
};

// Set token cookie on localhost domain (called after tunnel callback)
const setToken = (req, res) => {
  const { token } = req.query;
  
  if (!token) {
    return res.redirect(`${process.env.CLIENT_URL}?error=no_token`);
  }

  // Set HTTP-only cookie on localhost
  res.cookie('token', token, {
    httpOnly: true,
    secure: false, // localhost is not HTTPS
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  console.log('🍪 Token cookie set on localhost, redirecting to dashboard');
  res.redirect(`${process.env.CLIENT_URL}/dashboard`);
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const user = {
      id: req.user._id,
      spotifyId: req.user.spotifyId,
      displayName: req.user.displayName,
      email: req.user.email,
      profileImage: req.user.profileImage,
      country: req.user.country,
      product: req.user.product
    };
    
    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
};

// Logout
const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};

module.exports = {
  login,
  callback,
  setToken,
  getCurrentUser,
  logout
};
