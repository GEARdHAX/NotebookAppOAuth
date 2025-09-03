import React, { useState, useEffect } from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import './App.css';
// console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiCall('/auth/login', {
        method: 'POST',
        body: formData,
      });

      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      onLogin(response.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    // In a real implementation, you'd use Google's JavaScript SDK
    alert('Google login integration requires Google SDK setup. Please use email login.');
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

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <LoadingSpinner /> : 'Sign In'}
          </button>
        </form>

        <div className="divider">
          <span>or</span>
        </div>

        <button onClick={handleGoogleLogin} className="btn-google">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await apiCall('/auth/register', {
        method: 'POST',
        body: formData,
      });

      setSuccess(response.message);
      onRegistrationSuccess(formData.email);
    } catch (err) {
      setError(err.message);
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

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="Create a password (min 6 characters)"
              minLength="6"
            />
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
      const response = await apiCall('/auth/verify-otp', {
        method: 'POST',
        body: { email, otp },
      });

      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      onVerificationSuccess(response.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    setError('');

    try {
      await apiCall('/auth/resend-otp', {
        method: 'POST',
        body: { email },
      });
      alert('OTP sent successfully!');
    } catch (err) {
      setError(err.message);
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
      const response = await apiCall('/notes', {
        headers: getAuthHeaders(),
      });
      setNotes(response.notes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setError('');

    try {
      const response = await apiCall('/notes', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: newNote,
      });

      setNotes([response.note, ...notes]);
      setNewNote({ title: '', content: '' });
      setShowCreateModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;

    try {
      await apiCall(`/notes/${noteId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      setNotes(notes.filter(note => note.id !== noteId));
    } catch (err) {
      setError(err.message);
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
            <p>Welcome back, {user.name}!</p>
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
      {error && <ErrorMessage message={error} onClose={() => setError('')} />}

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
                    {new Date(note.createdAt).toLocaleDateString()}
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
  const [currentView, setCurrentView] = useState("login"); // login | register | otp | dashboard
  const [user, setUser] = useState(null);
  const [otpEmail, setOtpEmail] = useState("");

  // Auto-login if user already in localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setCurrentView("dashboard");
    }
  }, []);

  // ---------- HANDLERS ----------
  const handleLogin = (userData, token) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    if (token) localStorage.setItem("token", token);
    setCurrentView("dashboard");
  };

  const handleRegistrationSuccess = (email) => {
    setOtpEmail(email);
    setCurrentView("otp");
  };

  const handleVerificationSuccess = (userData, token) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    if (token) localStorage.setItem("token", token);
    setCurrentView("dashboard");
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setCurrentView("login");
  };

  // ---------- RENDER ----------
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <div style={{ padding: "20px", fontFamily: "Arial" }}>
        {/* ---------- LOGIN VIEW ---------- */}
        {currentView === "login" && (
          <div>
            <h2>Login</h2>

            {/* Email/Password Login */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const email = e.target.email.value;
                const password = e.target.password.value;

                try {
                  const res = await axios.post(
                    `${import.meta.env.VITE_API_URL}/auth/login`,
                    { email, password }
                  );
                  handleLogin(res.data.user, res.data.token);
                } catch (err) {
                  alert("Login failed");
                }
              }}
            >
              <input type="email" name="email" placeholder="Email" required />
              <br />
              <input
                type="password"
                name="password"
                placeholder="Password"
                required
              />
              <br />
              <button type="submit">Login</button>
            </form>

            <hr />

            {/* Google Login */}
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                try {
                  const res = await axios.post(
                    `${import.meta.env.VITE_API_URL}/auth/google`,
                    { token: credentialResponse.credential }
                  );
                  handleLogin(res.data.user, res.data.token);
                } catch (err) {
                  console.error(err);
                  alert("Google login failed");
                }
              }}
              onError={() => {
                alert("Google login failed");
              }}
            />

            <p>
              Dont have an account?{" "}
              <button onClick={() => setCurrentView("register")}>
                Register
              </button>
            </p>
          </div>
        )}

        {/* ---------- REGISTER VIEW ---------- */}
        {currentView === "register" && (
          <div>
            <h2>Register</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const email = e.target.email.value;
                const password = e.target.password.value;

                try {
                  await axios.post(
                    `${import.meta.env.VITE_API_URL}/auth/register`,
                    { email, password }
                  );
                  handleRegistrationSuccess(email);
                } catch (err) {
                  alert("Registration failed");
                }
              }}
            >
              <input type="email" name="email" placeholder="Email" required />
              <br />
              <input
                type="password"
                name="password"
                placeholder="Password"
                required
              />
              <br />
              <button type="submit">Register</button>
            </form>
            <p>
              Already have an account?{" "}
              <button onClick={() => setCurrentView("login")}>Login</button>
            </p>
          </div>
        )}

        {/* ---------- OTP VERIFICATION VIEW ---------- */}
        {currentView === "otp" && (
          <div>
            <h2>Verify OTP</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const otp = e.target.otp.value;

                try {
                  const res = await axios.post(
                    `${import.meta.env.VITE_API_URL}/auth/verify-otp`,
                    { email: otpEmail, otp }
                  );
                  handleVerificationSuccess(res.data.user, res.data.token);
                } catch (err) {
                  alert("OTP verification failed");
                }
              }}
            >
              <input type="text" name="otp" placeholder="Enter OTP" required />
              <br />
              <button type="submit">Verify</button>
            </form>
            <button onClick={() => setCurrentView("login")}>Back</button>
          </div>
        )}

        {/* ---------- DASHBOARD VIEW ---------- */}
        {currentView === "dashboard" && user && (
          <div>
            <h2>Welcome, {user.email || user.name}</h2>
            <p>You are logged in ✅</p>
            <button onClick={handleLogout}>Logout</button>
          </div>
        )}
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;