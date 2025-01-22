import * as React from 'react';
import { ExpenseIncomeMap, AccountMap, LoadStatus } from '../model';
import { connect } from "react-redux";
import { formatMoney, formatWithTabs, calculateAnnualSum } from '../util'
import { ArrowRight, ExclamationOctagonFill } from 'react-bootstrap-icons';

interface SimpleProps {
    overview: AccountMap
    year: string
}

interface ComparisonProps extends SimpleProps {
    overview: AccountMap
    year: string
    actuals: AccountMap
    isExpense: boolean
}


type Props = SimpleProps | ComparisonProps

class AccountMapOverview extends React.Component<Props, {}> {

  getAccountsSorted(): Array<string> {
    let accountSet = new Set<string>()
    Object.keys(this.props.overview).forEach(e => accountSet.add(e))
    if ("actuals" in this.props) {
        Object.keys(this.props.actuals).forEach(e => accountSet.add(e))
    }
    let accounts = Array.from(accountSet)
    accounts.sort()
    return accounts

  }

  getMoneyString(map: AccountMap, account: string, year: string) {
    let money = "N/A"
    if (account in map && year in map[account]) {
        let moneySum = calculateAnnualSum(map[account][year])
        money = formatMoney(moneySum)
    }
    return money
  }

  getDiffString(budget: AccountMap, actuals: AccountMap, account: string, year: string) {
    if (!(account in budget && year in budget[account])) {
        return [0 , 0, "N/A"]
    }

    if (!(account in actuals && year in actuals[account])) {
        return [0, 0, "N/A"]
    }
    let budgetSum = calculateAnnualSum(budget[account][year])
    let actualsSum = calculateAnnualSum(actuals[account][year])

    let absoluteDiff = actualsSum - budgetSum
    let relativeDiff = Math.round(absoluteDiff / budgetSum * 100) // Percentage conversion
    
    return [absoluteDiff, relativeDiff, formatMoney(absoluteDiff) + " (" + relativeDiff + "%)"]

  }

  render() {
    console.log("Account Map overview", this.props.overview)
    let absoluteLimit = 200
    let relativeLimit = 5

    // Calculate account set to display
    let accounts = this.getAccountsSorted()

    let entries = []
    for (const account of accounts) {
        let money = this.getMoneyString(this.props.overview, account, this.props.year) 
        let accountStr = formatWithTabs(account)

        let columns = [
            <td key={account + "_account"}><pre>{accountStr}</pre></td>,
            <td key={account + "_money"}>{money}</td>
        ]

        if ("actuals" in this.props) {
            let actuals = this.getMoneyString(this.props.actuals, account, this.props.year)
            let [absolute, relative, diffStr] = this.getDiffString(this.props.overview, this.props.actuals, account, this.props.year)
            columns.push(
                <td key={account + "_actuals"}>{actuals}</td>
            )
            columns.push(
                <td key={account + "_diff"}>{diffStr}</td>
            )

            let attentionCondition = (relative as number) > relativeLimit || (absolute as number) > absoluteLimit
            if (!this.props.isExpense) {
                attentionCondition = (relative as number) < relativeLimit * -1 || (absolute as number) < absoluteLimit * -1
            }

            if (attentionCondition) {
                columns.push(
                    <td key={account + "_attention"}><ExclamationOctagonFill color={"#dc3545"} /></td>
                )
            } else {
                columns.push(
                    <td key={account + "_attention"}></td>
                )
            }
        }
        entries.push(<tr key={account}>
            {columns}
        </tr>)
    }

    let headers = [<th>Account</th>, <th>Budget</th>]
    if ("actuals" in this.props) {
        headers.push(<th>Actuals</th>)
        headers.push(<th>Diff</th>)
        headers.push(<th></th>)
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