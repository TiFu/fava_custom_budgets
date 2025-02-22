import * as React from 'react';
import { MonthType } from '../../util'
import { Col, Container, Row } from 'react-bootstrap';
import { IncomeExpenseBudgetService } from '../../services/IncomeExpenseBudgetService';
import ProfitSummary from '../generic/ProfitSummary';
import BudgetActualComparisonView from '../generic/BudgetActualComparison';
import MoneySummaryComponent from '../MoneySummaryComponent';


interface Props {
  summary: IncomeExpenseBudgetService
  year: string
  ytdMonth: MonthType
}

class BudgetComparison extends React.Component<Props, {}> {
 
  render() {
    let profitOverview = this.props.summary.getIncExpProfitBudget(this.props.year, this.props.ytdMonth)
    let incomeOverview = this.props.summary.getIncomeComparison(this.props.year, this.props.ytdMonth)
    let expenseOverview = this.props.summary.getExpenseComparison(this.props.year, this.props.ytdMonth)
    
    return <Container fluid className="p-0">
        <Row>
          <Col><h3>Profit</h3><ProfitSummary summary={profitOverview} /></Col>
          <Col></Col>
        </Row>
        <Row>
            <Col>
              <MoneySummaryComponent service={this.props.summary} initialAccount='Income' comparison={incomeOverview} title='Income' year={this.props.year} ytd={this.props.ytdMonth} />
            </Col>  
            <Col>
              <MoneySummaryComponent service={this.props.summary} initialAccount='Expenses' comparison={expenseOverview} title='Expenses' year={this.props.year} ytd={this.props.ytdMonth} />
            </Col>
        </Row>
    </Container>
  }

}

export default BudgetComparison;