import * as React from 'react';
import { MonthType } from '../util'
import { Col, Container, Row } from 'react-bootstrap';
import MoneySummaryComponent from './MoneySummaryComponent';
import {BudgetActualSummary } from '../model/model_classes';
import ProfitOverview from './ProfitSummary';



interface Props {
  summary: BudgetActualSummary
  year: string
  ytdMonth: MonthType
}

class BudgetComparison extends React.Component<Props, {}> {
 
  render() {
    let expenses = this.props.summary.getExpenses(this.props.year)
    let income = this.props.summary.getIncome(this.props.year)

    let [min, max] = this.props.summary.getMinMaxAnnualSum(this.props.year)
    let chart = {min: min, max: max}
    return <div className="p-2"><Container fluid className="pl-0 pr-0">
        <Row>
          <Col><h3>Profit</h3><ProfitOverview budget={this.props.summary.getBudgetOverview(this.props.year)} actuals={this.props.summary.getActualOverview(this.props.year)} year={this.props.year} month={this.props.ytdMonth} /></Col>
          <Col></Col>
        </Row>
        <Row>
            <Col>
                <MoneySummaryComponent ytdMonth={this.props.ytdMonth} chart={chart} title={"Income " + this.props.year} isExpense={false} comparison={income} rootAccount='Income' />          
            </Col>  
            <Col>
                <MoneySummaryComponent ytdMonth={this.props.ytdMonth} chart={chart}title={"Expenses " + this.props.year}  isExpense={true} comparison={expenses} rootAccount='Expenses' />                  
            </Col>
        </Row>
    </Container></div>
  }

}

export default BudgetComparison;