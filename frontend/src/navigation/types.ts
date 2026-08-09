export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type HabitsStackParamList = {
  HabitsList: undefined;
  CreateHabit: undefined;
  EditHabit: { habitId: string };
};

export type SupplementsStackParamList = {
  SupplementsList: undefined;
  CreateSupplement: undefined;
  EditSupplement: { supplementId: string };
};

export type SkincareStackParamList = {
  SkincareList: undefined;
  CreateSkincareRoutine: undefined;
  EditSkincareRoutine: { routineId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Habits: undefined;
  Supplements: undefined;
  Skincare: undefined;
  Water: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  Profile: undefined;
  Weight: undefined;
  LogWeight: undefined;
  NotificationSettings: undefined;
};
