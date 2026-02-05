# 🚀 START HERE

## Welcome to Musik Dash!

Your complete music analytics dashboard is ready! Just need 2 quick fixes to get it running.

---

## ⚡ Quick Start (5 Minutes)

### Step 1: Fix MongoDB Connection

**Open:** `server/.env`

**Find line 6:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vibe-check?retryWrites=true&w=majority
```

**Replace with your real MongoDB Atlas connection string.**

**How to get it:**
1. Go to https://cloud.mongodb.com
2. Click "Connect" on your Cluster0
3. Choose "Drivers" → "Node.js"
4. Copy the connection string
5. Replace `<username>` and `<password>` with your database credentials

---

### Step 2: Generate JWT Secrets

**Run these commands in terminal:**

```bash
# Generate first secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Copy the output, then generate second secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Open:** `server/.env`

**Update lines 9-10:**
```env
JWT_SECRET=paste_first_generated_secret_here
JWT_REFRESH_SECRET=paste_second_generated_secret_here
```

---

### Step 3: Start the App

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

Wait for:
```
✅ MongoDB Atlas connected
🚀 Server running on port 5000
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

**Open:** http://localhost:5173

---

## 🎉 That's It!

You should now see:
1. Beautiful login page
2. Click "Login with Spotify"
3. Authorize the app
4. See your music dashboard!

---

## 📚 Need More Help?

- **Detailed Setup:** Read `SETUP_GUIDE.md`
- **Checklist:** See `CHECKLIST.md`
- **API Docs:** Check `server/README.md`
- **Full Overview:** Read `README.md`
- **Project Details:** See `PROJECT_SUMMARY.md`

---

## 🐛 Something Not Working?

### Backend won't start?
→ Check MongoDB connection string is correct

### "bad auth" error?
→ Verify MongoDB username/password

### Spotify login fails?
→ Check redirect URI in Spotify Dashboard matches:
   `http://localhost:5000/api/auth/callback`

---

## ✅ Success Checklist

- [ ] MongoDB connection string updated
- [ ] JWT secrets generated and added
- [ ] Backend running (port 5000)
- [ ] Frontend running (port 5173)
- [ ] Can see login page
- [ ] Can login with Spotify
- [ ] Can see dashboard
- [ ] Time Machine works

---

**You're 5 minutes away from your music analytics dashboard!** 🎵

Let's go! 🚀
