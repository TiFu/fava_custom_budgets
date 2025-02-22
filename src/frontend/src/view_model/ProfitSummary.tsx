
export interface BudgetActualProfitSummaryData {
    budget: ProfitSummaryData
    actuals?: ProfitSummaryData
}

export interface ProfitSummaryData {
    income: number
    expenses: number
    profit: number
}