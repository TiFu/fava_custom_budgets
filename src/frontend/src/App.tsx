import './App.css';
import Hello from './components/Hello';
//import Hello from './components/Hello';
import * as React from 'react';

import store from './store/index'
import {RootState} from './store/index'
import { Provider } from 'react-redux';
import { connect } from "react-redux";

class App extends React.Component<RootState, {}>  {

  render() {
    return (
      <Provider store={store}>
        <div>
          <Hello status={this.props.budget.status}></Hello>
        </div>
      </Provider>
    );
  
  }
}

function mapStateToProps(state: RootState) {
  return state
}

export default connect(mapStateToProps)(App)

