export enum LoadStatus {
    Loading,
    Loaded,
    Failed
}

export type Month = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12"
export type MonthMap = { [key in Month]: number }
export type AnnualMap = { [key: string]: MonthMap }
export type AccountMap = { [key: string]: AnnualMap }

export type ExpenseIncomeMap = {
    Expenses: AccountMap
    Income: AccountMap
}

export interface BudgetSummaryData {
    budgets: ExpenseIncomeMap
    actuals: ExpenseIncomeMap
}
