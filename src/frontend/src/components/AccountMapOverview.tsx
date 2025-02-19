import * as React from 'react';
import { connect } from "react-redux";
import { formatMoney, formatWithTabs, calculateAnnualSum, MonthType, calculateYtDSum, formatPercentage } from '../util'
import { ArrowRight, ExclamationOctagonFill } from 'react-bootstrap-icons';
import { AnnualComparison, AnnualSummary } from '../services/IncomeExpenseBudgetService';

interface BaseProps{
    ytdMonth: MonthType
    actionHandler?: ActionHandler
}

interface SimpleSummaryProps extends BaseProps {
    overview: AnnualSummary
}

interface ComparisonProps extends BaseProps {
    diff: AnnualComparison
}

interface ActionHandler {
    onSelectAccount: (account: string) => void
    selectedAccount: string
}


type Props = SimpleSummaryProps | ComparisonProps

class AccountMapOverview extends React.Component<Props, {}> {

  getBaseActualsDiff(): [AnnualSummary, AnnualSummary | null, AnnualComparison | null, boolean] {
    let base = null
    let actuals = null;
    let diff = null;
    let showActualsAndDiff = false;

    if ("overview" in this.props) {
        base = this.props.overview
    } else if ("diff" in this.props) {
        base = this.props.diff.getBudget()
        actuals = this.props.diff.getActuals()
        diff = this.props.diff
        showActualsAndDiff = true
    } else {
        throw Error("Unknown prop type...")
    }

    return [base, actuals, diff, showActualsAndDiff]
  }

  render() {
    let [base, actuals, diff, showActualsAndDiff ] = this.getBaseActualsDiff()
    // Calculate account set to display
    let accounts = diff ? diff.getAccounts() : base.getAccounts()

    let entries = []

    for (const account of accounts) {
        let baseMoney = base?.getYtDSum(account, this.props.ytdMonth)
        let money = formatMoney(baseMoney)
        let accountStr = formatWithTabs(account)

        let columns = [
            <td key={account + "_account"}><pre>{accountStr}</pre></td>,
            <td key={account + "_money"}>{money}</td>
        ]

        if (showActualsAndDiff) {
            let actualsMoneyN = actuals?.getYtDSum(account, this.props.ytdMonth) as number
            let actualsMoney = formatMoney(actualsMoneyN)

            let absolute = diff?.getAbsoluteYtDDiff(account, this.props.ytdMonth)
            let relative = diff?.getRelativeYtDDiff(account, this.props.ytdMonth)
            let diffStr = formatMoney(absolute) + " (" + formatPercentage(relative) + ")"

            columns.push(<td key={account + "_actuals"}>{actualsMoney}</td>)
            columns.push(<td key={account + "_diff"}>{diffStr}</td>)

            let isBudgetExceeded = diff?.isBudgetExceeded(account, this.props.ytdMonth)

            if (isBudgetExceeded) {
                columns.push(<td key={account + "_attention"}><ExclamationOctagonFill color={"#dc3545"} /></td>)
            } else {
                columns.push(<td key={account + "_attention"}></td>)
            }

            if (Math.abs(actualsMoneyN) < 10e-9 && Math.abs(baseMoney) < 10e-9) {
                continue
            }
        } else {         
            if (Math.abs(baseMoney) < 10e-9) {
                continue
            }
        }

        let className = this.props.actionHandler?.selectedAccount == account ? "bg-primary" : ""
        entries.push(<tr key={account} className={className} onClick={(e) => this.props.actionHandler?.onSelectAccount(account)}>
            {columns}
        </tr>)
    }

    let headers = [<th key={"Account"}>Account</th>, <th key={"Budget"}>Budget</th>]
    if (showActualsAndDiff) {
        headers.push(<th key={"Actuals"}>Actuals</th>)
        headers.push(<th key={"Diff"}>Diff</th>)
        headers.push(<th key={"Warn"}></th>)
    }

    return <table style={{width: "100%"}}>
        <thead>
        <tr>{headers}</tr>
        </thead>
        <tbody>
        {entries}
        </tbody>
    </table>
  }

}

export default AccountMapOverview;