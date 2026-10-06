import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState = {
  isSidebarOpen: false,
};

export const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    setIsSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.isSidebarOpen = action.payload;
    },
  },
});

export const { setIsSidebarOpen } = dashboardSlice.actions;
