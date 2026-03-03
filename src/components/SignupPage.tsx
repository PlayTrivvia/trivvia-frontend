import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { requestVerificationCode, verifyCode, setUsername } from '../store/authSlice';
import NavigationBar from './NavigationBar';
import './LoginPage.css';

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

function SignupPage() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState(auth.email || '');
  const [usernameInput, setUsernameInput] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'details' | 'code'>('details');
  const [usernameError, setUsernameError] = useState('');
  const navigate = useNavigate();

  const validateUsername = (username: string): string | null => {
    if (username.length < 3) {
      return 'Username must be at least 3 characters';
    }
    if (username.length > 20) {
      return 'Username must be 20 characters or less';
    }
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      return 'Username can only contain letters and numbers';
    }
    return null;
  };

  const checkUsernameAvailable = async (username: string): Promise<boolean> => {
    // First validate format
    const validationError = validateUsername(username);
    if (validationError) {
      setUsernameError(validationError);
      return false;
    }

    // Then check availability
    try {
      const response = await fetch(
        `${apiBase}/check_username_available?username=${encodeURIComponent(username)}`,
      );
      const data = await response.json();
      if (!response.ok) {
        setUsernameError(data.error || 'Failed to check username');
        return false;
      }
      if (!data.available) {
        setUsernameError('That name is already taken. Try another one.');
        return false;
      }
      setUsernameError('');
      return true;
    } catch (error) {
      setUsernameError('Failed to check username. Please try again.');
      return false;
    }
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !usernameInput.trim()) return;

    const ok = await checkUsernameAvailable(usernameInput.trim());
    if (!ok) return;

    const result = await dispatch(requestVerificationCode({ email }));
    if (requestVerificationCode.fulfilled.match(result)) {
      setStep('code');
    }
  };

  const handleVerifyAndSetUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !code || !usernameInput.trim()) return;

    const verifyResult = await dispatch(verifyCode({ email, code }));
    if (!verifyCode.fulfilled.match(verifyResult)) {
      return;
    }

    // If backend says username still needed, set it now
    if (verifyResult.payload.needsUsername) {
      const setResult = await dispatch(setUsername({ username: usernameInput.trim() }));
      if (!setUsername.fulfilled.match(setResult)) {
        return;
      }
    }

    navigate('/rooms');
  };

  return (
    <div className="login-page">
      <NavigationBar currentPage="login" />
      <div className="login-container">
        <div className="login-content">
          <h1 className="login-title">Create your Trivvia account</h1>
          <p className="login-subtitle">Pick a short name and we’ll email you a one-time code.</p>

          {auth.error && (
            <div className="error-message">
              {auth.error}
            </div>
          )}

          {step === 'details' && (
            <form className="login-form" onSubmit={handleRequestCode}>
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="username" className="form-label">
                  Short name (3-20 characters, letters and numbers only)
                </label>
                <input
                  type="text"
                  id="username"
                  className="form-input"
                  value={usernameInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    setUsernameInput(value);
                    
                    // Clear error when typing
                    setUsernameError('');
                    
                    // Show real-time validation feedback
                    if (value.length > 0) {
                      const error = validateUsername(value);
                      if (error) {
                        setUsernameError(error);
                      }
                    }
                  }}
                  placeholder="e.g. CheerfulTiger"
                  maxLength={20}
                  required
                />
                {usernameError && (
                  <div className="error-message" style={{ marginTop: 'var(--spacing-sm)' }}>
                    {usernameError}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="login-button"
                disabled={auth.isLoading || !email || !usernameInput.trim()}
              >
                {auth.isLoading ? 'Sending code…' : 'Send code'}
              </button>
            </form>
          )}

          {step === 'code' && (
            <form className="login-form" onSubmit={handleVerifyAndSetUsername}>
              <div className="form-group">
                <label htmlFor="code" className="form-label">
                  Enter code sent to {email}
                </label>
                <input
                  type="text"
                  id="code"
                  className="form-input"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="6-digit code"
                  maxLength={6}
                  required
                />
              </div>

              <button
                type="submit"
                className="login-button"
                disabled={auth.isLoading || !code}
              >
                {auth.isLoading ? 'Verifying…' : 'Verify & start playing'}
              </button>
            </form>
          )}

          <div className="login-footer">
            <p className="login-footer-text">
              Already have an account?{' '}
              <button
                className="signup-link"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/login');
                }}
              >
                Log in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;


