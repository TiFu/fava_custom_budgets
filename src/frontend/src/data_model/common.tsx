export type Month = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12"
export type Year = string
export type Account = string
export type MonthMap<T> = { [key in Month]: T }
export type AnnualMap<T> = { [key: Year]: MonthMap<T> }
export type AccountMap<T> = { [key: Account]: AnnualMap<T> }

