import * as React from 'react';
import { LoadStatus } from '../model';
import { connect } from "react-redux";

export interface Props {
  name: string;
  enthusiasmLevel?: number;
  onIncrement?: () => void;
  onDecrement?: () => void;
}

interface HelloProps {
  status: LoadStatus
}

class Hello extends React.Component<HelloProps, {}> {

  render() {
    return <div>{this.props.status}</div>
  }

}

export default Hello;