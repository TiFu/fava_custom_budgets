import { configureStore } from '@reduxjs/toolkit'

import budgetSlice from '../features/budgets'
import filterSlice from '../features/filters'
import uiSlice from '../features/uistate'
import { BudgetSummaryData } from '../data_model/IncomeExpenseBudget'

declare var budgets: BudgetSummaryData

const store = configureStore({
    reducer: {
        budget: budgetSlice,
        filters: filterSlice,
        uislice: uiSlice
    }
})


export default store
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch