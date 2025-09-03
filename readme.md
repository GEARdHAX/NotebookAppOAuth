# Note Taking Application

A full-stack **TypeScript-based** note-taking application built with React, Node.js/Express, and MongoDB featuring user authentication, email verification, and Google OAuth integration.

---

## 🚀 Features

* **User Authentication**: Email/password signup with OTP verification
* **Google OAuth**: Quick signup/login with Google account
* **JWT Security**: Secure API authentication
* **Note Management**: Create, view, and delete notes
* **Responsive Design**: Mobile-friendly interface
* **Input Validation**: Client + server-side with TypeScript type safety
* **Error Handling**: Strongly typed error handling and clear messages

---

## 🛠️ Tech Stack

* **Frontend**: React 18 + TypeScript, CSS3
* **Backend**: Node.js, Express.js, TypeScript
* **Database**: MongoDB with Mongoose ODM
* **Authentication**: JWT, Google OAuth 2.0
* **Email**: Nodemailer for OTP verification

---

## 📋 Prerequisites

* Node.js (v16 or higher)
* MongoDB (local or MongoDB Atlas)
* Gmail account (for sending OTP emails)
* Google Cloud Console project (for OAuth Client ID)

---

## 🔧 Installation & Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd note-taking-app
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Initialize TypeScript (if not already done):

```bash
npx tsc --init
```

### 3. Environment Variables

Create `.env` file inside `backend`:

```env
MONGODB_URI=mongodb://localhost:27017/noteapp
JWT_SECRET=your_super_secret_jwt_key_here

EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password

GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

PORT=5000
```

### 4. Backend Scripts

In `backend/package.json`:

```json
"scripts": {
  "build": "tsc",
  "start": "node dist/server.js",
  "dev": "ts-node-dev --respawn --transpile-only server.ts"
}
```

* `server.ts` is your entry point (instead of `server.js`)
* Compiled JS will be in `dist/`

Run backend:

```bash
npm run dev
```

---

### 5. Frontend Setup

```bash
cd ../frontend
npm install
```

Create `.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

Run frontend:

```bash
npm run dev
```

---

## 🗄️ Database Schema (TypeScript Interfaces)

### `User`

```ts
interface User {
  _id: string;
  email: string;
  password: string;
  name: string;
  isVerified: boolean;
  googleId?: string;
  otp?: string;
  otpExpiry?: Date;
  createdAt: Date;
}
```

### `Note`

```ts
interface Note {
  _id: string;
  title: string;
  content: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🔌 API Endpoints

Authentication:

* `POST /api/auth/register` - Register
* `POST /api/auth/login` - Login
* `POST /api/auth/verify-otp` - Verify OTP
* `POST /api/auth/google` - Google login
* `POST /api/auth/resend-otp` - Resend OTP

Notes (JWT required):

* `GET /api/notes`
* `POST /api/notes`
* `DELETE /api/notes/:id`

---

## 🚀 Deployment

### Backend (Render/Railway/Heroku)

* `npm run build`
* Deploy `dist/` output with `npm start`
* Use MongoDB Atlas in production

### Frontend (Netlify/Vercel)

* `npm run build`
* Publish `dist/` folder (since Vite outputs `dist`)
* Set `VITE_API_URL` to deployed backend URL

---

## 📦 Project Structure

```
note-taking-app/
├── backend/
│   ├── src/
│   │   ├── server.ts
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── models/
│   │   └── utils/
│   ├── tsconfig.json
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   ├── pages/
│   │   └── types/
│   ├── vite.config.ts
│   ├── package.json
│   └── .env
└── README.md
```

---

## 🔒 Security

* TypeScript strict mode enabled
* Password hashing with bcryptjs
* JWT authentication with expiration
* OTP expiration logic
* CORS configured

---
