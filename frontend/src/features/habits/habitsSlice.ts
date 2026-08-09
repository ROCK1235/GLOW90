import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as habitsApi from '../../api/habits';
import { Habit } from '../../api/habits';
import { getApiErrorCode } from '../../api/client';

interface HabitsState {
  items: Habit[];
  status: 'idle' | 'loading' | 'error';
  error: string | null;
}

const initialState: HabitsState = {
  items: [],
  status: 'idle',
  error: null,
};

export const fetchHabits = createAsyncThunk('habits/fetch', async (_: void, { rejectWithValue }) => {
  try {
    return await habitsApi.listHabits();
  } catch (error) {
    return rejectWithValue(getApiErrorCode(error) ?? 'FETCH_HABITS_FAILED');
  }
});

export const addHabit = createAsyncThunk(
  'habits/create',
  async (input: habitsApi.CreateHabitInput, { rejectWithValue }) => {
    try {
      return await habitsApi.createHabit(input);
    } catch (error) {
      return rejectWithValue(getApiErrorCode(error) ?? 'CREATE_HABIT_FAILED');
    }
  }
);

export const editHabit = createAsyncThunk(
  'habits/edit',
  async (params: { habitId: string; input: habitsApi.UpdateHabitInput }, { rejectWithValue }) => {
    try {
      return await habitsApi.updateHabit(params.habitId, params.input);
    } catch (error) {
      return rejectWithValue(getApiErrorCode(error) ?? 'EDIT_HABIT_FAILED');
    }
  }
);

export const logHabit = createAsyncThunk('habits/log', async (habitId: string, { rejectWithValue }) => {
  try {
    return await habitsApi.logHabitCompletion(habitId);
  } catch (error) {
    return rejectWithValue(getApiErrorCode(error) ?? 'LOG_HABIT_FAILED');
  }
});

export const removeHabit = createAsyncThunk('habits/archive', async (habitId: string, { rejectWithValue }) => {
  try {
    await habitsApi.archiveHabit(habitId);
    return habitId;
  } catch (error) {
    return rejectWithValue(getApiErrorCode(error) ?? 'ARCHIVE_HABIT_FAILED');
  }
});

const habitsSlice = createSlice({
  name: 'habits',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHabits.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchHabits.fulfilled, (state, action) => {
        state.status = 'idle';
        state.items = action.payload;
      })
      .addCase(fetchHabits.rejected, (state, action) => {
        state.status = 'error';
        state.error = (action.payload as string) ?? 'FETCH_HABITS_FAILED';
      })
      .addCase(addHabit.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(editHabit.fulfilled, (state, action) => {
        const index = state.items.findIndex((habit) => habit._id === action.payload._id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(logHabit.fulfilled, (state, action) => {
        const index = state.items.findIndex((habit) => habit._id === action.payload.habit._id);
        if (index !== -1) state.items[index] = action.payload.habit;
      })
      .addCase(removeHabit.fulfilled, (state, action) => {
        state.items = state.items.filter((habit) => habit._id !== action.payload);
      });
  },
});

export default habitsSlice.reducer;
