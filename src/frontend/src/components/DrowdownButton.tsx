import * as React from 'react';
import { DropdownButton, Dropdown } from 'react-bootstrap';

interface Props {
    selectedYear: string
    years: Array<string>
    onSelect: (year: string | null) => void
}

class BudgetDropdown extends React.Component<Props, {}> {

  render() {
    let entries = []
    for (let year of this.props.years) {
        entries.push(
            <Dropdown.Item eventKey={year} key={year}>{year}</Dropdown.Item>
        )

    }

    return     <DropdownButton className="pe-2" style={{float: "left"}} title={this.props.selectedYear}
                    onSelect={(selectedKey) => this.props.onSelect(selectedKey)}>
                {entries}
        </DropdownButton>
  }

}

export default BudgetDropdown;