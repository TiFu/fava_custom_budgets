import * as React from 'react';
import {Row, Col, Container} from 'react-bootstrap'
import BreakdownTable from '../generic/BreakdownTable';
import { AssetBudgetService } from '../../services/AssetBudgetService';
import { MonthType } from '../../util';
import BudgetActualComparisonView from '../generic/BudgetActualComparison';
import BudgetChart from '../generic/BudgetChart';

interface Props {
    overview: AssetBudgetService
    year: string
    ytd: MonthType
}

interface State {
    highlightedBudget: string
}

class AssetBudgetOverview extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props)
        this.state = {
            highlightedBudget: this.props.overview.getBudgetNames()[0]
        }
  }
    setHighlightedAccount(account: string) {
        this.setState({
            highlightedBudget: account
        })
    }

  render() {
    if (!this.props.overview)
        return <div>No budget loaded yet...</div>

    let actionHandler = {
        onSelectAccount: (account: string) => this.setHighlightedAccount(account),
        selectedAccount: this.state.highlightedBudget
    }

    let comparison = this.props.overview.getBudgetActualComparisonSummary(this.props.year, this.props.ytd)
    
    let chart = this.props.overview.getChart(this.state.highlightedBudget, this.props.year, this.props.ytd)
    let breakdownTable = this.props.overview.getBreakdownTableByAccount(this.state.highlightedBudget, this.props.year, this.props.ytd)

    return <Container fluid className="p-0">
            <Row>
                <Col sm={4}>
                    <BudgetActualComparisonView type={"Asset"} actionHandler={actionHandler} comparison={comparison} />
                </Col>
                <Col sm={8}>  
                    <BudgetChart data={chart} />
                    <BreakdownTable breakdowntable={breakdownTable  } actualName="Actual" />
                </Col>
            </Row>
        </Container>
  }
}

export default AssetBudgetOverview;