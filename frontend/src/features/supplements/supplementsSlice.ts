import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as supplementsApi from '../../api/supplements';
import { Supplement } from '../../api/supplements';
import { getApiErrorCode } from '../../api/client';
import { todayUTCStr } from '../../lib/date';

interface SupplementsState {
  items: Supplement[];
  status: 'idle' | 'loading' | 'error';
  error: string | null;
  // Which scheduled times have an actual dose log for today, keyed by
  // supplement id. Populated from the real logs (fetchSupplements fetches
  // each supplement's today-range logs alongside the list itself), not just
  // taps this session — so it survives logout/login and app restarts.
  loggedTimesToday: Record<string, string[]>;
}

const initialState: SupplementsState = {
  items: [],
  status: 'idle',
  error: null,
  loggedTimesToday: {},
};

export const fetchSupplements = createAsyncThunk('supplements/fetch', async (_: void, { rejectWithValue }) => {
  try {
    const items = await supplementsApi.listSupplements();
    const today = todayUTCStr();

    const logsPerSupplement = await Promise.all(
      items.map((item) => supplementsApi.listLogs(item._id, today, today).catch(() => []))
    );

    const loggedTimesToday: Record<string, string[]> = {};
    items.forEach((item, index) => {
      loggedTimesToday[item._id] = logsPerSupplement[index].map((log) => log.time);
    });

    return { items, loggedTimesToday };
  } catch (error) {
    return rejectWithValue(getApiErrorCode(error) ?? 'FETCH_SUPPLEMENTS_FAILED');
  }
});

export const addSupplement = createAsyncThunk(
  'supplements/create',
  async (input: supplementsApi.SupplementInput, { rejectWithValue }) => {
    try {
      return await supplementsApi.createSupplement(input);
    } catch (error) {
      return rejectWithValue(getApiErrorCode(error) ?? 'CREATE_SUPPLEMENT_FAILED');
    }
  }
);

export const editSupplement = createAsyncThunk(
  'supplements/edit',
  async (params: { id: string; input: Partial<supplementsApi.SupplementInput> }, { rejectWithValue }) => {
    try {
      return await supplementsApi.updateSupplement(params.id, params.input);
    } catch (error) {
      return rejectWithValue(getApiErrorCode(error) ?? 'EDIT_SUPPLEMENT_FAILED');
    }
  }
);

export const removeSupplement = createAsyncThunk('supplements/archive', async (id: string, { rejectWithValue }) => {
  try {
    await supplementsApi.archiveSupplement(id);
    return id;
  } catch (error) {
    return rejectWithValue(getApiErrorCode(error) ?? 'ARCHIVE_SUPPLEMENT_FAILED');
  }
});

export const logSupplementDose = createAsyncThunk(
  'supplements/logDose',
  async (params: { id: string; time: string }, { rejectWithValue }) => {
    try {
      return await supplementsApi.logDose(params.id, params.time);
    } catch (error) {
      return rejectWithValue(getApiErrorCode(error) ?? 'LOG_DOSE_FAILED');
    }
  }
);

const supplementsSlice = createSlice({
  name: 'supplements',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSupplements.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchSupplements.fulfilled, (state, action) => {
        state.status = 'idle';
        state.items = action.payload.items;
        state.loggedTimesToday = action.payload.loggedTimesToday;
      })
      .addCase(fetchSupplements.rejected, (state, action) => {
        state.status = 'error';
        state.error = (action.payload as string) ?? 'FETCH_SUPPLEMENTS_FAILED';
      })
      .addCase(addSupplement.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(editSupplement.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item._id === action.payload._id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(removeSupplement.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item._id !== action.payload);
        delete state.loggedTimesToday[action.payload];
      })
      .addCase(logSupplementDose.fulfilled, (state, action) => {
        const { id, time } = action.meta.arg;
        const logged = state.loggedTimesToday[id] ?? [];
        if (!logged.includes(time)) {
          state.loggedTimesToday[id] = [...logged, time];
        }
      });
  },
});

export default supplementsSlice.reducer;
