import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

interface AuthState {
  token: string | null;
  userId: number | null;
  email: string | null;
  username: string | null;
  verified: boolean;
  needsUsername: boolean;
  isPremium: boolean;
  premiumExpiresAt: string | null;
  isLoading: boolean;
  error: string | null;
}

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

const initialState: AuthState = {
  token: typeof window !== 'undefined' ? localStorage.getItem('trivvia_token') : null,
  userId:
    typeof window !== 'undefined' && localStorage.getItem('trivvia_user_id')
      ? Number(localStorage.getItem('trivvia_user_id'))
      : null,
  email: typeof window !== 'undefined' ? localStorage.getItem('trivvia_email') : null,
  username: typeof window !== 'undefined' ? localStorage.getItem('trivvia_username') : null,
  verified: typeof window !== 'undefined' ? localStorage.getItem('trivvia_verified') === 'true' : false,
  needsUsername: false,
  isPremium: typeof window !== 'undefined' ? localStorage.getItem('trivvia_is_premium') === 'true' : false,
  premiumExpiresAt: typeof window !== 'undefined' ? localStorage.getItem('trivvia_premium_expires_at') : null,
  isLoading: false,
  error: null,
};

export const requestVerificationCode = createAsyncThunk<
  { email: string },
  { email: string },
  { rejectValue: string }
>('auth/requestVerificationCode', async ({ email }, { rejectWithValue }) => {
  try {
    const response = await fetch(`${apiBase}/request_verification_code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return rejectWithValue(data.error || 'Failed to send verification code');
    }

    return { email };
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to send verification code');
  }
});

export const verifyCode = createAsyncThunk<
  {
    token: string;
    userId: number;
    email: string;
    username?: string;
    verified: boolean;
    needsUsername: boolean;
  },
  { email: string; code: string },
  { rejectValue: string }
>('auth/verifyCode', async ({ email, code }, { rejectWithValue }) => {
  try {
    const response = await fetch(`${apiBase}/verify_code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return rejectWithValue(data.error || 'Invalid or expired verification code');
    }

    return {
      token: data.token as string,
      userId: data.user_id as number,
      email: data.email as string,
      username: data.username as string | undefined,
      verified: Boolean(data.verified),
      needsUsername: Boolean(data.needs_username),
    };
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to verify code');
  }
});

export const setUsername = createAsyncThunk<
  { username: string },
  { username: string },
  { state: { auth: AuthState }; rejectValue: string }
>('auth/setUsername', async ({ username }, { getState, rejectWithValue }) => {
  try {
    const token = getState().auth.token;
    if (!token) {
      return rejectWithValue('Not authenticated');
    }

    const response = await fetch(`${apiBase}/set_username`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ username }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return rejectWithValue(data.error || 'Failed to set username');
    }

    return { username };
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to set username');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.token = null;
      state.userId = null;
      state.email = null;
      state.username = null;
      state.verified = false;
      state.needsUsername = false;
      state.isPremium = false;
      state.premiumExpiresAt = null;
      state.error = null;

      if (typeof window !== 'undefined') {
        localStorage.removeItem('trivvia_token');
        localStorage.removeItem('trivvia_user_id');
        localStorage.removeItem('trivvia_email');
        localStorage.removeItem('trivvia_username');
        localStorage.removeItem('trivvia_verified');
        localStorage.removeItem('trivvia_is_premium');
        localStorage.removeItem('trivvia_premium_expires_at');
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(requestVerificationCode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestVerificationCode.fulfilled, (state, action) => {
        state.isLoading = false;
        state.email = action.payload.email;
      })
      .addCase(requestVerificationCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to send verification code';
      })
      .addCase(verifyCode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyCode.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.userId = action.payload.userId;
        state.email = action.payload.email;
        state.username = action.payload.username || null;
        state.verified = action.payload.verified;
        state.needsUsername = action.payload.needsUsername;
        state.error = null;

        if (typeof window !== 'undefined') {
          localStorage.setItem('trivvia_token', action.payload.token);
          localStorage.setItem('trivvia_user_id', String(action.payload.userId));
          localStorage.setItem('trivvia_email', action.payload.email);
          localStorage.setItem('trivvia_verified', String(action.payload.verified));
          if (action.payload.username) {
            localStorage.setItem('trivvia_username', action.payload.username);
          }
        }
      })
      .addCase(verifyCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to verify code';
      })
      .addCase(setUsername.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(setUsername.fulfilled, (state, action) => {
        state.isLoading = false;
        state.username = action.payload.username;
        state.needsUsername = false;

        if (typeof window !== 'undefined') {
          localStorage.setItem('trivvia_username', action.payload.username);
        }
      })
      .addCase(setUsername.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to set username';
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;


