import { AccountMap, AnnualMap, Month } from "../data_model/common"
import { AssetBalance, AssetBudget, AssetBudgetSummary, AssetSummary } from "../data_model/AssetBudget"
import { MonthType, monthMapToArray } from "../util"
import { AccountBreakdown, BreakdownTableData } from "../view_model/BreakdownTableData"
import { BudgetActualComparisonData, BudgetActualComparisonSummary } from '../view_model/BudgetActualComparisonData'
import { MonthMap } from "../data_model/common"
import { BudgetChartData } from "../view_model/BudgetChartData"

export class AssetBudgetService {

    public constructor(private budget: AssetBudget) {
        this.budget.accountBalance
    }

    getChart(budget: string, year: string, ytd: MonthType): BudgetChartData {
        let [budgetValues, actualValues] = this.getMonthlyBudgetValues(budget, year, ytd)
        let breakdown = this._getAccountBreakdown(budget, year, ytd)
        let actualBreakdown: Array<{name: string, data: Array<number> }> = []
        for (let acc in breakdown) {
            actualBreakdown.push({
                name: acc,
                data: breakdown[acc]
            })
        }

        let max = Math.max(...budgetValues, ...actualValues)
        return {
            chartName: budget,
            actuals: actualValues,
            actualBreakdown: actualBreakdown,
            budget: budgetValues,

            maxYAxis: max + Math.max(0.1*max, 100),
            minYAxis: 0
        }
    }

    getBudgetActualComparisonSummary(year: string, ytd:MonthType): BudgetActualComparisonSummary {
        let budgetNames = this.getBudgetNames()
        let data: {[key: string]: BudgetActualComparisonData} = {}
        
        budgetNames.forEach((budgetName) => {
            data[budgetName] = this.getBudgetActualComparison(budgetName, year, ytd)
        })

        return {
            lineItems: budgetNames.map(x => { return { name: x, hierarchyLevel: 0}}),
            comparison: data
        }
    }

    getBudgetActualComparison(budgetName: string, year: string, ytd: MonthType): BudgetActualComparisonData {
        let [budgetValues, actualValues] = this.getMonthlyBudgetValues(budgetName, year, ytd)

        let budget = budgetValues[ytd-1]
        let actuals = actualValues[ytd-1]
        let absoluteDiff = actuals - budget
        let relativeDiff = absoluteDiff / Math.max(1, budget)
        let breakdownTotal = this._getAccountBreakdown(budgetName, year, ytd)
        let actualBreakdown: { [key:string]: number } = {}

        for (let arr in breakdownTotal) {
            actualBreakdown[arr] = breakdownTotal[arr][ytd-1]
        }
        
        let output = {
            budget: budget,
            actuals: actuals,
            warn: absoluteDiff < 0,
            absoluteDiff: absoluteDiff,
            relativeDiff: relativeDiff,
            actualBreakdown: actualBreakdown
        }
        console.log("Values: ", output)
        return output
    }

    getBreakdownTableByBudget(account: string, year: string, ytd: MonthType): BreakdownTableData {
        let [actualValues, budgetBreakdown] = this._getBudgetBreakdown(account, year, ytd)
        
        let output = {
            budget: undefined,
            actual: actualValues,
            actualBreakdown: budgetBreakdown,
            budgetName: account
        }
        return output
    }

    getBreakdownTableByAccount(budget: string, year: string, ytd: MonthType): BreakdownTableData {
        let [budgetValues, actualValues] = this.getMonthlyBudgetValues(budget, year, ytd)

        let accountBreakdown = this._getAccountBreakdown(budget, year, ytd)

        let output = {
            budget: budgetValues,
            actual: actualValues,
            actualBreakdown: accountBreakdown,
            budgetName: budget
        }
        console.log("BREAKDOWN TABLE", output)
        return output
    }

    getBudgetNames(): Array<string> {
        return Object.keys(this.budget.budgets)
    }
    
