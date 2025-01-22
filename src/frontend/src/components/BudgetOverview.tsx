import * as React from 'react';
import { ExpenseIncomeMap, LoadStatus } from '../model';
import { connect } from "react-redux";
import AccountMapOverview from './AccountMapOverview';
import {Row, Col, Container} from 'react-bootstrap'
import ProfitOverview from './ProfitSummary';
interface ExpenseIncomeMapOverviewProps {
    overview: ExpenseIncomeMap
    year: string
}

class ExpenseIncomeMapOverview extends React.Component<ExpenseIncomeMapOverviewProps, {}> {

  render() {
    console.log("ExpenseIncomeMap", this.props.overview)
    if (!this.props.overview)
        return <div>No budget loaded yet...</div>
        
    return <div className="p-2">

        <Container fluid className="pl-0 pr-0">
        <Row>
            <Col>
                <h2>Budget Overview for {this.props.year}</h2>
            </Col>
        </Row>
        <Row>
            <Col>
                <h3>Profit</h3>
                <ProfitOverview overview={this.props.overview} year={this.props.year}/>
            </Col>
            <Col>
            </Col>
        </Row>
        <Row>
            <Col>
                <h2>Income</h2>
                <AccountMapOverview overview={this.props.overview.Income} year={this.props.year} />
            </Col>
            <Col>        
                <h2>Expenses</h2>
                <AccountMapOverview overview={this.props.overview.Expenses}  year={this.props.year}/>
            </Col>
        </Row>
        </Container>


    </div>
  }

}

export default ExpenseIncomeMapOverview;