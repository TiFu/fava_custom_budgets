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

    // Argument is a budget, not an account
    getChart(budget: string, year: string, ytd: MonthType): BudgetChartData {
        return this._getChart(this.budget.budgets, this.budget.budgetBalance, this.budget.accountBalance, budget, year, ytd, true)
    }

    // Per-account breakdown is omitted here: within a single year, an account's contribution
    // to a goal can legitimately swing negative (e.g. a withdrawal) and positive in other
    // periods. Highcharts' normal stacking renders negative and positive series in separate
    // stacks above/below the zero line instead of netting them, which looks like conflicting
    // signals rather than a single running total. The lifetime view doesn't have this problem
    // since balances there only accumulate, so it keeps the account breakdown.
    getAnnualChart(budget: string, year: string, ytd: MonthType): BudgetChartData {
        return this._getChart(this.budget.annualBudgets, this.budget.annualBudgetBalance, this.budget.annualAccountBalance, budget, year, ytd, false)
    }

    private _getChart(budgets: AccountMap<number>, budgetBalance: AccountMap<number>, accountBalance: AccountMap<AssetBalance>, budget: string, year: string, ytd: MonthType, includeBreakdown: boolean): BudgetChartData {
        let [budgetValues, actualValues] = this.getMonthlyBudgetValues(budgets, budgetBalance, budget, year, ytd)
        let actualBreakdown: Array<{name: string, data: Array<number> }> = []
        if (includeBreakdown) {
            let breakdown = this._getAccountBreakdown(accountBalance, budget, year, ytd)
            for (let acc in breakdown) {
                actualBreakdown.push({
                    name: acc,
                    data: breakdown[acc]
                })
            }
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
        return this._getBudgetActualComparisonSummary(this.budget.budgets, this.budget.budgetBalance, this.budget.accountBalance, year, ytd)
    }

    getAnnualBudgetActualComparisonSummary(year: string, ytd:MonthType): BudgetActualComparisonSummary {
        return this._getBudgetActualComparisonSummary(this.budget.annualBudgets, this.budget.annualBudgetBalance, this.budget.annualAccountBalance, year, ytd)
    }

    private _getBudgetActualComparisonSummary(budgets: AccountMap<number>, budgetBalance: AccountMap<number>, accountBalance: AccountMap<AssetBalance>, year: string, ytd:MonthType): BudgetActualComparisonSummary {
        let budgetNames = this.getBudgetNames()
        let data: {[key: string]: BudgetActualComparisonData} = {}

        budgetNames.forEach((budgetName) => {
            data[budgetName] = this._getBudgetActualComparison(budgets, budgetBalance, accountBalance, budgetName, year, ytd)
        })

        return {
            lineItems: budgetNames.map(x => { return { name: x, shortName: x, hierarchyLevel: 0}}),
            comparison: data
        }
    }

    getBudgetActualComparison(budgetName: string, year: string, ytd: MonthType): BudgetActualComparisonData {
        return this._getBudgetActualComparison(this.budget.budgets, this.budget.budgetBalance, this.budget.accountBalance, budgetName, year, ytd)
    }

    getAnnualBudgetActualComparison(budgetName: string, year: string, ytd: MonthType): BudgetActualComparisonData {
        return this._getBudgetActualComparison(this.budget.annualBudgets, this.budget.annualBudgetBalance, this.budget.annualAccountBalance, budgetName, year, ytd)
    }

    private _getBudgetActualComparison(budgets: AccountMap<number>, budgetBalance: AccountMap<number>, accountBalance: AccountMap<AssetBalance>, budgetName: string, year: string, ytd: MonthType): BudgetActualComparisonData {
        let [budgetValues, actualValues] = this.getMonthlyBudgetValues(budgets, budgetBalance, budgetName, year, ytd)

        let budget = budgetValues[ytd-1]
        let actuals = actualValues[ytd-1]
        let absoluteDiff = actuals - budget
        let relativeDiff = absoluteDiff / Math.max(1, budget)
        let warn = relativeDiff > 0.05 && absoluteDiff < 100
        console.log("Warn: ", warn, " budget: ", budget, " actuals: ", actuals, " absDiff: ", absoluteDiff, " relDiff: ", relativeDiff)
        let breakdownTotal = this._getAccountBreakdown(accountBalance, budgetName, year, ytd)
        let actualBreakdown: { [key:string]: number } = {}

        for (let arr in breakdownTotal) {
            actualBreakdown[arr] = breakdownTotal[arr][ytd-1]
        }

        let output = {
            budget: budget,
            actuals: actuals,
            warn: warn,
            absoluteDiff: absoluteDiff,
            relativeDiff: relativeDiff,
            actualBreakdown: actualBreakdown
        }
        console.log("Values: ", output)
        return output
    }

    getBreakdownTableByBudget(account: string, year: string, ytd: MonthType): BreakdownTableData {
        return this._getBreakdownTableByBudget(this.budget.accountBalance, account, year, ytd)
    }

    getAnnualBreakdownTableByBudget(account: string, year: string, ytd: MonthType): BreakdownTableData {
        return this._getBreakdownTableByBudget(this.budget.annualAccountBalance, account, year, ytd)
    }

    private _getBreakdownTableByBudget(accountBalance: AccountMap<AssetBalance>, account: string, year: string, ytd: MonthType): BreakdownTableData {
        let [actualValues, budgetBreakdown] = this._getBudgetBreakdown(accountBalance, account, year, ytd)

        let output = {
            budget: undefined,
            actual: actualValues,
            actualBreakdown: budgetBreakdown,
            budgetName: account
        }
        return output
    }

    getBreakdownTableByAccount(budget: string, year: string, ytd: MonthType): BreakdownTableData {
        return this._getBreakdownTableByAccount(this.budget.budgets, this.budget.budgetBalance, this.budget.accountBalance, budget, year, ytd)
    }

    getAnnualBreakdownTableByAccount(budget: string, year: string, ytd: MonthType): BreakdownTableData {
        return this._getBreakdownTableByAccount(this.budget.annualBudgets, this.budget.annualBudgetBalance, this.budget.annualAccountBalance, budget, year, ytd)
    }

    private _getBreakdownTableByAccount(budgets: AccountMap<number>, budgetBalance: AccountMap<number>, accountBalance: AccountMap<AssetBalance>, budget: string, year: string, ytd: MonthType): BreakdownTableData {
        let [budgetValues, actualValues] = this.getMonthlyBudgetValues(budgets, budgetBalance, budget, year, ytd)

        let accountBreakdown = this._getAccountBreakdown(accountBalance, budget, year, ytd)

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

    private _getBudgetBreakdown(accountBalance: AccountMap<AssetBalance>, account: string, year: string, ytd: MonthType): [Array<number>, AccountBreakdown] {

        let output: AccountBreakdown = {}

        let balanceForAccount = accountBalance[account]
        if (!(year in balanceForAccount))
            return [[], output]

        let yearMap = balanceForAccount[year]
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


    private _getAccountBreakdown(accountBalance: AccountMap<AssetBalance>, budget: string, year: string, ytd: MonthType): AccountBreakdown {

        let output: AccountBreakdown = {}

        for (let account of Object.keys(accountBalance)) {
            let yearMap = accountBalance[account]
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
    private getMonthlyBudgetValues(budgets: AccountMap<number>, budgetBalance: AccountMap<number>, budget: string, year: string, ytd: MonthType): [Array<number>, Array<number>] {
        return [
            this._extractMonthlyValues(budgets, budget, year, ytd),
            this._extractMonthlyValues(budgetBalance, budget, year, ytd)
        ]
    }

    private _getBudgetByAccount(year: string, ytd: MonthType): {[key: string]: {[key: string]: number}} {
        let result: {[key: string]: {[key: string]: number}} = {}
        
        for (let account of this.budget.accounts) {
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