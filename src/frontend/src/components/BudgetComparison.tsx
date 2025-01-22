import * as React from 'react';
import { ExpenseIncomeMap, AccountMap, LoadStatus, AnnualMap, BudgetSummary } from '../model';
import { connect } from "react-redux";
import { formatMoney, formatWithTabs, calculateAnnualSum, monthMapToArray, MonthType } from '../util'
import { MonthMap } from '../model';
import { Col, Container, Row } from 'react-bootstrap';
import AnnualBudgetChart from './AnnualBudgetChart';
import AccountMapOverview from './AccountMapOverview';
import MoneySummaryComponent from './MoneySummaryComponent';



interface Props {
  summary: BudgetSummary
  year: string
  ytdMonth: MonthType
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

    let [min, max] = this.getMinMax([incomeActuals, incomeBudget, expenseActuals, expenseBudgets])
    let chart = {min: min, max: max}
    return <div className="p-2"><Container fluid className="pl-0 pr-0">
        <Row>
            <Col><h2>Budget Analysis YTD {this.props.ytdMonth}/{this.props.year}</h2></Col>
        </Row>
        <Row>
            <Col>
                <MoneySummaryComponent ytdMonth={this.props.ytdMonth} chart={chart} title={"Income " + this.props.year} isExpense={false} actuals={this.props.summary.actuals.Income} budget={this.props.summary.budgets.Income} rootAccount='Income' year={this.props.year} />          
            </Col>
            <Col>
                <MoneySummaryComponent ytdMonth={this.props.ytdMonth} chart={chart}title={"Expenses " + this.props.year}  isExpense={true} actuals={this.props.summary.actuals.Expenses} budget={this.props.summary.budgets.Expenses} rootAccount='Expenses' year={this.props.year} />                  
            </Col>
        </Row>
    </Container></div>
  }

}

export default BudgetComparison;