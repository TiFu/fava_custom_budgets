import { AccountMap } from "./common"

export interface ExpenseIncomeMap {
    Expenses: AccountMap<number>
    Income: AccountMap<number>
}

export interface BudgetActualsSummary {
    budgets: ExpenseIncomeMap
    actuals: ExpenseIncomeMap
}