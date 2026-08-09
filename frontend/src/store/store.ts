import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import habitsReducer from '../features/habits/habitsSlice';
import supplementsReducer from '../features/supplements/supplementsSlice';
import skincareReducer from '../features/skincare/skincareSlice';
import waterReducer from '../features/water/waterSlice';
import weightReducer from '../features/weight/weightSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    habits: habitsReducer,
    supplements: supplementsReducer,
    skincare: skincareReducer,
    water: waterReducer,
    weight: weightReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
