import { BudgetSummaryData } from "../data_model/IncomeExpenseBudget"
import { AccountMap } from "../data_model/common"
import { MonthType, calculateAnnualSum } from "../util"

export class BudgetActualSummary {
    private summary: BudgetSummaryData

    private accounts: Array<string>
    private accountHierarchy: Account
    private minYear: number
    private maxYear: number

    constructor(summary: BudgetSummaryData) {
        this.summary = summary
        this.extractAccounts()
        this.extractAccountHierarchy()
        this.extractYears()
    }

    public getMinMaxAnnualSum(year: string): [number, number] {
        let min = 1000000000
        let max = -100000000
        for (let map of [this.summary.actuals.Income["Income"], this.summary.actuals.Expenses["Expenses"], 
            this.summary.budgets.Income["Income"], this.summary.budgets.Expenses["Expenses"]]) {
            if (!(year in map)) {
                continue
            }
            const sum = calculateAnnualSum(map[year])
            min = Math.min(min, sum)
            max = Math.max(max, sum)
        }
        return [min, max]

    }
    public getYears(): Array<number> {
        let output: Array<number> = []
        for (let i = this.maxYear; i >= this.minYear; i--) {
            output.push(i)
        }
        return output
    }
    private extractYears() {
        let [actualIncomeMin, actualIncomeMax] = this.extractYearsFromMap(this.summary.actuals.Income)
        let [actualExpensesMin, actualExpensesMax] = this.extractYearsFromMap(this.summary.actuals.Expenses)
        let [budgetsIncomeMin, budgetsIncomeMax] = this.extractYearsFromMap(this.summary.budgets.Income)
        let [budgetsExpensesMin, budgetsExpensesMax] = this.extractYearsFromMap(this.summary.budgets.Expenses)

        this.minYear = Math.min(actualIncomeMin, actualExpensesMin, budgetsIncomeMin, budgetsExpensesMin)
        this.maxYear = Math.max(actualIncomeMax, actualExpensesMax, budgetsIncomeMax, budgetsExpensesMax)
    }

    private extractYearsFromMap(map: AccountMap<number>): Array<number> {
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

    private extractAccounts() {
        let accountSet = new Set<string>
        Object.keys(this.summary.actuals.Expenses).forEach(a => accountSet.add(a))
        Object.keys(this.summary.budgets.Expenses).forEach(a => accountSet.add(a))
        Object.keys(this.summary.actuals.Income).forEach(a => accountSet.add(a))
        Object.keys(this.summary.budgets.Income).forEach(a => accountSet.add(a))

        this.accounts = Array.from(accountSet)
        this.accounts.sort()

    }

    private extractAccountHierarchy() {
        let factory = new AccountFactory()

        let rootAccount = factory.constructHierarchy(this.accounts)
        this.accountHierarchy = rootAccount
    }


    getAccounts(): Array<string> {
        return this.accounts
    }
    getIncomeAccountHierarchy(): Account {
        return this.accountHierarchy.getChildAccount("Income")
    }
    getExpenseAccountHierarchy(): Account {
        return this.accountHierarchy.getChildAccount("Expenses")
    }
    getIncome(year: string): AnnualComparison {
        return new AnnualComparison(this.summary, this.accountHierarchy, "Income", year)
    }

    getExpenses(year: string): AnnualComparison {
        return new AnnualComparison(this.summary, this.accountHierarchy, "Expenses", year)
    }

    getBudgetOverview(year: string): ProfitSummary {
        let incomeSummary = new AnnualSummary(this.summary.budgets.Income, this.accountHierarchy, year)
        let expensesSummary = new AnnualSummary(this.summary.budgets.Expenses, this.accountHierarchy,  year)
        return new ProfitSummary(incomeSummary, expensesSummary)
    }

    getActualOverview(year: string): ProfitSummary {
        let incomeSummary = new AnnualSummary(this.summary.actuals.Income, this.accountHierarchy,  year)
        let expensesSummary = new AnnualSummary(this.summary.actuals.Expenses, this.accountHierarchy,  year)
        return new ProfitSummary(incomeSummary, expensesSummary)
    }

}


export class ProfitSummary {
    constructor(private income: AnnualSummary, private expenses: AnnualSummary) {

    }
    getIncome(): AnnualSummary {
        return this.income
    }

    getExpenses(): AnnualSummary {
        return this.expenses
    }
    getProfit(month: MonthType): number {
        return this.income.getYtDSum("Income", month) - this.expenses.getYtDSum("Expenses", month)
    }
}


export class AnnualComparison {
    private absoluteLimit = 200
    private relativeLimit = 0.05
    private budget: AnnualSummary
    private actuals: AnnualSummary
    
    constructor(data: BudgetSummaryData, private accountHierarchy: Account, type: "Income" | "Expenses", private year: string) {
        this.budget = new AnnualSummary(data.budgets[type], this.accountHierarchy,  year)
        this.actuals = new AnnualSummary(data.actuals[type], this.accountHierarchy,  year)
    }

    getAccounts(): Array<string> {
        let accounts = new Set<string>()
        this.actuals.getAccounts().forEach(a => accounts.add(a))
        this.budget.getAccounts().forEach(a => accounts.add(a))

        let accountArr = Array.from(accounts)
        accountArr.sort()
        return accountArr
    }

