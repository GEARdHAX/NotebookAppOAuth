import React, { useState, useEffect } from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import './App.css';

console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);

// API Base URL
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// API Helper Functions
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Components
const LoadingSpinner = () => (
  <div className="loading-spinner">
    <div className="spinner"></div>
  </div>
);

const ErrorMessage = ({ message, onClose }) => (
  <div className="error-message">
    <span>{message}</span>
    <button onClick={onClose}>&times;</button>
  </div>
);

const SuccessMessage = ({ message, onClose }) => (
  <div className="success-message">
    <span>{message}</span>
    <button onClick={onClose}>&times;</button>
  </div>
);

const LoginForm = ({ onLogin, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE}/auth/login`, formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      onLogin(response.data.user);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE}/auth/google`, {
        tokenId: credentialResponse.credential
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      onLogin(response.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Welcome Back</h2>
        <p>Sign in to your account</p>

        {error && <ErrorMessage message={error} onClose={() => setError('')} />}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="Enter your email"
            />
          </div>

<div className="form-group password-group">
  <label>Password</label>
  <div className="password-wrapper">
    <input
      type={showPassword ? "text" : "password"}
      value={formData.password}
      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
      required
      placeholder="Enter your password"
    />
    <button
      type="button"
      className="toggle-password"
      onClick={() => setShowPassword(!showPassword)}
    >
      {showPassword ? "🙈" : "👁️"}
    </button>
  </div>
</div>



          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <LoadingSpinner /> : 'Sign In'}
          </button>
        </form>

        <div className="divider">
          <span>or</span>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <GoogleLogin
            onSuccess={handleGoogleLogin}
            onError={() => setError('Google login failed')}
            theme="outline"
            size="large"
            width="100%"
          />
        </div>

        <p className="auth-switch">
          Don't have an account?{' '}
          <button onClick={onSwitchToRegister} className="link-btn">
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};

const RegisterForm = ({ onSwitchToLogin, onRegistrationSuccess }) => {
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(`${API_BASE}/auth/register`, formData);
      setSuccess(response.data.message || 'Registration successful! Please verify your email.');
      onRegistrationSuccess(formData.email);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create Account</h2>
        <p>Sign up to start taking notes</p>

        {error && <ErrorMessage message={error} onClose={() => setError('')} />}
        {success && <SuccessMessage message={success} onClose={() => setSuccess('')} />}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="Enter your email"
            />
          </div>

      <div className="form-group password-group">
  <label>Password</label>
  <div className="password-wrapper">
    <input
      type={showPassword ? "text" : "password"}
      value={formData.password}
      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
      required
      placeholder="Create a password (min 6 characters)"
      minLength="6"
    />
    <button
      type="button"
      className="toggle-password"
      onClick={() => setShowPassword(!showPassword)}
    >
      {showPassword ? "🙈" : "👁️"}
    </button>
  </div>
</div>


          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <LoadingSpinner /> : 'Sign Up'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{' '}
          <button onClick={onSwitchToLogin} className="link-btn">
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};

const OTPVerification = ({ email, onVerificationSuccess, onBackToLogin }) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE}/auth/verify-otp`, {
        email,
        otp
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      onVerificationSuccess(response.data.user);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    setError('');

    try {
      await axios.post(`${API_BASE}/auth/resend-otp`, { email });
      alert('OTP sent successfully!');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Verify Your Email</h2>
        <p>We've sent a 6-digit code to {email}</p>

        {error && <ErrorMessage message={error} onClose={() => setError('')} />}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Enter OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              placeholder="000000"
              maxLength="6"
              className="otp-input"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading || otp.length !== 6}>
            {loading ? <LoadingSpinner /> : 'Verify'}
          </button>
        </form>

        <div className="otp-actions">
          <button onClick={handleResendOTP} disabled={resendLoading} className="link-btn">
            {resendLoading ? 'Sending...' : 'Resend OTP'}
          </button>
          <button onClick={onBackToLogin} className="link-btn">
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ user, onLogout }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await axios.get(`${API_BASE}/notes`, {
        headers: getAuthHeaders(),
      });
      setNotes(response.data.notes || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE}/notes`, newNote, {
        headers: getAuthHeaders(),
      });

      setNotes([response.data.note, ...notes]);
      setNewNote({ title: '', content: '' });
      setShowCreateModal(false);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to create note');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;

    try {
      await axios.delete(`${API_BASE}/notes/${noteId}`, {
        headers: getAuthHeaders(),
      });

      setNotes(notes.filter(note => note.id !== noteId && note._id !== noteId));
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to delete note');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onLogout();
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <LoadingSpinner />
        <p>Loading your notes...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1>My Notes</h1>
            <p>Welcome back, {user.name || user.email}!</p>
          </div>
          <div className="header-right">
            <button onClick={() => setShowCreateModal(true)} className="btn-primary">
              + New Note
            </button>
            <button onClick={handleLogout} className="btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '0 20px' }}>
          <ErrorMessage message={error} onClose={() => setError('')} />
        </div>
      )}

      {/* Main Content */}
      <main className="dashboard-main">
        {notes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No notes yet</h3>
            <p>Create your first note to get started!</p>
            <button onClick={() => setShowCreateModal(true)} className="btn-primary">
              Create Note
            </button>
          </div>
        ) : (
          <div className="notes-grid">
            {notes.map((note) => (
              <div key={note.id || note._id} className="note-card">
                <div className="note-header">
                  <h3>{note.title}</h3>
                  <button
                    onClick={() => handleDeleteNote(note.id || note._id)}
                    className="delete-btn"
                    title="Delete note"
                  >
                    🗑️
                  </button>
                </div>
                <div className="note-content">
                  <p>{note.content}</p>
                </div>
                <div className="note-footer">
                  <small>
                    {new Date(note.createdAt || note.updatedAt || Date.now()).toLocaleDateString()}
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Note Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Create New Note</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="close-btn"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateNote}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  required
                  placeholder="Enter note title"
                />
              </div>

              <div className="form-group">
                <label>Content</label>
                <textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  required
                  placeholder="Write your note here..."
                  rows="6"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={createLoading}>
                  {createLoading ? <LoadingSpinner /> : 'Create Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

function App() {
  const [currentView, setCurrentView] = useState("login");
  const [user, setUser] = useState(null);
  const [otpEmail, setOtpEmail] = useState("");

  // Auto-login if user already in localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setCurrentView("dashboard");
      } catch (err) {
        // If stored data is corrupted, clear it
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setCurrentView("dashboard");
  };

  const handleRegistrationSuccess = (email) => {
    setOtpEmail(email);
    setCurrentView("otp");
  };

  const handleVerificationSuccess = (userData) => {
    setUser(userData);
    setCurrentView("dashboard");
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setCurrentView("login");
  };

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <div className="app">
      {googleClientId ? (
        <GoogleOAuthProvider clientId={googleClientId}>
          {currentView === "login" && (
            <LoginForm
              onLogin={handleLogin}
              onSwitchToRegister={() => setCurrentView("register")}
            />
          )}

          {currentView === "register" && (
            <RegisterForm
              onSwitchToLogin={() => setCurrentView("login")}
              onRegistrationSuccess={handleRegistrationSuccess}
            />
          )}

          {currentView === "otp" && (
            <OTPVerification
              email={otpEmail}
              onVerificationSuccess={handleVerificationSuccess}
              onBackToLogin={() => setCurrentView("login")}
            />
          )}

          {currentView === "dashboard" && user && (
            <Dashboard user={user} onLogout={handleLogout} />
          )}
        </GoogleOAuthProvider>
      ) : (
        <div className="auth-container">
          <div className="auth-card">
            <h2>Configuration Error</h2>
            <p>Google Client ID is missing. Please check your .env file.</p>
            <p>Add VITE_GOOGLE_CLIENT_ID to your frontend/.env file</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;