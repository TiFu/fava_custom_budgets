
import {AccountMap, MonthMap} from './data_model/common';
import {ExpenseIncomeMap} from './data_model/IncomeExpenseBudget'

const nFormat = new Intl.NumberFormat(undefined, {minimumFractionDigits: 0});

export function convertToMonthName(month: MonthType) {
    var months = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
           "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];

    var selectedMonthName = months[month - 1];
    return selectedMonthName
}

export function formatMoney(money: number | undefined): string {
    if (money == undefined) {
        return "";
    }
    money = Math.round(money)
    return nFormat.format(money)
}

export function formatPercentage(money: number | undefined): string {
    if (money === undefined) {
        return "-"
    }

    return Math.round(money * 100) + "%"
}

export function getMonthOrZero(map: AccountMap<number>, account: string, year: string, ytd: MonthType): Array<number> {
    let result = []
    for (let i = 1; i <= ytd; i++) {
        result.push(getValueOrZero(map, account, year, ytd))
    }
    return result
}

export function getValueOrZero(map: AccountMap<number>, account: string, year: string, ytd: MonthType) {
    if (account in map && year in map[account] && ytd in map[account][year]) {
        return map[account][year][ytd]
    } else {
        return 0
    }
}

export type MonthType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
// Account:Sub1:Sub2 => "    Sub2"
export function formatWithTabs(account: string): string {
    let split = account.split(":")
    let level = split.length - 1

    return "  ".repeat(level) + split[split.length - 1]; 
}

export function monthMapToArray(input: MonthMap<number> | null, ytdMonth: MonthType) {
    let output = []
    console.log("Month map to array: ", input)
    for (let i = 1; i<= ytdMonth; i++) {
        if (!input || !(i in input))
            output.push(0)
        else
            output.push(Math.round((input as any)[i]))
    }
    return output
}

export function calculateYtDSum(input: MonthMap<number>, month: MonthType) {
    let sum = 0
    for (let i = 1; i<= month; i++) {
        sum += (input as any)[i] 
    }
    return sum

}
export function calculateAnnualSum(input: MonthMap<number>) {
    return calculateYtDSum(input, 12)
}

export function extractYears(input: ExpenseIncomeMap) {
    let years = new Set<string>()
    _extractYears(input.Expenses, years)
    _extractYears(input.Income, years)
    let yearArray = Array.from(years)
    yearArray.sort()
    yearArray.reverse()
    return yearArray
}

function _extractYears(accountMap: AccountMap<any>, set: Set<string>) {
    for (let account in accountMap) {
        let annualMap = accountMap[account]
        let accountExpenseYears = Object.keys(annualMap)
        for (let year of accountExpenseYears) {
            set.add(year)
        }
    }
}