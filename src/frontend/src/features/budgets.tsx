import {PayloadAction, createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { BudgetSummaryData } from '../data_model/IncomeExpenseBudget';
import { AssetBudgetService } from '../services/AssetBudgetService';
import { BudgetActualSummary } from '../services/IncomeExpenseBudgetService';

declare var budgets: BudgetSummaryData;
declare var assetBudget: any

console.log("Budgets is ", budgets)
console.log("Asset budget is ", assetBudget)
const budgetSummary = new BudgetActualSummary(budgets)
const assetBudgetService = new AssetBudgetService(assetBudget)

interface BudgetState {
    budgets: BudgetActualSummary
    assetBudgets: AssetBudgetService
}

const initialState: BudgetState = {
    budgets: budgetSummary,
    assetBudgets: assetBudgetService,
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