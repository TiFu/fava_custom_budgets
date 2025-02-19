import * as React from 'react';
import AccountMapOverview from '../AccountMapOverview';
import {Row, Col, Container} from 'react-bootstrap'
import ProfitOverview from '../ProfitSummary';
import { ProfitSummary } from '../../services/IncomeExpenseBudgetService';
interface ExpenseIncomeMapOverviewProps {
    overview: ProfitSummary
    year: string
}

class BudgetOverview extends React.Component<ExpenseIncomeMapOverviewProps, {}> {

  render() {
    console.log("ExpenseIncomeMap", this.props.overview)
    if (!this.props.overview)
        return <div>No budget loaded yet...</div>

    return <div className="p-2">

        <Container fluid className="p-0">
        <Row>
            <Col>
                <h3>Profit</h3>
                <ProfitOverview budget={this.props.overview} year={this.props.year} month={12} />
            </Col>
            <Col>
            </Col>
        </Row>
        <Row>
            <Col>
                <h2>Income</h2>
                <AccountMapOverview ytdMonth={12} overview={this.props.overview.getIncome()} />
            </Col>
            <Col>        
                <h2>Expenses</h2>
                <AccountMapOverview ytdMonth={12} overview={this.props.overview.getExpenses()} />
            </Col>
        </Row>
        </Container>


    </div>
  }

}

export default BudgetOverview;