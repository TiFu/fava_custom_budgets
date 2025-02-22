import * as React from 'react';
import { formatMoney, formatWithTabs, calculateAnnualSum, MonthType } from '../../util'
import { BudgetActualProfitSummaryData, ProfitSummaryData } from '../../view_model/ProfitSummary'

interface Props {
    summary: BudgetActualProfitSummaryData
}

class ProfitOverview extends React.Component<Props, {}> {

    formatMoney(income: number): string {
        let formattedIncome = "N/A"
        const hasIncome = !isNaN(income)
        if (hasIncome) {
            formattedIncome = formatMoney(income)
        }
        return formattedIncome
    }

    getIncExpProfit(summary: ProfitSummaryData): [React.JSX.Element, React.JSX.Element, React.JSX.Element] {
        return [
            <td>{this.formatMoney(summary.income)}</td>,
            <td>{this.formatMoney(summary.expenses)}</td>,
            <td>{this.formatMoney(summary.profit)}</td>,
        ]
    }

  render() {

    let header: React.JSX.Element | null = null
    let incomeActual: React.JSX.Element | null = null
    let expensesActual: React.JSX.Element | null = null
    let diffActual: React.JSX.Element | null = null

    let [formattedIncome, formattedExpenses, formattedProfit ] = this.getIncExpProfit(this.props.summary.budget)

    if (this.props.summary.actuals) {
        header = <th>Actual</th>
        [incomeActual, expensesActual, diffActual] = this.getIncExpProfit(this.props.summary.actuals)
    }

    return <table style={{width: "100%"}}>
        <thead>
        <tr><th>Account</th><th>Budget</th>{header}</tr>
        </thead>
        <tbody>
        <tr>
            <td>Income</td>
            {formattedIncome}
            {incomeActual}
        </tr>
        <tr>
            <td>Expenses</td>
            {formattedExpenses}
            {expensesActual}
        </tr>
        <tr>
            <td>Profit</td>
            {formattedProfit}
            {diffActual}
        </tr>
        </tbody>
    </table>
  }

}

export default ProfitOverview;