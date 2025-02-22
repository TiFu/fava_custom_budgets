import * as React from 'react';
import { MonthType } from '../util'
import { Col, Container, Row } from 'react-bootstrap';
import { BudgetActualComparisonData, BudgetActualComparisonSummary } from '../view_model/BudgetActualComparisonData';
import { BudgetChartData } from '../view_model/BudgetChartData';
import BudgetActualComparisonView, { ActionHandler } from './generic/BudgetActualComparison';
import BudgetChart from './generic/BudgetChart';
import { IncomeExpenseBudgetService } from '../services/IncomeExpenseBudgetService';


interface Props {
  comparison: BudgetActualComparisonSummary
  service: IncomeExpenseBudgetService
  initialAccount: "Income" | "Expenses"
  title: string
  year: string
  ytd: MonthType
}

interface State {
    highlightedAccount: string
}

class MoneySummaryComponent extends React.Component<Props, State> {
    
  constructor(props: Props) {
        super(props)
        this.state = {
          highlightedAccount: this.props.initialAccount
        }
  }
  
  setHighlightedAccount(account: string) {
    this.setState({
        highlightedAccount: account
    })
  }
  
  render() {
    let actionHandler = {
      onSelectAccount: (account: string) => this.setState({highlightedAccount: account}),
      selectedAccount: this.state.highlightedAccount
    }
    let chart = this.props.service.getChart(this.state.highlightedAccount, this.props.year, this.props.ytd)
    return <Container fluid className="p-0">
        <Row>
            <Col><BudgetChart data={chart} /></Col>
        </Row>
        <Row className="pt-4">
            <Col>
          <BudgetActualComparisonView actionHandler={actionHandler} type={this.props.title} comparison={this.props.comparison}/></Col>
        </Row>
    </Container>
  }

}

export default MoneySummaryComponent;