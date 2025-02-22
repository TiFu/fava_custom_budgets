
import { act } from "react"
import { BudgetActualsSummary, ExpenseIncomeMap } from "../data_model/IncomeExpenseBudget"
import { AccountMap, MonthMap } from "../data_model/common"
import { MonthType, calculateAnnualSum, getMonthOrZero, getValueOrZero, monthMapToArray } from "../util"
import { BudgetSummary, LineItem, BudgetSummaryData, BudgetActualComparisonSummary, BudgetActualComparisonData } from "../view_model/BudgetActualComparisonData"
import { BudgetChartData } from "../view_model/BudgetChartData"
import {BudgetActualProfitSummaryData} from '../view_model/ProfitSummary'

class AccountWrapper {
    private accounts: Array<string>
    private accountHierarchy: Account
    private income: Array<LineItem> | null
    private expenses: Array<LineItem> | null

    constructor(overall: BudgetActualsSummary) {
        this._extractAccounts(overall)
        this._extractAccountHierarchy()
    }

    public getIncomeAccounts(): Array<LineItem> {
        if (!this.income)
            this.income = this._getAccountsByType("Income")
        return this.income        
    }

    public getExpenseAccounts(): Array<LineItem> {
        if (!this.expenses)
            this.expenses = this._getAccountsByType("Expenses")
        return this.expenses        
    }

    private _getAccountsByType(type: "Income" | "Expenses"): Array<LineItem> {
        return this.accounts.filter(a => a.startsWith(type)).map(a => {
            let arr = a.split(":")
            return {
                name: a,
                shortName: arr[arr.length - 1],
                hierarchyLevel: arr.length - 1
            }
        }).sort()
    }

    public getChildren(account: string): Array<string> {
        return this.accountHierarchy.getChildrenRecursive(account).map(a => a.getFullName())
    }

    private _extractAccounts(overall: BudgetActualsSummary) {
        let accountSet = new Set<string>
        Object.keys(overall.actuals.Expenses).forEach(a => accountSet.add(a))
        Object.keys(overall.budgets.Expenses).forEach(a => accountSet.add(a))
        Object.keys(overall.actuals.Income).forEach(a => accountSet.add(a))
        Object.keys(overall.budgets.Income).forEach(a => accountSet.add(a))

        this.accounts = Array.from(accountSet)
        this.accounts.sort()

    }

    private _extractAccountHierarchy() {
        let factory = new AccountFactory()

        let rootAccount = factory.constructHierarchy(this.accounts)
        this.accountHierarchy = rootAccount
    }
}

class BudgetActualsSummaryWrapper {
    private summary: ExpenseIncomeMap

    constructor(overall: BudgetActualsSummary, summary: ExpenseIncomeMap) {
        this.summary = summary
    }

    public getValue(account: string, year: string, ytd: MonthType): number {
        let map = this._getMap(account)
        if (account in map && year in map[account] && ytd in map[account][year]) {
            return map[account][year][ytd]
        } else {
            return 0
        }    
    }

    public getMonthlyValues(account: string, year: string, ytd: MonthType): Array<number> {
        let result = []
        for (let i = 1; i <= ytd; i++) {
            result.push(this.getValue(account, year, i as MonthType))
        }
        return result
    }

    public getAnnualSum(account: string, year: string, ytd: MonthType): number {
        let result = 0
        for (let i = 1; i <= ytd; i++) {
            result += this.getValue(account, year, i as MonthType)
        }
        return result
    }



    private _getMap(account: string): AccountMap<number> {
        if (account.startsWith("Income")) {
            return this.summary.Income
        } else if (account.startsWith("Expenses")) {
            return this.summary.Expenses
        } else {
            throw new Error("Unknown account type " + account)
        }
    }
}

export class IncomeExpenseBudgetService {
    private actuals: BudgetActualsSummaryWrapper
    private budget: BudgetActualsSummaryWrapper
    private accounts: AccountWrapper
    private minYear: number
    private maxYear: number

    constructor(summary: BudgetActualsSummary) {
        this.actuals = new BudgetActualsSummaryWrapper(summary, summary.actuals)
        this.budget = new BudgetActualsSummaryWrapper(summary, summary.budgets)
        this.accounts = new AccountWrapper(summary)
        this._extractYears(summary)
    }

