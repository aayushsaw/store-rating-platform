import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthResponse, AuthUser, LoginInput, RegisterInput } from '@store-rating/shared';
import { api } from '@/lib/api';

// ─── State ────────────────────────────────────────────────────────────────────

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean; // true while checkAuth is running on boot
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isInitializing: true,
  loading: false,
  error: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

/** Called once on app boot to silently restore session via refresh cookie */
export const checkAuth = createAsyncThunk('auth/checkAuth', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.post<AuthResponse>('/auth/refresh');
    return data;
  } catch {
    return rejectWithValue(null); // No active session — not an error
  }
});

export const loginThunk = createAsyncThunk(
  'auth/login',
  async (credentials: LoginInput, { rejectWithValue }) => {
    try {
      const { data } = await api.post<AuthResponse>('/auth/login', credentials);
      return data;
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Login failed';
      return rejectWithValue(message);
    }
  },
);

export const registerThunk = createAsyncThunk(
  'auth/register',
  async (payload: RegisterInput, { rejectWithValue }) => {
    try {
      const { data } = await api.post<{ message: string; user: AuthUser }>(
        '/auth/register',
        payload,
      );
      return data;
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Registration failed';
      return rejectWithValue(message);
    }
  },
);

export const logoutThunk = createAsyncThunk('auth/logout', async () => {
  try {
    await api.post('/auth/logout');
  } catch {
    // Always clear local state even if the server call fails
  }
});

// ─── Slice ────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Called by the Axios interceptor when a silent refresh succeeds */
    setAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
    },
    /** Called when refresh fails or logout is forced */
    clearAuth(state) {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // ── checkAuth ────────────────────────────────────────────────────────────
    builder
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        state.isInitializing = false;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.isInitializing = false; // No session – proceed to login
      });

    // ── loginThunk ───────────────────────────────────────────────────────────
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // ── registerThunk ─────────────────────────────────────────────────────────
    builder
      .addCase(registerThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerThunk.fulfilled, (state) => {
        state.loading = false;
        // Don't auto-login after registration – user must explicitly log in
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // ── logoutThunk ──────────────────────────────────────────────────────────
    builder.addCase(logoutThunk.fulfilled, (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.error = null;
    });
  },
});

export const { setAccessToken, clearAuth, clearError } = authSlice.actions;
export default authSlice.reducer;