    getActuals(): AnnualSummary {
        return this.actuals
    }
    getBudget(): AnnualSummary {
        return this.budget
    }

    isBudgetExceeded(account: string, month: MonthType) {
        let absolute = this.getAbsoluteYtDDiff(account, month)
        let relative = this.getRelativeYtDDiff(account, month)
        let isExpense = account.startsWith("Expenses")
        let isIncome = account.startsWith("Income")

        if (isIncome) {
            return (relative as number) < this.relativeLimit*-1 || (absolute as number) < this.absoluteLimit*-1
        }

        if (isExpense) {
            return (relative as number) > this.relativeLimit || (absolute as number) > this.absoluteLimit 
        }

        return true;
    }
    getAbsoluteAnnualDiff(account: string): number {
        return this.getAbsoluteYtDDiff(account, 12)
    }

    getAbsoluteYtDDiff(account: string, month: MonthType): number {
        return this.getYtdDiff(account, month, this.absoluteDiffFunction)
    }

    getAbsoluteMonthlyDiff(account: string): Array<number> {
        return this.getMonthlyDiff(account, this.absoluteDiffFunction)
    }

    private relativeDiffFunction(actuals: number, budget: number) {
        if (Math.abs(budget) < 10e-9) 
            return 1 // if budget 0 can only have 100% off 
        return (actuals - budget) / budget
    }

    private absoluteDiffFunction(actuals: number, budget: number) {
        return actuals - budget
    }
    private getYtdDiff(account: string, month: MonthType, diffFunction: (actuals: number, budget: number) => number) {
        let sumBudget = this.budget.getYtDSum(account, month)
        let sumActuals = this.actuals.getYtDSum(account, month)
        return diffFunction(sumActuals, sumBudget)

    }

    private getMonthlyDiff(account: string, diffFunction: (actuals: number, budget: number) => number) {
        let budget = this.budget.getMonthlyValues(account, 12)
        let actuals = this.budget.getMonthlyValues(account, 12)

        let output: Array<number> = []
        for (let i = 0; i < budget.length; i++) {
            output.push(diffFunction(actuals[i], budget[i]))
        }

        return output        
    }
    getRelativeAnnualDiff(account: string): number {
        return this.getRelativeYtDDiff(account, 12)
    }
    getRelativeYtDDiff(account: string, month: MonthType): number {
        return this.getYtdDiff(account, month, this.relativeDiffFunction)
    }

    getRelativeMonthlyDiff(account: string): Array<number> {
        return this.getMonthlyDiff(account, this.relativeDiffFunction)

    }

}

export class AnnualSummary {
    private accounts: Array<string>

    constructor(private data: AccountMap<number>, private accountHierarchy: Account, private year: string) {
        this.calculateAccounts()
    }

    private calculateAccounts() {
        console.log("Data: ", this.data)
        let set = new Set<string>();

        Object.keys(this.data).forEach(a => set.add(a))

        let arr = Array.from(set)
        arr.sort()
        console.log("Accounts in Annual Summary ", this.accounts)
        this.accounts = arr
    }

    getAccounts(): Array<string> {
        return this.accounts
    }

    // Returns 0 iff the account or year do not exist
    getAnnualSum(account: string): number {
        return this.getYtDSum(account, 12)
    }

    getYtDSum(account: string, month: MonthType): number {
        const accountMap = this.data

        let sum = 0
        if (!(account in accountMap && this.year in accountMap[account])) {
            return 0
        }

        for (let i = 1; i <= month; i++) {
            sum += accountMap[account][this.year][i as MonthType]
        }

        return sum

    }

    getMonthlyValuesOfChildren(account: string, month:MonthType) {
        let children = this.accountHierarchy.getChildrenRecursive(account)
        let output: Array<{name: string, fullName: string, data: Array<number>}> = []
        for (let child of children) {
            let values = this.getMonthlyValues(child.getFullName(), month)
            output.push({
                name: child.getName(),
                fullName: child.getFullName(),
                data: values
            })
        }
        return output
    }
    getMonthlyValues(account: string, month: MonthType): Array<number> {
        const type = account.split(":")[0] as "Income" | "Expenses"
        const accountMap = this.data
        
        if (!(account in accountMap && this.year in accountMap[account])) {
            let output: Array<number> = []
            for (let i = 1; i <= month; i++) {
                output.push(0)
            }
            return output as Array<number>
        }
    
        let output: Array<number> = []
        for (let i = 1; i<= month; i++) {
            if (i in accountMap[account][this.year]) {
                output.push(accountMap[account][this.year][i as MonthType])            
            } else {
                output.push(0)
            }
        }

        return output
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
        console.log("Starting recursive account search ", account)
        return this._getChildrenRecursive(split)
    }

    private _getChildrenRecursive(account: Array<string>): Array<Account> {
        console.log("Recursive search", account, this.getFullName())
        if (account.length == 1) {
            console.log("Returning for ", account[0], this.getFullName())
            return this.getChildAccount(account[0]).getChildren()
        } else {
            console.log("Recursing for ", account[0], this.getFullName())
            console.log("Map is: ", Object.keys(this.accountMap))
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