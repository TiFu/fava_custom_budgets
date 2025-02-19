import * as React from 'react';
import { formatMoney, formatWithTabs, formatPercentage } from '../../util'
import { ExclamationOctagonFill } from 'react-bootstrap-icons';
import { AnnualComparison, AnnualSummary } from '../../services/IncomeExpenseBudgetService';
import { BudgetActualComparisonData, BudgetSummary, BudgetSummaryData } from '../../view_model/BudgetActualComparisonData';
import { BudgetActualComparisonSummary } from '../../view_model/BudgetActualComparisonData';
import { LineItem } from '../../view_model/BudgetActualComparisonData';
type TableRow = React.JSX.Element

interface BaseProps {
    actionHandler?: ActionHandler
    type: string
}

interface SummaryProps extends BaseProps {
    summary: BudgetSummary
}

interface ComparisonProps extends BaseProps {
    comparison: BudgetActualComparisonSummary    
}

interface ActionHandler {
    onSelectAccount: (account: string) => void
    selectedAccount: string
}

interface RowCreator {
    getTableRow(lineItem: LineItem): TableRow
    getTableHeaders(): TableRow
    getRows(): Array<LineItem>
}

function getName(lineItem: LineItem) {
    return "  ".repeat(lineItem.hierarchyLevel) + lineItem.name
}

class SummaryRowCreator implements RowCreator {
    constructor(private summary: BudgetSummary, private type: string, private actionHandler: ActionHandler | undefined) {
    }

    getTableRow(lineItem: LineItem): TableRow {
        let entry = this.summary.comparison[lineItem.name]
        let name = getName(lineItem)
        let className = this.actionHandler?.selectedAccount == lineItem.name ? "bg-primary" : ""
        return <tr  key={lineItem.name} 
                    className={className}
                    onClick={(e) => this.actionHandler?.onSelectAccount(lineItem.name)}>
                <td>{name}</td>
                <td style={{textAlign: "right"}}>{formatMoney(entry.values)}</td>
            </tr>        
    }

    getTableHeaders(): TableRow {
        return <tr key="Header">
                <th>{this.type}</th>
                <th style={{textAlign: "right"}}>Budget</th>
            </tr>
    }

    getRows(): Array<LineItem> {
        return this.summary.lineItems
    }
}

class ComparisonRowCreator implements RowCreator {
    constructor(private comparison: BudgetActualComparisonSummary, private type: string, private actionHandler: ActionHandler | undefined) {

    }

    getTableHeaders(): TableRow {
        return <tr key="Header">
                <th>{this.type}</th>
                <th style={{textAlign: "right"}}>Budget</th>
                <th style={{textAlign: "right"}}>Actuals</th>
                <th style={{textAlign: "right"}}>Diff</th>
                <th></th>
            </tr>
    }

    getTableRow(lineItem: LineItem): TableRow {
        let entry = this.comparison.comparison[lineItem.name]
        let sign = entry.relativeDiff > 0 ? "+" : entry.relativeDiff < 0 ? "" : "±"
        let relativeString = sign + Math.round(entry.relativeDiff * 100) + "%"
        let warn = entry.warn ? <ExclamationOctagonFill color={"#dc3545"} /> : null
        let className = this.actionHandler?.selectedAccount == lineItem.name ? "bg-primary" : ""
        return <tr  key={lineItem.name}
                    className={className}
                    onClick={(e) => this.actionHandler?.onSelectAccount(lineItem.name)}>
                <td>{getName(lineItem)}</td>
                <td style={{textAlign: "right"}}>{formatMoney(entry.budget)}</td>
                <td style={{textAlign: "right"}}>{formatMoney(entry.actuals)}</td>
                <td style={{textAlign: "right"}}>{formatMoney(entry.absoluteDiff)} ({relativeString})</td>
                <td>{warn}</td>
            </tr>
    }

    getRows(): LineItem[] {
        return this.comparison.lineItems
    }
}

type Props = SummaryProps | ComparisonProps

class BudgetActualComparisonView extends React.Component<Props, {}> {

  getRowCreator(): RowCreator {
    if ("summary" in this.props)  {
        return new SummaryRowCreator(this.props.summary, this.props.type, this.props.actionHandler)
    } else if ("comparison" in this.props) {
        return new ComparisonRowCreator(this.props.comparison, this.props.type, this.props.actionHandler)
    } else {
        throw new Error("Now row creator found")
    }
  }

  getRow() {
    return <tr></tr>
  }

  render() {
    let rowCreator = this.getRowCreator()
    
    let accounts = rowCreator.getRows()
    let rows: Array<TableRow> = []

    for (const account of accounts) {
        let row = rowCreator.getTableRow(account)
        rows.push(row)
    }

    let headers = rowCreator.getTableHeaders()
    return <table style={{width: "100%"}}>
        <thead>
        {headers}
        </thead>
        <tbody>
        {rows}
        </tbody>
    </table>
  }

}

export default BudgetActualComparisonView;