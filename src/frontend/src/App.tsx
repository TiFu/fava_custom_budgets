import Hello from './components/Hello';
//import Hello from './components/Hello';
import * as React from 'react';

import {RootState} from './store/index'
import { connect } from "react-redux";
import AnnualBudgetChart from './components/AnnualBudgetChart';
import BudgetOverview from './components/BudgetOverview'
import BudgetNavBar from './components/TabPane';
import BudgetDropdown from './components/DrowdownButton';
import { extractYears } from './util';
import { selectYear } from './features/filters';
import { selectTab } from './features/uistate';
import BudgetComparison from './components/BudgetComparison';
//import { fetchBudget } from './features/budgets'

function mapStateToProps(state: RootState) {
  return state
}

function mapDispatchToProps(dispatch: any) {
  return {
    selectYear: (e: string) => dispatch(selectYear(e)),
    selectTab: (e: string) => dispatch(selectTab(e))
  };
};


type PropState = RootState & ReturnType<typeof mapDispatchToProps>

class App extends React.Component<PropState, {}>  {

  getOverviewDisplayComponent() {
    console.log("Overview: ", this.props.budget)
    return <BudgetOverview overview={this.props.budget.budgets.budgets} year={this.props.filters.selectedYear}/>
  }

  getYtdDisplayComponent() {
    return <div></div>
  }

  getAnnualDisplayComponent() {
    return <BudgetComparison summary={this.props.budget.budgets} year={this.props.filters.selectedYear}/>
  }

  render() {
    console.log("App: ", this.props.budget.budgets)
    let years = extractYears(this.props.budget.budgets.actuals)
    
    let displayComponent = null

    switch (this.props.uislice.selectedTab) {
      case "overview":
        displayComponent = this.getOverviewDisplayComponent()

        break;
      case "ytd":
        displayComponent = this.getYtdDisplayComponent()
        break;
      case "annual": 
        displayComponent = this.getAnnualDisplayComponent()
        break;
    }

    return (
        <div>
          <div className="pb-2">
            <BudgetDropdown years={years} selectedYear={this.props.filters.selectedYear} onSelect={(e) => this.props.selectYear(e as any)}/>
          </div>
          <div>
          <BudgetNavBar activeTab={this.props.uislice.selectedTab} dispatch={this.props.selectTab}/>
          </div>
          <div className="pt-2">
            {displayComponent}
          </div>
        </div>
    );
  
  }
}


export default connect(mapStateToProps, mapDispatchToProps)(App)

