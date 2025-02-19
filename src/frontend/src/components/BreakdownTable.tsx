import * as React from 'react';
import { MonthType, convertToMonthName, formatMoney } from '../util';
import { BreakdownTableData } from '../view_model/BreakdownTableData';
import { MonthMap } from '../data_model/common';

interface BaseProps {
    breakdowntable: BreakdownTableData
    actualName: string
    showNameAsTitle?: boolean
}

type Props = BaseProps

class BreakdownTable extends React.Component<Props, {}> {

  prepareHeaders() {
    let headers: any = []
    if (!this.props.showNameAsTitle) {
      headers.push(<th style={{width: "200px"}} key="name">{this.props.breakdowntable.budgetName}</th>)
    } else {
      headers.push(<th style={{width: "200px"}} key="name"></th>)
    }

    let length = (this.props.breakdowntable.budget || this.props.breakdowntable.actual || []).length
    for (let i = 1; i <= length; i++) {
        headers.push(<th style={{textAlign: "right"}} key={"month" + i}>{convertToMonthName(i as MonthType)}</th>)
    }
    return headers
  }

  monthMapToCells(key: string, month: Array<any>) {
    let cells: any = []
    for (let i = 0; i < month.length; i++) {
        cells.push(<td style={{textAlign: "right"}}  key={key + "_" + i}>{month[i as MonthType]}</td>)
    }
    return cells;
  }

  prepareBreakdownRow(name: string, month: Array<number>, indent=0) {
    let indentStr = " ".repeat(indent * 4)
    let title = <td><pre>{indentStr}{name}</pre></td>
    let moneyStr = month.map(x => formatMoney(x))
    return <tr>{title}{this.monthMapToCells(name, moneyStr)}</tr>
  }

  prepareEntries() {
    let output: any = []
    if (this.props.breakdowntable.budget)
      output.push(this.prepareBreakdownRow("Budget", this.props.breakdowntable.budget, 0))
    output.push(this.prepareBreakdownRow(this.props.actualName, this.props.breakdowntable.actual, 0))
    for (let rowName in this.props.breakdowntable.actualBreakdown) {
        output.push(this.prepareBreakdownRow(rowName, this.props.breakdowntable.actualBreakdown[rowName], 1))
    }
    return output
  }

  render() {

    let header: React.JSX.Element | null = <h3>{this.props.breakdowntable.budgetName}</h3>
    if (!this.props.showNameAsTitle) {
      header = null
    }

    return <div>{header}<table style={{width: "100%"}}>
        <thead>
        <tr>{this.prepareHeaders()}</tr>
        </thead>
        <tbody>
        {this.prepareEntries()}
        </tbody>
    </table></div>
  }

}

export default BreakdownTable;