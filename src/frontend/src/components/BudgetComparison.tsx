import * as React from 'react';
import { ExpenseIncomeMap, AccountMap, LoadStatus, AnnualMap, BudgetSummary } from '../model';
import { connect } from "react-redux";
import { formatMoney, formatWithTabs, calculateAnnualSum, monthMapToArray } from '../util'
import { MonthMap } from '../model';
import { Col, Container, Row } from 'react-bootstrap';
import AnnualBudgetChart from './AnnualBudgetChart';
import AccountMapOverview from './AccountMapOverview';



interface Props {
  summary: BudgetSummary
  year: string
}

class BudgetComparison extends React.Component<Props, {}> {
 
  getMinMax(monthmaps: Array<MonthMap> ) {
    let max = -10000000
    let min = 10000000
    for (let map of monthmaps) {
        if (!map) 
            continue

        for (let i = 1; i <= 12; i++) {
            const val = (map as any)[i]
            if (val > max) {
                max = val
            }

            if (val < min) {
                min = val
            }
        }
    }

    return [min, max]
  }


  render() {
    let incomeActuals = this.props.summary.actuals.Income["Income"][this.props.year]
    let incomeBudget = this.props.summary.budgets.Income["Income"][this.props.year]

    let expenseActuals = this.props.summary.actuals.Expenses["Expenses"][this.props.year]
    let expenseBudgets = this.props.summary.budgets.Expenses["Expenses"][this.props.year]

    console.log("Income Actuals: ", incomeActuals)
    console.log("Income Budget: ", incomeBudget)
    console.log("Expense Actuals: ", expenseActuals)
    console.log("Expense Budget: ", expenseBudgets)

    let [min, max] = this.getMinMax([incomeActuals, incomeBudget, expenseActuals, expenseBudgets])
    return <div className="p-2"><Container fluid className="pl-0 pr-0">
        <Row>
            <Col><h2>Annual comparison {this.props.year}</h2></Col>
        </Row>
        <Row>
            <Col><AnnualBudgetChart minYAxis={min} maxYAxis={max} seriesName={"Income " + this.props.year} actuals={incomeActuals} budget={incomeBudget} /></Col>
            <Col><AnnualBudgetChart minYAxis={min}  maxYAxis={max} seriesName={"Expenses " + this.props.year} actuals={expenseActuals} budget={expenseBudgets} /></Col>
        </Row>
        <Row>
            <Col><h3>Income</h3>
                <AccountMapOverview overview={this.props.summary.budgets.Income} actuals={this.props.summary.actuals.Income} year={this.props.year} isExpense={false} /></Col>
            <Col><h3>Expenses</h3>
                <AccountMapOverview overview={this.props.summary.budgets.Expenses} actuals={this.props.summary.actuals.Expenses} year={this.props.year} isExpense={true} />
            </Col>
        </Row>
    </Container></div>
  }

}

export default BudgetComparison;