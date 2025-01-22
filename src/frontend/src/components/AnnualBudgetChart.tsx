import * as React from 'react';
import { ExpenseIncomeMap, AccountMap, LoadStatus, AnnualMap } from '../model';
import { connect } from "react-redux";
import { formatMoney, formatWithTabs, calculateAnnualSum, monthMapToArray } from '../util'
import * as Highcharts from 'highcharts'
import { HighchartsReact } from 'highcharts-react-official';
import { MonthMap } from '../model';

let options = {
  title: {
    text: "Chart text"
  },
  legend: {
    enabled: false
  },
  chart: {
      type: 'column',
      height: 250
  },
  yAxis: {
    title: null,
    min: 0,
    max: 20000
  },
  xAxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  },
  series: [
    {   name: "Series 1",
        dataLabels: {
          enabled: true
        },
        data: [29.9, 71.5, 106.4, 129.2, 144.0, 176.0, 135.6, 148.5, 216.4, 194.1, 95.6, 54.4]
    }, 
    {
      marker: {
        symbol: 'c-rect',
        lineWidth: 3,
        lineColor: "#dc3545",
        fillColor: "#dc3545"
      },
      dataLabels: {
        enabled: true
      },
      type: 'scatter',
      name: "Budget",
      data: [29.9, 71.5, 106.4, 129.2, 144.0, 176.0, 135.6, 148.5, 216.4, 194.1, 95.6, 54.4].reverse()
  }
  ]
};

interface Props {
  actuals: MonthMap
  budget: MonthMap
  seriesName: string
  maxYAxis: number
  minYAxis: number
}

class AnnualBudgetChart extends React.Component<Props, {}> {

  render() {
    const chart = structuredClone(options)
    chart.yAxis.max = this.props.maxYAxis
    chart.yAxis.min = this.props.minYAxis
    chart.title.text = this.props.seriesName
    chart.series[0].name = this.props.seriesName
    chart.series[0].data =  monthMapToArray(this.props.actuals)

    chart.series[1]["data"] = monthMapToArray(this.props.budget)

    return <HighchartsReact highcharts={Highcharts} options={chart} />
  }

}

export default AnnualBudgetChart;