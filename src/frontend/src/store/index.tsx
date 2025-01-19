import { configureStore } from '@reduxjs/toolkit'

import budgetSlice from '../features/budgets'

const store = configureStore({
    reducer: {
        budget: budgetSlice
    }
})


export default store
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch