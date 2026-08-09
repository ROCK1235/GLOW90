import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as skincareApi from '../../api/skincare';
import { SkincareRoutine } from '../../api/skincare';
import { getApiErrorCode } from '../../api/client';
import { todayUTCStr } from '../../lib/date';

interface SkincareState {
  items: SkincareRoutine[];
  status: 'idle' | 'loading' | 'error';
  error: string | null;
  // Completed step numbers for today, per routine — derived from the real
  // day's log (fetched alongside the list), not just local taps. Learned from
  // the equivalent bug in supplementsSlice: populate this from the backend on
  // every fetch, don't let it be session-only state that resets on relogin.
  todayCompletedSteps: Record<string, number[]>;
}

const initialState: SkincareState = {
  items: [],
  status: 'idle',
  error: null,
  todayCompletedSteps: {},
};

export const fetchRoutines = createAsyncThunk('skincare/fetch', async (_: void, { rejectWithValue }) => {
  try {
    const items = await skincareApi.listRoutines();
    const today = todayUTCStr();

    const logsPerRoutine = await Promise.all(
      items.map((item) => skincareApi.listLogs(item._id, today, today).catch(() => []))
    );

    const todayCompletedSteps: Record<string, number[]> = {};
    items.forEach((item, index) => {
      todayCompletedSteps[item._id] = logsPerRoutine[index][0]?.completedSteps ?? [];
    });

    return { items, todayCompletedSteps };
  } catch (error) {
    return rejectWithValue(getApiErrorCode(error) ?? 'FETCH_ROUTINES_FAILED');
  }
});

export const addRoutine = createAsyncThunk(
  'skincare/create',
  async (input: skincareApi.RoutineInput, { rejectWithValue }) => {
    try {
      return await skincareApi.createRoutine(input);
    } catch (error) {
      return rejectWithValue(getApiErrorCode(error) ?? 'CREATE_ROUTINE_FAILED');
    }
  }
);

export const editRoutine = createAsyncThunk(
  'skincare/edit',
  async (params: { id: string; input: Partial<skincareApi.RoutineInput> }, { rejectWithValue }) => {
    try {
      return await skincareApi.updateRoutine(params.id, params.input);
    } catch (error) {
      return rejectWithValue(getApiErrorCode(error) ?? 'EDIT_ROUTINE_FAILED');
    }
  }
);

export const removeRoutine = createAsyncThunk('skincare/archive', async (id: string, { rejectWithValue }) => {
  try {
    await skincareApi.archiveRoutine(id);
    return id;
  } catch (error) {
    return rejectWithValue(getApiErrorCode(error) ?? 'ARCHIVE_ROUTINE_FAILED');
  }
});

export const toggleStep = createAsyncThunk(
  'skincare/toggleStep',
  async (params: { routineId: string; stepOrder: number; currentCompleted: number[] }, { rejectWithValue }) => {
    try {
      const newCompleted = params.currentCompleted.includes(params.stepOrder)
        ? params.currentCompleted.filter((order) => order !== params.stepOrder)
        : [...params.currentCompleted, params.stepOrder];
      const result = await skincareApi.logProgress(params.routineId, newCompleted);
      return { routineId: params.routineId, log: result.log };
    } catch (error) {
      return rejectWithValue(getApiErrorCode(error) ?? 'TOGGLE_STEP_FAILED');
    }
  }
);

const skincareSlice = createSlice({
  name: 'skincare',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoutines.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchRoutines.fulfilled, (state, action) => {
        state.status = 'idle';
        state.items = action.payload.items;
        state.todayCompletedSteps = action.payload.todayCompletedSteps;
      })
      .addCase(fetchRoutines.rejected, (state, action) => {
        state.status = 'error';
        state.error = (action.payload as string) ?? 'FETCH_ROUTINES_FAILED';
      })
      .addCase(addRoutine.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(editRoutine.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item._id === action.payload._id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(removeRoutine.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item._id !== action.payload);
        delete state.todayCompletedSteps[action.payload];
      })
      .addCase(toggleStep.fulfilled, (state, action) => {
        state.todayCompletedSteps[action.payload.routineId] = action.payload.log.completedSteps;
      });
  },
});

export default skincareSlice.reducer;
