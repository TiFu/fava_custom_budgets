import * as React from 'react';
import { ExpenseIncomeMap, AccountMap, LoadStatus } from '../model';
import { connect } from "react-redux";
import { formatMoney, formatWithTabs, calculateAnnualSum } from '../util'

interface Props {
    overview: ExpenseIncomeMap
    year: string
}

class ProfitOverview extends React.Component<Props, {}> {

   calculateForAccount(map: AccountMap, account: string): number | string {
        if (!(account in map) || !(this.props.year in map[account])) {
            return "N/A"
        } 

        let moneySum = calculateAnnualSum(map[account][this.props.year])
        return moneySum
   }

  render() {
    console.log("Account Map overview", this.props.overview)

    let income = this.calculateForAccount(this.props.overview.Income, "Income")
    let expenses = this.calculateForAccount(this.props.overview.Expenses, "Expenses")

    let formattedIncome = "N/A"
    let formattedExpenses = "N/A"
    let formattedProfit = "N/A"
    if (typeof income == "number") {
        formattedIncome = formatMoney(income)
    }

    if (typeof expenses == "number") {
        formattedExpenses = formatMoney(expenses)
    }

    if (typeof income == "number" && typeof expenses == "number") {
        formattedProfit = formatMoney(income - expenses)
    }

    return <table style={{width: "100%"}}>
        <thead>
        <tr><th>Account</th><th>Amount</th></tr>
        </thead>
        <tbody>
        <tr>
            <td>Income</td>
            <td>{formattedIncome}</td>
        </tr>
        <tr>
            <td>Expenses</td>
            <td>{formattedExpenses}</td>
        </tr>
        <tr>
            <td>Profit</td>
            <td>{formattedProfit}</td>
        </tr>
        </tbody>
    </table>
  }

}

export default ProfitOverview;