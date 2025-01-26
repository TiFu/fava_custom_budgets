import {PayloadAction, createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {BudgetSummaryData, LoadStatus} from '../model/index'
import { BudgetActualSummary } from '../model/model_classes';

declare var budgets: BudgetSummaryData;

console.log("Budgets is ", budgets)
const budgetSummary = new BudgetActualSummary(budgets)

interface BudgetState {
    budgets: BudgetActualSummary
    status: LoadStatus   
}

const initialState: BudgetState = {
    budgets: budgetSummary,
    status: LoadStatus.Loading 
}
const budgetSlice = createSlice({
  name: 'budgets',
  initialState,
  reducers: {
  },
  extraReducers: builder => {
  }
})

//export const {  } = budgetSlice.actions

export default budgetSlice.reducer