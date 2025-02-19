
export interface BudgetChartData {
    chartName: string
    actuals: Array<number>
    actualBreakdown: Array<{name: string, data: Array<number>}>
    budget: Array<number>

    maxYAxis: number
    minYAxis: number  
}