    public getChart(account: string, year: string, ytd: MonthType): BudgetChartData {

        let actuals = this.actuals.getMonthlyValues(account, year, ytd)
        let budget = this.budget.getMonthlyValues(account, year, ytd)
        let children = this.accounts.getChildren(account)
                        .map((c) => {
                            return {
                                name: c,
                                data: this.actuals.getMonthlyValues(c, year, ytd)
                            }
                        })

        return {
            chartName: account,
            actuals: actuals,
            actualBreakdown: children,
            budget: budget,
            maxYAxis: Math.max(...actuals, ...budget),
            minYAxis: Math.min(0, ...actuals, ...budget)
        }
    }

    public getBudgetExpenseSummary(year: string, ytd: MonthType): BudgetSummary {
        let accs = this.accounts.getExpenseAccounts()
        return this._getSummary(accs, this.budget, year, ytd)
    }

    public getIncomeComparison(year: string, ytd: MonthType): BudgetActualComparisonSummary {
        return this._getComparison(this.accounts.getIncomeAccounts(), year, ytd, true)
    }

    public getExpenseComparison(year: string, ytd: MonthType): BudgetActualComparisonSummary {
        return this._getComparison(this.accounts.getExpenseAccounts(), year, ytd, false)
    }
    
    public getBudgetIncomeSummary(year: string, ytd: MonthType): BudgetSummary {
        let accs = this.accounts.getIncomeAccounts()
        return this._getSummary(accs, this.budget, year, ytd)
    }

    private _getSummary(accounts: Array<LineItem>, wrapper: BudgetActualsSummaryWrapper, year: string, ytd: MonthType): BudgetSummary {
        let items = accounts
        let summary:  {[key: string]: BudgetSummaryData} = {}
        items.forEach(item => {
            let a = item.name
            let actuals = wrapper.getAnnualSum(a, year, ytd)
            
            let children = this.accounts.getChildren(a)
            let breakdown: {[key: string]: number} = {}
            children.forEach(c => {
                let n = c
                breakdown[n] = wrapper.getAnnualSum(c, year, ytd)
            })

            summary[a] = {
                values: actuals,
                valueBreakdown: breakdown
            }
        })
        
        /*items = items.filter(a => {
            return Math.abs(summary[a.name].values) > 10e-9
        })*/

        return {
            lineItems: items,
            summary: summary
        }
    }

    private _getComparison(accounts: Array<LineItem>, year: string, ytd: MonthType, invertForIncome: boolean): BudgetActualComparisonSummary {
        let items = accounts

        let values: { [key: string]: BudgetActualComparisonData} = {}

        items.forEach(item => {
            let a = item.name
            let budget = this.budget.getAnnualSum(a, year, ytd)
            let actuals = this.actuals.getAnnualSum(a, year, ytd)
            let diff = actuals - budget
            let divisor = budget
            if (Math.abs(divisor) < 10e-9) {
                divisor = 1
            }
            let diffRel = diff / divisor
            
            let children = this.accounts.getChildren(a)
            let breakdown: {[key: string]: number} = {}
            children.forEach(c => {
                let n = c
                breakdown[n] = this.actuals.getAnnualSum(n, year, ytd)
            })
            let warn = diffRel > 0.05 || diff > 250
            if (invertForIncome)
                warn = diffRel < -0.05 || diff < -250
            

            values[a] = {
                budget: budget,
                actuals: actuals,
                absoluteDiff: diff,
                relativeDiff: diffRel,
                warn: warn,
                actualBreakdown: { "cat": 0 }                
            }
        })

        // Filter out any items that have 0 budget/actuals (i.e., no change in year/ytd)
        items = items.filter(a => {
            return Math.abs(values[a.name].budget) > 10e-9 || Math.abs(values[a.name].actuals) > 10e-9
        })

        return {
            lineItems: items,
            comparison: values
        }
    }

    
    public getIncExpProfitBudget(year: string, ytd: MonthType): BudgetActualProfitSummaryData {
        let output = this.getIncExpProfitSummary(year, ytd)
        output.actuals = undefined
        return output
    }
    public getIncExpProfitSummary(year: string, ytd: MonthType): BudgetActualProfitSummaryData {

        let actIncome = this.actuals.getAnnualSum("Income", year, ytd) 
        let actExpenses = this.actuals.getAnnualSum("Expenses", year, ytd)

        let budIncome = this.budget.getAnnualSum("Income", year, ytd) 
        let budExpenses = this.budget.getAnnualSum("Expenses", year, ytd)
        return {
            budget: {
                income: budIncome,
                expenses: budExpenses,
                profit: budIncome - budExpenses
            },
            actuals: {
                income: actIncome,
                expenses: actExpenses,
                profit: actIncome - actExpenses
            }
        }
    }


