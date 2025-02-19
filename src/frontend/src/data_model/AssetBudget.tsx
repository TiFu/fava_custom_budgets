import { AnnualMap, AccountMap} from './common'
import { MonthType, calculateYtDSum, monthMapToArray } from "../util"
import { TelephoneMinusFill } from 'react-bootstrap-icons'

export type AssetBalance = {actual: number} & {[key: string]: number}

export interface AssetBudget {
    account: Array<string>
    accountBalance: AccountMap<AssetBalance>
    budgetBalance: AccountMap<number>
    budgets: AccountMap<number>
}



/* 
    What do I need to show to make this useful?
    
    Component 1: Budget Status
        (B) Budget Chart YTD
            Should vs is as a line chart

            Solution: New component
        (A) Budget Status YTD
            Budget line item Account <IS in EUR> <IS in account units> <should> <diff>
            Budget line item <should> <is> <diff> ++ marker with issue

            Solution: New component with collabsible table (?) -> make this collabsible logic generic, i.e., you feed in hierarchy of data with rows/cols & rest is done automagically)
    
    (D) Account Detail (YTD)
        Account <Budget line item> <IS in EUR> <IS in account units> <should> <diff>
*/  

export type Budget = string
export type Account = string
export type AssetBudgetByAccountSummary = { [key: Budget]: {[key: Account]: number }}

export interface AssetSummary {
    actual: number
    budgeted: number
    diff: number
}

export interface AssetBudgetSummary {
    "budget": {
            [key: Budget] : AssetSummary}

    "byAccount": AssetBudgetByAccountSummary
}

