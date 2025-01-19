import {PayloadAction, createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {Budget} from '../api/model'
import { budgetApiService } from '../api/service'
import {LoadStatus} from '../model/index'

interface BudgetState {
    budgets: Budget | null
    status: LoadStatus   
    
}

const initialState: BudgetState = {
    budgets: null,
    status: LoadStatus.Loading 
}

export const fetchBudget = createAsyncThunk('budget/fetchBudget', async () => {
    return budgetApiService.getBudgets()
})


const budgetSlice = createSlice({
  name: 'budgets',
  initialState,
  reducers: {
  },
  extraReducers: builder => {
    builder.addCase(fetchBudget.pending, (state, action) => {
        state.status = LoadStatus.Loading
    }).addCase(fetchBudget.fulfilled, (state, action) => {
        state.budgets = action.payload
    }).addCase(fetchBudget.rejected, (state, action) => {
        state.status = LoadStatus.Failed
    })
  }
})

//export const {  } = budgetSlice.actions

export default budgetSlice.reducer