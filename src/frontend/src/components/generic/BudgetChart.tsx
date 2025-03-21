import * as React from 'react';
import * as Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official';
import { BudgetChartData } from '../../view_model/BudgetChartData';

let options = {
  title: {
    text: "Chart text"
  },
  legend: {
    align: 'left',
    verticalAlign: 'top',
    backgroundColor: 'white',
    borderColor: '#CCC',
    borderWidth: 1,
    shadow: false
  },
  chart: {
      type: 'column',
      height: 350
  },
  yAxis: {
    title: null,
    stackLabels: {
      enabled: true
    },
    min: 0,
    max: 20000
  },
  xAxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  },
  plotOptions: {
    column: {
        stacking: 'normal',
        dataLabels: {
            enabled: true
        }
    }
  },  
  series: [
    {   name: "Series 1",
        type: "column",
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
  data: BudgetChartData
}

class BudgetChart extends React.Component<Props, {}> {
  format(arr: Array<number>) {
    return arr.map(a => Math.round(a))
  }

  private cmp(a: {name: string, data: Array<number>}, b: {name: string, data: Array<number>}) {
    let aSum = a.data.reduce((pv, cv) => pv + cv, 0)
    let bSum = b.data.reduce((pv, cv) => pv + cv, 0)

    return bSum - aSum
  }

  private filterNonZero(a: {name: string, data: Array<number>}) {
    return Math.abs(a.data.reduce((pv, cv) => pv+cv, 0)) > 10e-9
  }
  formatChildren(arr: Array<{ name: string, data: Array<number>}>) {
    return arr.map(a => { return { name: a.name, type: "column", data: this.format(a.data)} }).filter(this.filterNonZero).sort(this.cmp)
  }
  render() {
    let data = this.props.data
    let actuals = data.actuals
    let budget = data.budget

    let childActuals = data.actualBreakdown
    let formattedChildActuals = childActuals.length > 0 ? this.formatChildren(childActuals) : [{ name: data.chartName, type: "column", data: this.format(actuals)}]

    const chart = structuredClone(options)
    chart.yAxis.max = Math.max(...actuals,...budget)
    chart.yAxis.min = Math.min(0,...actuals, ...budget)
    chart.title.text = data.chartName
    //chart.series[0].name = this.props.seriesName
    //chart.series[0].data =  this.formatChildren(childActuals)

    let budgetMarker = chart.series[1]
    budgetMarker["data"] = this.format(budget)
    chart.series = [...formattedChildActuals, budgetMarker]

    console.log("Chart ", chart)
    return <div><HighchartsReact highcharts={Highcharts} options={chart} /></div>
  }

}

export default BudgetChart;