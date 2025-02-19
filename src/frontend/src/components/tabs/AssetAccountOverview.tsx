import * as React from 'react';
import {Row, Col, Container} from 'react-bootstrap'
import BreakdownTable from '../BreakdownTable';
import { AssetBudgetService } from '../../services/AssetBudgetService';
import { MonthType } from '../../util';

interface Props {
    overview: AssetBudgetService
    year: string
    ytd: MonthType
}

class AssetAccountOverview extends React.Component<Props, {}> {

    constructor(props: Props) {
        super(props)
    }


  render() {
    if (!this.props.overview)
        return <div>No budget loaded yet...</div>

    let accs = this.props.overview.getAccounts()
    console.log("Accounts: "+ accs)
    let tables: Array<any> = []
    for (let account of accs) {
        let table = this.props.overview.getBreakdownTableByBudget(account, this.props.year, this.props.ytd)
        tables.push(<BreakdownTable showNameAsTitle key={account} breakdowntable={table} actualName="Actuals" />)
    }
    
    let rows: Array<any> = []
    for (let i = 0; i < tables.length; i+=2) {
        let table1 = tables[i]
        let table2 = i+1 < tables.length ? tables[i+1] : null
        rows.push(<Row key={"" +i} className="border-top border-light pt-4 pb-4">
                <Col sm={6} md={6} xl={6}>{table1}</Col>
                <Col sm={6} md={6} xl={6}>{table2}</Col>
            </Row>)
    }

    return <Container fluid className="p-0">
            {rows}
        </Container>
  }
}

export default AssetAccountOverview;