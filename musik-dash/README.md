# Musik Dash 🎵

A beautiful music analytics dashboard built with the MERN stack and Spotify API. Visualize your listening habits, explore music from different eras, and create custom playlists.

## Features

### 🎯 Dashboard
- View your top artists and tracks
- Analyze listening patterns by time range (4 weeks, 6 months, all time)
- Visualize your favorite genres with interactive charts
- See listening statistics and insights

### ⏰ Time Machine
- Explore top tracks from any year (1950-present)
- Create playlists from specific years
- Discover music from different decades
- Save throwback playlists directly to your Spotify account

## Tech Stack

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool
- **Tailwind CSS v4** - Styling (with new Vite plugin)
- **React Router** - Navigation
- **Chart.js + react-chartjs-2** - Data visualization
- **Lucide React** - Icons
- **Axios** - HTTP client

### Backend
- **Node.js + Express** - Server
- **MongoDB + Mongoose** - Database
- **Spotify Web API** - Music data
- **JWT** - Authentication (HTTP-only cookies)
- **Security**: Helmet, CORS, Rate Limiting

## Prerequisites

- Node.js (v18+)
- MongoDB Atlas account (or local MongoDB)
- Spotify Developer account

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd musik-dash
```

### 2. Set Up MongoDB Atlas

1. Go to https://cloud.mongodb.com
2. Create a free cluster (M0)
3. Create a database user:
   - Go to "Database Access"
   - Click "Add New Database User"
   - Set username and password
   - Grant "Read and write to any database"
4. Whitelist your IP:
   - Go to "Network Access"
   - Click "Add IP Address"
   - For development: "Allow Access from Anywhere" (0.0.0.0/0)
5. Get your connection string:
   - Click "Connect" on your cluster
   - Choose "Drivers" → "Node.js"
   - Copy the connection string

### 3. Set Up Spotify Developer App

1. Go to https://developer.spotify.com/dashboard
2. Click "Create app"
3. Fill in:
   - **App name**: Musik Dash
   - **App description**: Music analytics dashboard
   - **Redirect URI**: `http://localhost:5000/api/auth/callback`
   - **API**: Web API
4. Save your **Client ID** and **Client Secret**

### 4. Configure Environment Variables

#### Backend (.env)

Create `server/.env`:

```env
# Server
NODE_ENV=development
PORT=5000

# MongoDB Atlas
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/musik-dash?retryWrites=true&w=majority

# JWT Secrets (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=your_generated_secret_here
JWT_REFRESH_SECRET=your_generated_refresh_secret_here

# Spotify
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:5000/api/auth/callback

# Client
CLIENT_URL=http://localhost:5173
```

**Generate JWT secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### Frontend (.env)

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000
```

### 5. Install Dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 6. Run the Application

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Project Structure

```
musik-dash/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/      # Authentication components
│   │   │   ├── Dashboard/ # Dashboard components
│   │   │   ├── TimeMachine/ # Time Machine components
│   │   │   └── Shared/    # Shared components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── hooks/         # Custom React hooks
│   │   └── utils/         # Utility functions
│   └── .env
│
└── server/                # Express backend
    ├── config/            # Configuration files
    ├── controllers/       # Route controllers
    ├── models/            # Mongoose models
    ├── routes/            # API routes
    ├── middleware/        # Custom middleware
    ├── services/          # Business logic
    └── .env
```

## API Endpoints

### Authentication
- `GET /api/auth/login` - Redirect to Spotify login
- `GET /api/auth/callback` - Spotify callback handler
- `GET /api/auth/me` - Get current user (protected)
- `POST /api/auth/logout` - Logout user (protected)

### Statistics
- `GET /api/stats?timeRange=medium_term` - Get all stats
- `GET /api/stats/artists?timeRange=short_term` - Get top artists
- `GET /api/stats/tracks?timeRange=long_term` - Get top tracks
- `GET /api/stats/recent` - Get recently played tracks

### Time Machine
- `GET /api/timemachine/year/:year` - Search tracks by year
- `POST /api/timemachine/year/:year/playlist` - Create playlist from year
- `GET /api/timemachine/decade/:decade` - Get decade overview

## Features in Detail

### Time Ranges
- `short_term` - Last 4 weeks
- `medium_term` - Last 6 months (default)
- `long_term` - All time

### Security Features
- HTTP-only cookies for JWT tokens
- Automatic Spotify token refresh
- Rate limiting on API endpoints
- CORS protection
- Helmet security headers

## Troubleshooting

### MongoDB Connection Error
- Make sure your connection string is correct
- Check that your IP is whitelisted in MongoDB Atlas
- Verify database user credentials

### Spotify Authentication Error
- Verify redirect URI matches exactly in Spotify Dashboard
- Check that Client ID and Secret are correct
- Make sure all required scopes are included

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

## Future Enhancements

- [ ] Friend compatibility matcher
- [ ] Mood-based playlist generator
- [ ] Listening history timeline
- [ ] Export statistics as images
- [ ] Mobile app version
- [ ] Playlist recommendations

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for learning or personal use.

## Acknowledgments

- Spotify Web API for music data
- Tailwind CSS for beautiful styling
- Chart.js for data visualization
- The MERN stack community

---

Built with ❤️ using the MERN stack
