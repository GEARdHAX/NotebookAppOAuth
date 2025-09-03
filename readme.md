# Note Taking Application

A full-stack note-taking application built with React, Node.js, and MongoDB featuring user authentication, email verification, and Google OAuth integration.

## 🚀 Features

- **User Authentication**: Email/password signup with OTP verification
- **Google OAuth**: Quick signup/login with Google account
- **JWT Security**: Secure API authentication
- **Note Management**: Create, view, and delete notes
- **Responsive Design**: Mobile-friendly interface
- **Input Validation**: Comprehensive client and server-side validation
- **Error Handling**: Clear error messages and feedback

## 🛠️ Tech Stack

- **Frontend**: React 18, JavaScript, CSS3
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT, Google OAuth 2.0
- **Email**: Nodemailer for OTP verification

## 📋 Prerequisites

Before running this application, make sure you have:

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Gmail account (for sending OTP emails)
- Google Cloud Console project (for Google OAuth)

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd note-taking-app
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### 3. Configure Environment Variables

Edit the `.env` file with your configuration:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/noteapp
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/noteapp

# JWT Secret (generate a secure random string)
JWT_SECRET=your_super_secret_jwt_key_here

# Gmail Configuration for OTP emails
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password

# Google OAuth Client ID
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# Server Port
PORT=5000
```

### 4. Gmail Setup for OTP

1. Enable 2-factor authentication on your Gmail account
2. Generate an "App Password" for the application
3. Use this app password in the `EMAIL_PASSWORD` field

### 5. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add your domain to authorized origins
6. Copy the Client ID to your `.env` file

### 6. MongoDB Setup

#### Local MongoDB:
```bash
# Install MongoDB Community Edition
# Start MongoDB service
mongod --dbpath /path/to/your/data/directory
```

#### MongoDB Atlas (Cloud):
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get connection string and update `MONGODB_URI`

### 7. Start Backend Server

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

Backend will run on `http://localhost:5000`

### 8. Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Create environment file (optional)
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env

# Start development server
npm start
```

Frontend will run on `http://localhost:3000`

## 🗄️ Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  name: String,
  isVerified: Boolean,
  googleId: String (optional),
  otp: String (temporary),
  otpExpiry: Date (temporary),
  createdAt: Date
}
```

### Notes Collection
```javascript
{
  _id: ObjectId,
  title: String,
  content: String,
  userId: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

## 🔌 API Endpoints

### Authentication Routes
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-otp` - Email verification
- `POST /api/auth/google` - Google OAuth login
- `POST /api/auth/resend-otp` - Resend OTP

### Protected Routes (require JWT token)
- `GET /api/notes` - Get user's notes
- `POST /api/notes` - Create new note
- `DELETE /api/notes/:id` - Delete note
- `GET /api/user/profile` - Get user profile

### Health Check
- `GET /api/health` - API status check

## 🚀 Deployment

### Backend Deployment (Railway/Render/Heroku)

1. **Environment Variables**: Set all required environment variables
2. **Database**: Use MongoDB Atlas for production
3. **Build Command**: `npm install`
4. **Start Command**: `npm start`

### Frontend Deployment (Netlify/Vercel)

1. **Build Command**: `npm run build`
2. **Publish Directory**: `build`
3. **Environment Variables**: Set `REACT_APP_API_URL` to your backend URL

### Example Deployment URLs
- **Backend**: `https://noteapp-backend.railway.app`
- **Frontend**: `https://noteapp-frontend.netlify.app`

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

### Manual Testing Checklist

- [ ] User can register with email and password
- [ ] OTP is sent and can be verified
- [ ] User can login with verified credentials
- [ ] Google OAuth login works
- [ ] JWT authentication protects routes
- [ ] User can create notes
- [ ] User can view their notes
- [ ] User can delete notes
- [ ] Responsive design works on mobile
- [ ] Error messages display correctly
- [ ] Input validation works

## 🔒 Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Tokens**: Secure authentication with expiration
- **Input Validation**: Server-side validation for all inputs
- **CORS Protection**: Configured for specific origins
- **Environment Variables**: Sensitive data stored securely
- **OTP Expiration**: Time-limited verification codes

## 📱 Mobile Responsiveness

The application is fully responsive and works on:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify network access for Atlas

2. **Email Not Sending**
   - Check Gmail app password
   - Verify 2FA is enabled
   - Check EMAIL_USER and EMAIL_PASSWORD

3. **Google OAuth Error**
   - Verify Google Client ID
   - Check authorized origins in Google Console
   - Ensure Google+ API is enabled

4. **JWT Token Issues**
   - Check JWT_SECRET is set
   - Verify token hasn't expired
   - Clear browser storage and re-login

### Development Tips

```bash
# Check backend logs
npm run dev

# Check frontend console
# Open browser developer tools

# Test API endpoints
curl -X GET http://localhost:5000/api/health

# Reset database (development only)
# Drop collections in MongoDB
```

## 📦 Project Structure

```
note-taking-app/
├── backend/
│   ├── app.js              # Main server file
│   ├── package.json        # Backend dependencies
│   ├── .env.example        # Environment template
│   └── .gitignore
├── frontend/
│   ├── public/
│   │   └── index.html      # HTML template
│   ├── src/
│   │   ├── App.js          # Main React component
│   │   ├── App.css         # Component styles
│   │   ├── index.js        # React entry point
│   │   └── index.css       # Global styles
│   ├── package.json        # Frontend dependencies
│   └── .gitignore
└── README.md               # This file
```

## 🔄 Git Workflow

### Feature Commits
```bash
# Initial setup
git commit -m "feat: initial project setup with MongoDB"

# Authentication
git commit -m "feat: add user registration with email verification"
git commit -m "feat: add JWT-based login system"
git commit -m "feat: integrate Google OAuth authentication"

# Notes functionality
git commit -m "feat: add note creation and retrieval"
git commit -m "feat: add note deletion functionality"

# UI/UX
git commit -m "feat: add responsive design and mobile support"
git commit -m "feat: add error handling and user feedback"

# Deployment
git commit -m "feat: add production deployment configuration"
```

## 📞 Support

For issues and questions:
1. Check this README for common solutions
2. Review error messages in browser console and server logs
3. Verify all environment variables are correctly set
4. Ensure all dependencies are installed

## 📄 License

MIT License - feel free to use this project for learning and development.