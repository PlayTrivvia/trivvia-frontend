import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { requestVerificationCode, verifyCode, setUsername } from '../store/authSlice';
import NavigationBar from './NavigationBar';
import './LoginPage.css';

function LoginPage() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState(auth.email || '');
  const [code, setCode] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [step, setStep] = useState<'email' | 'code' | 'username'>('email');
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

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    const result = await dispatch(requestVerificationCode({ email }));
    if (requestVerificationCode.fulfilled.match(result)) {
      setStep('code');
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !code) return;

    const result = await dispatch(verifyCode({ email, code }));
    if (verifyCode.fulfilled.match(result)) {
      if (result.payload.needsUsername) {
        setStep('username');
      } else {
        navigate('/rooms');
      }
    }
  };

  const handleSetUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;

    // Validate username format
    const validationError = validateUsername(usernameInput.trim());
    if (validationError) {
      setUsernameError(validationError);
      return;
    }

    const result = await dispatch(setUsername({ username: usernameInput.trim() }));
    if (setUsername.fulfilled.match(result)) {
      navigate('/rooms');
    }
  };

  return (
    <div className="login-page">
      <NavigationBar currentPage="login" />
      <div className="login-container">
        <div className="login-content">
          <h1 className="login-title">Welcome Back!</h1>
          <p className="login-subtitle">Sign in with a one-time code to continue playing Trivvia</p>

          {auth.error && (
            <div className="error-message">
              {auth.error}
            </div>
          )}

          {step === 'email' && (
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
                  placeholder="your@email.com"
                  required
                />
              </div>

              <button
                type="submit"
                className="login-button"
                disabled={auth.isLoading || !email}
              >
                {auth.isLoading ? 'Sending code...' : 'Send code'}
              </button>
            </form>
          )}

          {step === 'code' && (
            <form className="login-form" onSubmit={handleVerifyCode}>
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
                {auth.isLoading ? 'Verifying...' : 'Verify & continue'}
              </button>
            </form>
          )}

          {step === 'username' && (
            <form className="login-form" onSubmit={handleSetUsername}>
              <div className="form-group">
                <label htmlFor="username" className="form-label">
                  Choose a short name (3-20 characters, letters and numbers only)
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
                disabled={auth.isLoading || !usernameInput.trim()}
              >
                {auth.isLoading ? 'Saving...' : 'Save & start playing'}
              </button>
            </form>
          )}

          <div className="login-footer">
            <p className="login-footer-text">
              Don't have an account?{' '}
              <button
                className="signup-link"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/signup');
                }}
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

