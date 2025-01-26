import {PayloadAction, createSlice } from '@reduxjs/toolkit'

interface UIState {
    selectedTab: string
}

const initialState: UIState = {
    selectedTab: "ytd"
}

//export const fetchBudget = createAsyncThunk('budget/fetchBudget', async () => {
//    console.log("Fetching budgets in thunk")
//    return budgetApiService.getBudgets()
//})


const uiSlice = createSlice({
  name: 'uistate',
  initialState,
  reducers: {
        selectTab(state, action: PayloadAction<string>) {
            console.log("Setting active tab to " + action.payload)
            state.selectedTab = action.payload
        }
  }
})


export const { selectTab } = uiSlice.actions
export default uiSlice.reducer