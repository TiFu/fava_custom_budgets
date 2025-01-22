import * as React from 'react';
import { ExpenseIncomeMap, AccountMap, LoadStatus, AnnualMap, BudgetSummary } from '../model';
import { connect } from "react-redux";
import { formatMoney, formatWithTabs, calculateAnnualSum, monthMapToArray } from '../util'
import { MonthMap } from '../model';
import { Col, Container, Row } from 'react-bootstrap';
import AnnualBudgetChart from './AnnualBudgetChart';
import AccountMapOverview from './AccountMapOverview';
import { useState } from 'react';


interface Props {
  actuals: AccountMap
  budget: AccountMap
  rootAccount: "Income" | "Expenses"
  isExpense: boolean
  year: string
  title: string
}

interface State {
    highlightedAccount: string
}

class BudgetComparison extends React.Component<Props, State> {
 
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
    const [selectedAccount, selectAccount] = useState(this.props.rootAccount)

    // TODO: handle case when year does not exist...
    let incomeActuals = this.props.actuals[selectedAccount][this.props.year]
    let incomeBudget = this.props.budget[selectedAccount][this.props.year]

    let [min, max] = this.getMinMax([incomeActuals, incomeBudget])

    return <Container fluid className="pl-0 pr-0">
        <Row>
            <Col><AnnualBudgetChart minYAxis={min} maxYAxis={max} seriesName={this.props.title} actuals={incomeActuals} budget={incomeBudget} /></Col>
        </Row>
        <Row>
            <Col><h3>Income</h3>
                <AccountMapOverview overview={this.props.budget} actuals={this.props.actuals} year={this.props.year} isExpense={this.props.isExpense} /></Col>
        </Row>
    </Container>
  }

}

export default BudgetComparison;