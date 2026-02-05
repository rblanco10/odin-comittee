# Musik Dash - Server

Backend API for Musik Dash music analytics application.

## MongoDB Atlas Setup

1. Go to https://cloud.mongodb.com
2. Click "Connect" on your Cluster0
3. Choose "Drivers" → "Node.js"
4. Copy the connection string
5. Update `.env` file with your connection string

### Create Database User

1. Go to "Database Access" in left sidebar
2. Click "Add New Database User"
3. Set username and password
4. Grant "Read and write to any database" permissions
5. Click "Add User"

### Whitelist IP Address

1. Go to "Network Access" in left sidebar
2. Click "Add IP Address"
3. For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

### Connection String Format

```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/musik-dash?retryWrites=true&w=majority
```

Replace:
- `<username>` with your database username
- `<password>` with your database password
- `cluster0.xxxxx` with your actual cluster address

## Environment Variables

Update `.env` file:

```env
# MongoDB
MONGODB_URI=your_mongodb_atlas_connection_string

# JWT Secrets (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=your_generated_secret
JWT_REFRESH_SECRET=your_generated_refresh_secret

# Spotify (from your Spotify Developer Dashboard)
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:5000/api/auth/callback
```

## Running the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
- `GET /api/auth/login` - Redirect to Spotify login
- `GET /api/auth/callback` - Spotify callback handler
- `GET /api/auth/me` - Get current user (protected)
- `POST /api/auth/logout` - Logout user (protected)

### Statistics
- `GET /api/stats` - Get all stats (protected)
- `GET /api/stats/artists` - Get top artists (protected)
- `GET /api/stats/tracks` - Get top tracks (protected)
- `GET /api/stats/recent` - Get recently played (protected)

### Time Machine
- `GET /api/timemachine/year/:year` - Search tracks by year (protected)
- `POST /api/timemachine/year/:year/playlist` - Create playlist from year (protected)
- `GET /api/timemachine/decade/:decade` - Get decade overview (protected)

## Query Parameters

### Time Range (for stats endpoints)
- `short_term` - Last 4 weeks
- `medium_term` - Last 6 months (default)
- `long_term` - All time

Example: `GET /api/stats?timeRange=short_term`
