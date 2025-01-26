import * as React from 'react';
import { AccountMap } from '../model';
import { MonthType } from '../util'
import { Col, Container, Row } from 'react-bootstrap';
import AnnualBudgetChart from './AnnualBudgetChart';
import AccountMapOverview from './AccountMapOverview';
import { AnnualComparison, AnnualSummary } from '../model/model_classes';


interface Props {
  comparison: AnnualComparison
  rootAccount: "Income" | "Expenses"
  isExpense: boolean
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

  getMonthMap(map: AccountMap, account: string, year: string) {

    if (this.state.highlightedAccount in map && year in map[account]) {
        return map[account][year]
    } else {
        return null
    }

  }

  render() {
    let actionHandler = {
        onSelectAccount: (account: string) => this.setHighlightedAccount(account),
        selectedAccount: this.state.highlightedAccount
    }
    return <Container fluid className="pl-0 pr-0">
        <Row>
            <Col><AnnualBudgetChart  ytdMonth={this.props.ytdMonth} minYAxis={this.props.chart.min} maxYAxis={this.props.chart.max} seriesName={this.props.title} comparison={this.props.comparison} account={this.state.highlightedAccount} /></Col>
        </Row>
        <Row className="pt-4">
            <Col>
                <AccountMapOverview ytdMonth={this.props.ytdMonth} actionHandler={actionHandler} diff={this.props.comparison}/></Col>
        </Row>
    </Container>
  }

}

export default MoneySummaryComponent;