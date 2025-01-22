import * as React from 'react';
import { ExpenseIncomeMap, AccountMap, LoadStatus, AnnualMap, BudgetSummary } from '../model';
import { connect } from "react-redux";
import { formatMoney, formatWithTabs, calculateAnnualSum, monthMapToArray, MonthType } from '../util'
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
  ytdMonth: MonthType
  chart: {
    min: number,
    max: number
  }
}

interface State {
    highlightedAccount: string
}

class MoneySummaryComponent extends React.Component<Props, State> {
    
  constructor(props: Props) {
        super(props)
        this.state = {
            highlightedAccount: this.props.rootAccount
        }
  }
  
  setHighlightedAccount(account: string) {
    this.setState({
        highlightedAccount: account
    })
  }

  getMinMax(monthmaps: Array<MonthMap> ) {
    let max = -10000000
    let min = 10000000
    for (let map of monthmaps) {
        if (!map) 
            continue

        for (let i = 1; i <= this.props.ytdMonth; i++) {
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

  getMonthMap(map: AccountMap, account: string, year: string) {

    if (this.state.highlightedAccount in map && year in map[account]) {
        return map[account][year]
    } else {
        return null
    }

  }

  render() {

    // TODO: handle case when year does not exist...
    let incomeActuals = this.getMonthMap(this.props.actuals, this.state.highlightedAccount, this.props.year) 
    let incomeBudget = this.getMonthMap(this.props.budget, this.state.highlightedAccount, this.props.year)

    let actionHandler = {
        onSelectAccount: (account: string) => this.setHighlightedAccount(account),
        selectedAccount: this.state.highlightedAccount
    }
    return <Container fluid className="pl-0 pr-0">
        <Row>
            <Col><AnnualBudgetChart  ytdMonth={this.props.ytdMonth} minYAxis={this.props.chart.min} maxYAxis={this.props.chart.max} seriesName={this.props.title} actuals={incomeActuals} budget={incomeBudget} /></Col>
        </Row>
        <Row>
            <Col>
                <AccountMapOverview ytdMonth={this.props.ytdMonth} actionHandler={actionHandler} overview={this.props.budget} actuals={this.props.actuals} year={this.props.year} isExpense={this.props.isExpense} /></Col>
        </Row>
    </Container>
  }

}

export default MoneySummaryComponent;