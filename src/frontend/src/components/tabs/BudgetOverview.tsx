import * as React from 'react';
import {Row, Col, Container} from 'react-bootstrap'
import ProfitOverview from '../generic/ProfitSummary';
import { IncomeExpenseBudgetService } from '../../services/IncomeExpenseBudgetService';
import { MonthType } from '../../util';
import BudgetActualComparisonView from '../generic/BudgetActualComparison';
interface ExpenseIncomeMapOverviewProps {
    overview: IncomeExpenseBudgetService
    year: string
    ytd: MonthType
}

class BudgetOverview extends React.Component<ExpenseIncomeMapOverviewProps, {}> {

  render() {
    console.log("ExpenseIncomeMap", this.props.overview)
    if (!this.props.overview)
        return <div>No budget loaded yet...</div>

    let profitOverview = this.props.overview.getIncExpProfitBudget(this.props.year, this.props.ytd)
    let incomeSummary = this.props.overview.getBudgetIncomeSummary(this.props.year, this.props.ytd)
    let expenseSummary = this.props.overview.getBudgetExpenseSummary(this.props.year, this.props.ytd)
    return <div className="p-2">

        <Container fluid className="p-0">
        <Row>
            <Col>
                <h3>Profit</h3>
                <ProfitOverview summary={profitOverview} />
            </Col>
            <Col>
            </Col>
        </Row>
        <Row>
            <Col>
                <h2>Income</h2>
                <BudgetActualComparisonView summary={incomeSummary} type={"Income"} />
            </Col>
            <Col>        
                <h2>Expenses</h2>
                <BudgetActualComparisonView summary={expenseSummary} type={"Expenses"}/>
            </Col>
        </Row>
        </Container>


    </div>
  }

}

export default BudgetOverview;