    public getYears(): Array<number> {
        let output: Array<number> = []
        for (let i = this.maxYear; i >= this.minYear; i--) {
            output.push(i)
        }
        return output
    }

    private _extractYears(overall: BudgetActualsSummary) {
        let [actualIncomeMin, actualIncomeMax] = this._extractYearsFromMap(overall.actuals.Income)
        let [actualExpensesMin, actualExpensesMax] = this._extractYearsFromMap(overall.actuals.Expenses)
        let [budgetsIncomeMin, budgetsIncomeMax] = this._extractYearsFromMap(overall.budgets.Income)
        let [budgetsExpensesMin, budgetsExpensesMax] = this._extractYearsFromMap(overall.budgets.Expenses)

        this.minYear = Math.min(actualIncomeMin, actualExpensesMin, budgetsIncomeMin, budgetsExpensesMin)
        this.maxYear = Math.max(actualIncomeMax, actualExpensesMax, budgetsIncomeMax, budgetsExpensesMax)
    }

    private _extractYearsFromMap(map: AccountMap<number>): Array<number> {
        let max = -10000
        let min = 10000
        for (let account in map) {
            let years = Object.keys(map[account])
            let intYears = years.map(a => parseInt(a))

            max = Math.max(max, ...intYears)
            min = Math.min(min, ...intYears)
        }
        return [min, max]
    }
}

export class AccountFactory {

    constructHierarchy(accountNames: Array<string>) {
        const rootAccount = new Account("Root")
        for (let fullName of accountNames) {
            this.addChildRecursively(fullName, rootAccount)
        }
        return rootAccount
    }

    private addChildRecursively(fullName: string, rootAccount: Account): Account {
        let arr = fullName.split(":")
        return this.addChildRecursivelyInternal(arr[0], arr, 0, rootAccount)
    }

    private addChildRecursivelyInternal(fullAccountName: string, fullNameArr: Array<string>, index: number, rootAccount: Account): Account {
        if (index == fullNameArr.length - 1) {
            let account = new Account(fullAccountName)
            rootAccount.addChild(account)
            return account
        } else {
            let childAccount = rootAccount.getChildAccount(fullNameArr[index])
            if (!childAccount) {
                childAccount = new Account(fullAccountName)
                rootAccount.addChild(childAccount)
            }
            return this.addChildRecursivelyInternal(fullAccountName + ":" + fullNameArr[index+1], fullNameArr, index + 1, childAccount)
        }
    }
}

export class Account {
    private name: string
    private accountMap: {[key: string]: Account}
    constructor(private fullName: string) {
        let arr = fullName.split(":")
        this.name = arr[arr.length - 1]
        this.accountMap = {}
    }

    getChildrenRecursive(account: string): Array<Account> {
        let split = account.split(":")
        return this._getChildrenRecursive(split)
    }

    private _getChildrenRecursive(account: Array<string>): Array<Account> {
        if (account.length == 1) {
            return this.getChildAccount(account[0]).getChildren()
        } else {
            let subAccounts = account.slice(1, account.length)
            return this.getChildAccount(account[0])._getChildrenRecursive(subAccounts)
        }
    }

    addChild(account: Account) {
        this.accountMap[account.getName()] = account
    }
    getName(): string {
        return this.name
    }

    getFullName(): string {
        return this.fullName
    }
    getChildren(): Array<Account> {
        return Object.values(this.accountMap)
    }

    getChildAccount(name: string): Account {
        return this.accountMap[name]
    }
}