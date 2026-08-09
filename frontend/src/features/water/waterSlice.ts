import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as waterApi from '../../api/water';
import * as usersApi from '../../api/users';
import { WaterSummary } from '../../api/water';
import { getApiErrorCode } from '../../api/client';

interface WaterState {
  summary: WaterSummary | null;
  status: 'idle' | 'loading' | 'error';
  error: string | null;
}

const initialState: WaterState = {
  summary: null,
  status: 'idle',
  error: null,
};

export const fetchSummary = createAsyncThunk('water/fetchSummary', async (_: void, { rejectWithValue }) => {
  try {
    return await waterApi.getSummary();
  } catch (error) {
    return rejectWithValue(getApiErrorCode(error) ?? 'FETCH_SUMMARY_FAILED');
  }
});

export const addWaterLog = createAsyncThunk('water/addLog', async (amountMl: number, { rejectWithValue }) => {
  try {
    return await waterApi.logWater(amountMl);
  } catch (error) {
    return rejectWithValue(getApiErrorCode(error) ?? 'LOG_WATER_FAILED');
  }
});

export const removeWaterLog = createAsyncThunk('water/removeLog', async (logId: string, { rejectWithValue }) => {
  try {
    await waterApi.deleteLog(logId);
    return logId;
  } catch (error) {
    return rejectWithValue(getApiErrorCode(error) ?? 'DELETE_LOG_FAILED');
  }
});

export const updateHydrationGoal = createAsyncThunk(
  'water/updateGoal',
  async (dailyGoalMl: number, { rejectWithValue }) => {
    try {
      return await usersApi.updateSettings({ hydration: { dailyGoalMl } });
    } catch (error) {
      return rejectWithValue(getApiErrorCode(error) ?? 'UPDATE_GOAL_FAILED');
    }
  }
);

const waterSlice = createSlice({
  name: 'water',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSummary.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchSummary.fulfilled, (state, action) => {
        state.status = 'idle';
        state.summary = action.payload;
      })
      .addCase(fetchSummary.rejected, (state, action) => {
        state.status = 'error';
        state.error = (action.payload as string) ?? 'FETCH_SUMMARY_FAILED';
      })
      .addCase(addWaterLog.fulfilled, (state, action) => {
        if (!state.summary) return;
        state.summary.logs.push(action.payload.log);
        state.summary.totalMl = action.payload.totalMl;
        state.summary.goalMl = action.payload.goalMl;
        state.summary.goalMet = action.payload.goalMet;
      })
      .addCase(removeWaterLog.fulfilled, (state, action) => {
        if (!state.summary) return;
        state.summary.logs = state.summary.logs.filter((log) => log._id !== action.payload);
        state.summary.totalMl = state.summary.logs.reduce((sum, log) => sum + log.amountMl, 0);
        state.summary.goalMet = state.summary.totalMl >= state.summary.goalMl;
      })
      .addCase(updateHydrationGoal.fulfilled, (state, action) => {
        if (!state.summary) return;
        state.summary.goalMl = action.payload.hydration.dailyGoalMl;
        state.summary.goalMet = state.summary.totalMl >= state.summary.goalMl;
      });
  },
});

export default waterSlice.reducer;
