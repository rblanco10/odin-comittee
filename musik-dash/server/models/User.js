const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  spotifyId: {
    type: String,
    required: true,
    unique: true
  },
  displayName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  profileImage: {
    type: String,
    default: ''
  },
  country: String,
  product: String, // spotify subscription type (free, premium)
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String,
    required: true
  },
  tokenExpiry: {
    type: Date,
    required: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Method to check if token needs refresh
userSchema.methods.needsTokenRefresh = function() {
  return new Date() >= new Date(this.tokenExpiry - 5 * 60 * 1000); // Refresh 5 min before expiry
};

module.exports = mongoose.model('User', userSchema);
