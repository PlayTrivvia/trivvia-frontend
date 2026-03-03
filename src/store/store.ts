import { configureStore } from '@reduxjs/toolkit';
import usernameReducer from './usernameSlice';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    username: usernameReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

