import {PayloadAction, createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {Budget} from '../api/model'
import { budgetApiService } from '../api/service'
import {BudgetSummary, LoadStatus} from '../model/index'

declare var budgets: BudgetSummary;

interface BudgetState {
    budgets: BudgetSummary
    status: LoadStatus   
}

const initialState: BudgetState = {
    budgets: budgets,
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