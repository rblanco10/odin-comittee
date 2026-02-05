# ✅ Musik Dash Setup Checklist

## Pre-Setup (Already Done ✅)
- [x] Project structure created
- [x] All dependencies installed
- [x] Backend code complete
- [x] Frontend code complete
- [x] Spotify Developer app created
- [x] MongoDB Atlas cluster created

## Required Setup (Do This Now! ⚠️)

### 1. MongoDB Configuration
- [ ] Go to MongoDB Atlas dashboard
- [ ] Click "Connect" on Cluster0
- [ ] Copy connection string
- [ ] Update `server/.env` line 6 with real connection string
- [ ] Replace `<username>` and `<password>` with actual credentials

### 2. JWT Secrets
- [ ] Run: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- [ ] Copy output to `server/.env` line 9 (JWT_SECRET)
- [ ] Run command again for second secret
- [ ] Copy output to `server/.env` line 10 (JWT_REFRESH_SECRET)

### 3. Spotify Configuration (Verify)
- [ ] Open https://developer.spotify.com/dashboard
- [ ] Check redirect URI includes: `http://localhost:5000/api/auth/callback`
- [ ] Verify Client ID matches `server/.env` line 13
- [ ] Verify Client Secret matches `server/.env` line 14

## Testing

### 4. Start Backend
- [ ] Open terminal in `server` folder
- [ ] Run: `npm run dev`
- [ ] Wait for: "✅ MongoDB Atlas connected"
- [ ] Check for: "🚀 Server running on port 5000"

### 5. Start Frontend
- [ ] Open new terminal in `client` folder
- [ ] Run: `npm run dev`
- [ ] Check for: "Local: http://localhost:5173"

### 6. Test Application
- [ ] Open browser to http://localhost:5173
- [ ] See login page with Spotify button
- [ ] Click "Login with Spotify"
- [ ] Authorize the app
- [ ] Redirected to dashboard
- [ ] See your top artists and tracks
- [ ] Click "Time Machine" in nav
- [ ] Select a year
- [ ] See tracks from that year
- [ ] Select some tracks
- [ ] Click "Create Playlist"
- [ ] Check Spotify for new playlist

## Quick Reference

### MongoDB Connection String Format
```
mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/musik-dash?retryWrites=true&w=majority
```

### Generate JWT Secret Command
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Start Commands
```bash
# Backend
cd server && npm run dev

# Frontend  
cd client && npm run dev
```

### URLs
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Health Check: http://localhost:5000/api/health

## Troubleshooting

### ❌ "MongoDB connection error"
→ Update MongoDB connection string in `server/.env`

### ❌ "bad auth : authentication failed"
→ Check MongoDB username/password are correct

### ❌ "Spotify authentication failed"
→ Verify redirect URI matches in Spotify Dashboard

### ❌ "Port already in use"
→ Run: `lsof -ti:5000 | xargs kill -9` (or 5173 for frontend)

## Success Indicators

✅ Backend terminal shows:
```
🚀 Server running on port 5000
📊 Environment: development
✅ MongoDB Atlas connected
```

✅ Frontend terminal shows:
```
VITE v5.x.x ready in xxx ms
➜  Local:   http://localhost:5173/
```

✅ Browser shows:
- Beautiful login page
- After login: Dashboard with your music stats
- Time Machine works and creates playlists

---

**Current Status:** 
- Code: ✅ Complete
- Setup: ⚠️ Needs MongoDB connection string and JWT secrets
- Ready to run: 🔜 After completing checklist above

**Estimated Time:** 5-10 minutes to complete setup
