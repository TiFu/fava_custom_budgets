import {PayloadAction, createSlice } from '@reduxjs/toolkit'
import { MonthType } from '../util'

export type TabKey = "spending" | "overview-spending-budget" | "asset-budget" | "asset-account"
interface UIState {
    selectedTab: TabKey,
    showYtD: boolean,
    ytdMonth: MonthType
}

const initialState: UIState = {
    selectedTab: "spending",
    showYtD: false,
    ytdMonth: 12
}

//export const fetchBudget = createAsyncThunk('budget/fetchBudget', async () => {
//    console.log("Fetching budgets in thunk")
//    return budgetApiService.getBudgets()
//})


const uiSlice = createSlice({
  name: 'uistate',
  initialState,
  reducers: {
        selectTab(state, action: PayloadAction<TabKey>) {
            console.log("Setting active tab to " + action.payload)
            state.selectedTab = action.payload
        },
        toggleYtD(state, action: PayloadAction<any>) {
            state.showYtD = !state.showYtD
            if (state.showYtD) {
                let currentMonth = new Date().getMonth() + 1 as MonthType // Month in 1..12
                state.ytdMonth = Math.max(currentMonth-1, 1) as MonthType
            } else {
                state.ytdMonth = 12
            }
        }
  }
})


export const { selectTab, toggleYtD } = uiSlice.actions
export default uiSlice.reducer