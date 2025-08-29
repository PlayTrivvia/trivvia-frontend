import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface UsernameState {
  currentUsername: string;
  sessionId: string;
  isLoading: boolean;
  error: string | null;
}

const initialState: UsernameState = {
  currentUsername: '',
  sessionId: '',
  isLoading: false,
  error: null,
};

// Async thunk for generating username
export const generateUsername = createAsyncThunk(
  'username/generate',
  async (_, { rejectWithValue }) => {
    try {
      // Generate a unique session ID
      const session_id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const response = await fetch('http://localhost:8081/generate_username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { username: data.username, session_id }; 
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to generate username');
    }
  }
);

// Async thunk for releasing username
export const releaseUsername = createAsyncThunk(
  'username/release',
  async (session_id: string, { rejectWithValue }) => {
    try {
      const response = await fetch('http://localhost:8081/release_username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return session_id;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to release username');
    }
  }
);

const usernameSlice = createSlice({
  name: 'username',
  initialState,
  reducers: {
    clearUsername: (state) => {
      state.currentUsername = '';
      state.sessionId = '';
      state.error = null;
    },
    setUsername: (state, action: PayloadAction<string>) => {
      state.currentUsername = action.payload;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Generate username
      .addCase(generateUsername.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(generateUsername.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentUsername = action.payload.username;
        state.sessionId = action.payload.session_id;
        state.error = null;
      })
      .addCase(generateUsername.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Release username
      .addCase(releaseUsername.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(releaseUsername.fulfilled, (state) => {
        state.isLoading = false;
        state.currentUsername = '';
        state.sessionId = '';
        state.error = null;
      })
      .addCase(releaseUsername.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearUsername, setUsername } = usernameSlice.actions;
export default usernameSlice.reducer;
