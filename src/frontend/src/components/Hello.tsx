import * as React from 'react';
import { LoadStatus } from '../model';
import { connect } from "react-redux";

interface HelloProps {
  status: LoadStatus,
  onLoadBudget: () => void
}

class Hello extends React.Component<HelloProps, {}> {

  render() {
    return <div>Loading state: {this.props.status}<button type="button" onClick={(e) => this.props.onLoadBudget()}>Load budgets</button></div>
  }

}

export default Hello;