    private _getBudgetBreakdown(account: string, year: string, ytd: MonthType): [Array<number>, AccountBreakdown] {

        let output: AccountBreakdown = {}
        
        let accountBalance = this.budget.accountBalance[account]
        if (!(year in accountBalance))
            return [[], output]

        let yearMap = accountBalance[year]
        let actuals: Array<number> = []

        for (let i = 1; i <= ytd; i++) {
            let balance = (yearMap as any)["" + i] as AssetBalance
            actuals.push(balance["actual"])
            for (let budget in balance) {
                if (budget == "actual")
                    continue
                    
                if (!(budget in output)) {
                    output[budget] = []
                }

                output[budget].push(balance[budget])

            }
        }
        return [actuals, output]
    }


    private _getAccountBreakdown(budget: string, year: string, ytd: MonthType): AccountBreakdown {

        let output: AccountBreakdown = {}

        for (let account of Object.keys(this.budget.accountBalance)) {
            let yearMap = this.budget.accountBalance[account]
            if (!(year in yearMap))
                continue
            
            let budgetMap = yearMap[year]

            let mm = this.convertMonthMapToNumber(budgetMap, budget)
            let arr = monthMapToArray(mm, ytd)
            if (arr.reduce((p, c) => p+c, 0) == 0)
                continue
            output[account] = arr
        }

        return output
    }

    private convertMonthMapToNumber(map: MonthMap<AssetBalance>, key: string): MonthMap<number> {
        let output: any = {}
        console.log("Map: ", map)
        for (let i = 1; i<= 12; i++) {
            let bal: AssetBalance = (map as any)[""+i] as AssetBalance
            if (!bal)
                continue
            console.log("Bal", bal)
            if (key in bal)
                output[""+i] = bal[key]
        }
        return output as MonthMap<number>
    }
    // Returns budget, actuals
    private getMonthlyBudgetValues(budget: string, year: string, ytd: MonthType): [Array<number>, Array<number>] {
        return [
            this._extractMonthlyValues(this.budget.budgets, budget, year, ytd), 
            this._extractMonthlyValues(this.budget.budgetBalance, budget, year, ytd)
        ]
    }

    private _getBudgetByAccount(year: string, ytd: MonthType): {[key: string]: {[key: string]: number}} {
        let result: {[key: string]: {[key: string]: number}} = {}
        
        for (let account of this.budget.account) {
            const accountSummary = this.budget.accountBalance[account][year][ytd]
            for (let budget in Object.keys(accountSummary)) {
                if (budget == "actual")
                    continue

                if (!(budget in result)) {
                    result[budget] = {}
                }
                result[budget][account] = accountSummary[budget]
            }
            // ToDo: how to summarize
        }
        return result
    }

    getAccounts(): Array<string> {
        return Object.keys(this.budget.accountBalance)
    }

    getAccountSummary(year: string, ytd: MonthType): AccountMap<AssetBalance> {
        return this.budget.accountBalance
    }

    getBudgetSummary(year: string, ytd: MonthType): AssetBudgetSummary {
        let result: { [key:string]: AssetSummary } = {}
        for (let budget in Object.keys(this.budget.budgets)) {
            let budgeted = this.budget.budgets[budget]
            let budgetedSum = budgeted[year][ytd]
            let actualSum = this.budget.budgetBalance[budget][year][ytd]            

            result[budget] = {
                "budgeted": budgetedSum,
                "actual": actualSum,
                "diff": actualSum - budgetedSum,
            }
        }

        return { "budget": result, "byAccount": this._getBudgetByAccount(year, ytd) }

    }

    private _extractMonthlyValues(map: AccountMap<number>, budget: string, year: string, ytd: MonthType) {
        if (!(budget in map)) {
            return monthMapToArray(null, ytd)
        }

        if (!(year in map[budget])) {
            return monthMapToArray(null, ytd)
        }

        return monthMapToArray(map[budget][year], ytd)
    }

}