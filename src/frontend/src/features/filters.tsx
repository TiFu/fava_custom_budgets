import {PayloadAction, createSlice } from '@reduxjs/toolkit'
import {BudgetSummary, LoadStatus} from '../model/index'

interface FilterState {
    selectedYear: string
}

const initialState: FilterState = {
    selectedYear: "" + new Date().getFullYear()
}

//export const fetchBudget = createAsyncThunk('budget/fetchBudget', async () => {
//    console.log("Fetching budgets in thunk")
//    return budgetApiService.getBudgets()
//})


const filterSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
        selectYear(state, action: PayloadAction<string>) {
            console.log("Setting year to " + action.payload)
            state.selectedYear = action.payload
        }
  }
})


export const { selectYear } = filterSlice.actions
export default filterSlice.reducer