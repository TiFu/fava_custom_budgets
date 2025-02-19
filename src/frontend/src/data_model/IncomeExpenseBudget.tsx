import { AccountMap } from "./common"

export interface ExpenseIncomeMap {
    Expenses: AccountMap<number>
    Income: AccountMap<number>
}

export interface BudgetSummaryData {
    budgets: ExpenseIncomeMap
    actuals: ExpenseIncomeMap
}