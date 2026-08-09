import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as authApi from '../../api/auth';
import * as usersApi from '../../api/users';
import { AuthUser } from '../../api/auth';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '../../lib/secureStorage';
import { getApiErrorCode } from '../../api/client';

export type AuthStatus = 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  hasBootstrapped: boolean;
  isSubmitting: boolean;
  user: AuthUser | null;
  error: string | null;
}

const initialState: AuthState = {
  status: 'unauthenticated',
  hasBootstrapped: false,
  isSubmitting: false,
  user: null,
  error: null,
};

export const register = createAsyncThunk(
  'auth/register',
  async (params: { email: string; password: string; name: string }, { rejectWithValue }) => {
    try {
      const result = await authApi.registerRequest(params.email, params.password, params.name);
      await setTokens(result.tokens.accessToken, result.tokens.refreshToken);
      return result.user;
    } catch (error) {
      return rejectWithValue(getApiErrorCode(error) ?? 'REGISTER_FAILED');
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (params: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const result = await authApi.loginRequest(params.email, params.password);
      await setTokens(result.tokens.accessToken, result.tokens.refreshToken);
      return result.user;
    } catch (error) {
      return rejectWithValue(getApiErrorCode(error) ?? 'LOGIN_FAILED');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  const refreshToken = await getRefreshToken();
  if (refreshToken) {
    try {
      await authApi.logoutRequest(refreshToken);
    } catch {
      // Token may already be expired/revoked server-side — clearing locally is enough.
    }
  }
  await clearTokens();
});

// Runs once on app start: checks for a stored access token and, if present,
// validates it against the backend to restore the session.
export const bootstrapAuth = createAsyncThunk('auth/bootstrap', async () => {
  const accessToken = await getAccessToken();
  if (!accessToken) return null;

  try {
    const { user } = await usersApi.getProfile();
    return user;
  } catch {
    await clearTokens();
    return null;
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
    userProfileUpdated(state, action: { payload: AuthUser }) {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(register.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.status = 'authenticated';
        state.user = action.payload;
      })
      .addCase(register.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = (action.payload as string) ?? 'REGISTER_FAILED';
      })
      .addCase(login.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.status = 'authenticated';
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = (action.payload as string) ?? 'LOGIN_FAILED';
      })
      .addCase(logout.fulfilled, (state) => {
        state.status = 'unauthenticated';
        state.user = null;
      })
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        state.hasBootstrapped = true;
        state.status = action.payload ? 'authenticated' : 'unauthenticated';
        state.user = action.payload;
      })
      .addCase(bootstrapAuth.rejected, (state) => {
        state.hasBootstrapped = true;
        state.status = 'unauthenticated';
        state.user = null;
      });
  },
});

export const { clearAuthError, userProfileUpdated } = authSlice.actions;
export default authSlice.reducer;
