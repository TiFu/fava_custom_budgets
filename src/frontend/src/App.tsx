import * as React from 'react';

import {RootState} from './store/index'
import { connect } from "react-redux";
import BudgetNavBar from './components/TabPane';
import BudgetDropdown from './components/DrowdownButton';
import { selectYear } from './features/filters';
import { selectTab, toggleYtD } from './features/uistate';
//import { fetchBudget } from './features/budgets'
import {TabKey} from './features/uistate'
import { Container, Col, Row } from 'react-bootstrap';
import { Button } from 'react-bootstrap';
import BudgetComparison from './components/tabs/BudgetComparison';
import AssetBudgetOverview from './components/tabs/AssetBudgetOverview';
import BudgetOverview from './components/tabs/BudgetOverview'
import AssetAccountOverview from './components/tabs/AssetAccountOverview'
function mapStateToProps(state: RootState) {
  return state
}

function mapDispatchToProps(dispatch: any) {
  return {
    selectYear: (e: string) => dispatch(selectYear(e)),
    selectTab: (e: TabKey) => dispatch(selectTab(e)),
    toggleYtD: () => dispatch(toggleYtD(null))
  };
};


type PropState = RootState & ReturnType<typeof mapDispatchToProps>

class App extends React.Component<PropState, {}>  {

  getOverviewDisplayComponent() {
    console.log("Overview: ", this.props.budget)
    return <BudgetOverview overview={this.props.budget.budgets} year={this.props.filters.selectedYear} ytd={this.props.uislice.ytdMonth} />
  }

  getSpendingComparison() {
    return <BudgetComparison summary={this.props.budget.budgets} year={this.props.filters.selectedYear} ytdMonth={this.props.uislice.ytdMonth}/>
  }

  getOverviewAssetBudget() {
    return <AssetBudgetOverview ytd={this.props.uislice.ytdMonth} overview={this.props.budget.assetBudgets} year={this.props.filters.selectedYear} />
  }

  getAssetAccountOverview() {
    return <AssetAccountOverview ytd={this.props.uislice.ytdMonth} overview={this.props.budget.assetBudgets} year={this.props.filters.selectedYear} />
  }


  render() {
    console.log("App: ", this.props.budget.budgets)
    let years = this.props.budget.budgets.getYears().map(a => a + "")
    
    let displayComponent: React.ReactElement | null = null

    switch (this.props.uislice.selectedTab) {
      case "overview-spending-budget":
        displayComponent = this.getOverviewDisplayComponent()
        break;
      case "spending":
        displayComponent = this.getSpendingComparison()
        break;
      case "asset-budget":
        displayComponent = this.getOverviewAssetBudget()
        break;
      case "asset-account": 
        displayComponent = this.getAssetAccountOverview()
        break;
    }

    let buttonColor = this.props.uislice.showYtD ? "success" : "outline-dark"

    return (
          <Container fluid className="pl-0 pr-0">
            <Row className="pb-4">
              <Col>
                <BudgetDropdown years={years} selectedYear={this.props.filters.selectedYear} onSelect={(e) => this.props.selectYear(e as any)}/>
                <div style={{float: "left"}} className="ps-2"><Button variant={buttonColor} onClick={() => this.props.toggleYtD()}>YtD</Button></div>
              </Col>
            </Row>
            <Row  className="pb-2">
              <Col>
                <BudgetNavBar year={this.props.filters.selectedYear} activeTab={this.props.uislice.selectedTab} dispatch={this.props.selectTab}/>
              </Col>
            </Row>
            <Row className="pb-2">
              <Col>{displayComponent}</Col>
            </Row>
        </Container>
        );
  
  }
}


export default connect(mapStateToProps, mapDispatchToProps)(App)

