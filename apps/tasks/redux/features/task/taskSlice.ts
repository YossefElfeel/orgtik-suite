import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface TaskState {
  activeTaskId: number | null;
}

const initialState: TaskState = {
  activeTaskId: null,
};

const taskSlice = createSlice({
  name: "task",
  initialState,
  reducers: {
    setActiveTaskId: (state, action: PayloadAction<number | null>) => {
      state.activeTaskId = action.payload;
    },
  },
});

export const { setActiveTaskId } = taskSlice.actions;
export default taskSlice;
