import { Budget} from './model'

class BudgetAPIService {

    // TODO - fetch APIs & other data

    getBudgets(): Promise<Budget | null> {
        console.log("Loading budgets...")
        return Promise.resolve(null)
    }
}

export const budgetApiService = new BudgetAPIService()