
export interface BudgetActualComparisonData {
    budget: number
    actuals: number
    absoluteDiff: number
    relativeDiff: number
    warn: boolean
    actualBreakdown: { [key:string]: number }
}

export interface BudgetSummaryData {
    values: number
    valueBreakdown: { [key:string]: number }
}

export interface LineItem {
    name: string
    hierarchyLevel: number
}

export interface BudgetActualComparisonSummary {
    lineItems: Array<LineItem>
    comparison: {[key: string]: BudgetActualComparisonData}
} 

export interface BudgetSummary {
    lineItems: Array<LineItem>
    comparison: {[key: string]: BudgetSummaryData}
} 
