# Quick Setup Guide

## ⚡ Quick Start Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Database user created with password
- [ ] IP address whitelisted (0.0.0.0/0 for dev)
- [ ] Connection string copied
- [ ] Spotify Developer app created
- [ ] Redirect URI added: `http://localhost:5000/api/auth/callback`
- [ ] Client ID and Secret copied
- [ ] JWT secrets generated
- [ ] Backend `.env` configured
- [ ] Frontend `.env` configured
- [ ] Dependencies installed (both client and server)
- [ ] Backend running on port 5000
- [ ] Frontend running on port 5173

## 🔧 Current Status

Based on your setup, you still need to:

### 1. Update MongoDB Connection String

In `server/.env`, replace line 6 with your actual MongoDB Atlas connection string:

```env
MONGODB_URI=mongodb+srv://your_username:your_password@cluster0.xxxxx.mongodb.net/musik-dash?retryWrites=true&w=majority
```

**To get this:**
1. Go to MongoDB Atlas dashboard
2. Click "Connect" on Cluster0
3. Choose "Drivers"
4. Copy the connection string
5. Replace `<username>` and `<password>` with your database user credentials

### 2. Generate JWT Secrets

Run these commands to generate secure secrets:

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Update lines 9-10 in `server/.env` with the generated values.

### 3. Verify Spotify Credentials

Your Spotify credentials are already set:
- ✅ Client ID: `1bc464e9452a46e093dbef1312ce2b9a`
- ✅ Client Secret: `d48342493e3641078df1839af578adf2`
- ✅ Redirect URI: Set in your `.env`

**Important:** Make sure the redirect URI in your Spotify Dashboard matches EXACTLY:
- For local development: `http://localhost:5000/api/auth/callback`
- For ngrok: `https://your-ngrok-url.ngrok-free.dev/api/auth/callback`

## 🚀 Starting the Application

### Option 1: Manual Start (Recommended for Development)

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

You should see:
```
🚀 Server running on port 5000
📊 Environment: development
✅ MongoDB Atlas connected
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

### Option 2: Check for Errors

If the backend crashes, check:
1. MongoDB connection string is correct
2. MongoDB Atlas IP is whitelisted
3. Database user exists and password is correct

## 🧪 Testing the Setup

1. **Backend Health Check:**
   ```bash
   curl http://localhost:5000/api/health
   ```
   Should return: `{"status":"Server is running!","timestamp":"..."}`

2. **Frontend:**
   Open http://localhost:5173 in your browser
   You should see the login page

3. **Login Flow:**
   - Click "Login with Spotify"
   - Authorize the app
   - You should be redirected to the dashboard

## 📝 Common Issues

### Issue: "MongoDB connection error"
**Solution:** Update your `MONGODB_URI` in `server/.env` with the correct connection string from MongoDB Atlas.

### Issue: "Spotify authentication failed"
**Solution:** 
- Verify redirect URI matches in both `.env` and Spotify Dashboard
- Check Client ID and Secret are correct
- Make sure you're using the correct redirect URI for your environment

### Issue: "Port already in use"
**Solution:**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Issue: Tailwind styles not working
**Solution:** Make sure you have the latest Tailwind v4 with Vite plugin installed:
```bash
cd client
npm install -D tailwindcss @tailwindcss/vite
```

## 🎯 Next Steps

Once everything is running:

1. **Test the Dashboard:**
   - Login with your Spotify account
   - View your top artists and tracks
   - Try different time ranges

2. **Test Time Machine:**
   - Navigate to Time Machine
   - Select a year
   - Create a playlist

3. **Explore the Code:**
   - Check out the component structure
   - Review the API endpoints
   - Customize the styling

## 📚 Additional Resources

- [Spotify Web API Documentation](https://developer.spotify.com/documentation/web-api)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [React Router Documentation](https://reactrouter.com/)

## 🆘 Need Help?

If you're stuck:
1. Check the terminal output for error messages
2. Review the `.env` files for missing/incorrect values
3. Verify all services (MongoDB, Spotify) are properly configured
4. Check the browser console for frontend errors

---

Happy coding! 🎵
