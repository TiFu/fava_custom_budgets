import Nav from 'react-bootstrap/Nav';

import * as React from 'react';
import { ExpenseIncomeMap, LoadStatus } from '../model';
import { connect } from "react-redux";
import AccountMapOverview from './AccountMapOverview';

interface ExpenseIncomeMapOverviewProps {
    activeTab: string
    year: string
    dispatch: (e: string) => void
}

class BudgetNavBar extends React.Component<ExpenseIncomeMapOverviewProps, {}> {

  render() {
    return     <Nav variant="tabs"
    activeKey={this.props.activeTab}
    onSelect={(selectedKey) => this.props.dispatch(selectedKey as string)}
  >
    <Nav.Item>
      <Nav.Link eventKey="ytd">YTD {this.props.year}</Nav.Link>
    </Nav.Item>
    <Nav.Item>
      <Nav.Link eventKey="annual">Annual summary {this.props.year} </Nav.Link>
    </Nav.Item>
    <Nav.Item>
      <Nav.Link eventKey="overview">Budget Overview {this.props.year}</Nav.Link>
    </Nav.Item>
  </Nav>
  }

}


export default BudgetNavBar;