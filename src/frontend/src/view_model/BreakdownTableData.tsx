import { Account, MonthMap } from "../data_model/common"

export type AccountBreakdown = { [key: Account]: Array<number> }

export interface BreakdownTableData {
    budgetName: string
    budget?: Array<number>
    actual: Array<number>
    actualBreakdown: AccountBreakdown
}