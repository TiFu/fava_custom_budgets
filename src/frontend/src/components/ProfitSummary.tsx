import * as React from 'react';
import { ExpenseIncomeMap, AccountMap, LoadStatus } from '../model';
import { connect } from "react-redux";
import { formatMoney, formatWithTabs, calculateAnnualSum, MonthType } from '../util'
import { AnnualSummary, ProfitSummary } from '../model/model_classes';

interface Props {
    budget: ProfitSummary
    actuals?: ProfitSummary
    month: MonthType
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

   getFormattedData(summary: ProfitSummary): [string, string, string] {
    let income = summary.getIncome().getYtDSum("Income", this.props.month)
    let expenses = summary.getExpenses().getYtDSum("Expenses", this.props.month)
    let diff = summary.getProfit(this.props.month)
    console.log("Incmoe Expenses Diff ", income, expenses, diff)

    let formattedIncome = "N/A"
    let formattedExpenses = "N/A"
    let formattedProfit = "N/A"

    const hasIncome = !isNaN(income)
    const hasBudget = !isNaN(expenses)

    if (hasIncome) {
        formattedIncome = formatMoney(income)
    }

    if (hasBudget) {
        formattedExpenses = formatMoney(expenses)
    }

    if (hasBudget && hasIncome) {
        formattedProfit = formatMoney(diff)
    }
    return [ formattedIncome, formattedExpenses, formattedProfit]
   }

  render() {
    const [formattedIncome, formattedExpenses, formattedProfit] = this.getFormattedData(this.props.budget)

    let header = null
    let incomeActual = null
    let expensesActual = null
    let diffActual = null
    if (this.props.actuals) {
        const [formattedIncomeActual, formattedExpensesActual, formattedProfitActuals] = this.getFormattedData(this.props.actuals)
        header = <th>Actual</th>
        incomeActual = <td>{formattedIncomeActual}</td>
        expensesActual = <td>{formattedExpensesActual}</td>
        diffActual = <td>{formattedProfitActuals}</td>
        
    }

    return <table style={{width: "100%"}}>
        <thead>
        <tr><th>Account</th><th>Budget</th>{header}</tr>
        </thead>
        <tbody>
        <tr>
            <td>Income</td>
            <td>{formattedIncome}</td>
            {incomeActual}
        </tr>
        <tr>
            <td>Expenses</td>
            <td>{formattedExpenses}</td>
            {expensesActual}
        </tr>
        <tr>
            <td>Profit</td>
            <td>{formattedProfit}</td>
            {diffActual}
        </tr>
        </tbody>
    </table>
  }

}

export default ProfitOverview;