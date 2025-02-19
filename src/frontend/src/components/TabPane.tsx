import Nav from 'react-bootstrap/Nav';

import * as React from 'react';

interface ExpenseIncomeMapOverviewProps {
    activeTab: string
    year: string
    dispatch: (e: string) => void
}

class BudgetNavBar extends React.Component<ExpenseIncomeMapOverviewProps, {}> {

  // TODO: We could merge Spending & Spending YTD -> make this a toggle or just show both?
  render() {
    return     <Nav variant="tabs"
    activeKey={this.props.activeTab}
    onSelect={(selectedKey) => this.props.dispatch(selectedKey as string)}
  >
      <Nav.Item>
        <Nav.Link eventKey="spending">Spending {this.props.year}</Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link eventKey="overview-spending-budget">Spending Budget Overview {this.props.year}</Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link eventKey="asset-budget">Asset Budget  {this.props.year}</Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link eventKey="asset-account">Asset Accounts {this.props.year}</Nav.Link>
      </Nav.Item>

  </Nav>
  }

}


export default BudgetNavBar;