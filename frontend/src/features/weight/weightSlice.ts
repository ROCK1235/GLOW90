import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as weightApi from '../../api/weight';
import { WeightLog } from '../../api/weight';
import { getApiErrorCode } from '../../api/client';
import { todayUTCStr } from '../../lib/date';

interface WeightState {
  logs: WeightLog[];
  status: 'idle' | 'loading' | 'error';
  error: string | null;
}

const initialState: WeightState = {
  logs: [],
  status: 'idle',
  error: null,
};

// Wide lookback (not the backend's 90-day default) so the earliest-ever log
// is actually captured — the ring uses it as the "starting weight" baseline.
function farPastDateStr(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 3);
  return d.toISOString().slice(0, 10);
}

export const fetchWeightLogs = createAsyncThunk('weight/fetch', async (_: void, { rejectWithValue }) => {
  try {
    return await weightApi.listWeightLogs(farPastDateStr(), todayUTCStr());
  } catch (error) {
    return rejectWithValue(getApiErrorCode(error) ?? 'FETCH_WEIGHT_FAILED');
  }
});

export const addWeightLog = createAsyncThunk(
  'weight/add',
  async (input: weightApi.LogWeightInput, { rejectWithValue }) => {
    try {
      return await weightApi.logWeight(input);
    } catch (error) {
      return rejectWithValue(getApiErrorCode(error) ?? 'LOG_WEIGHT_FAILED');
    }
  }
);

export const removeWeightLog = createAsyncThunk('weight/remove', async (date: string, { rejectWithValue }) => {
  try {
    await weightApi.deleteWeightLog(date);
    return date;
  } catch (error) {
    return rejectWithValue(getApiErrorCode(error) ?? 'REMOVE_WEIGHT_FAILED');
  }
});

const weightSlice = createSlice({
  name: 'weight',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWeightLogs.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchWeightLogs.fulfilled, (state, action) => {
        state.status = 'idle';
        state.logs = action.payload;
      })
      .addCase(fetchWeightLogs.rejected, (state, action) => {
        state.status = 'error';
        state.error = (action.payload as string) ?? 'FETCH_WEIGHT_FAILED';
      })
      .addCase(addWeightLog.fulfilled, (state, action) => {
        const index = state.logs.findIndex((log) => log.date === action.payload.date);
        if (index !== -1) {
          state.logs[index] = action.payload;
        } else {
          state.logs.unshift(action.payload);
        }
      })
      .addCase(removeWeightLog.fulfilled, (state, action) => {
        state.logs = state.logs.filter((log) => log.date !== action.payload);
      });
  },
});

export default weightSlice.reducer;
