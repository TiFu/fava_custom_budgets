import { IncomeExpenseBudgetService } from "../../src/services/IncomeExpenseBudgetService";
import { api } from '../resources/api_inc_exp'
import {beforeEach, describe, expect, test} from '@jest/globals';



describe("IncomeExpenseBudgetService", () => {
    let service: IncomeExpenseBudgetService = new IncomeExpenseBudgetService(api);

    test("getChart", () => {
        const acc = "Income:Work"
        let chart = service.getChart(acc, "2023", 12)
        expect(chart.chartName).toBe(acc)
        expect(chart.actuals).toEqual([
            5300, 5300,  5300,
            5300, 5300,  5300,
            5300, 5300,  5300,
            5300, 5300, 14883
        ])

        expect(chart.budget).toEqual([
            5000, 5000,  5000,
            5000, 5000,  5000,
            5000, 5000,  5000,
            5000, 5000, 15000    
        ])

        expect(chart.minYAxis).toEqual(0)
        expect(chart.maxYAxis).toEqual(15000)

        expect(chart.actualBreakdown).toEqual([
            {
                name: "Income:Work:Bonus", 
                data: [0 ,0 ,0 ,0 ,0 ,0 ,0 ,0 ,0 ,0 ,0, 9583]
            },
            {
                name: "Income:Work:Salary", 
                data: [5300, 5300, 5300, 5300, 5300, 5300, 5300, 5300, 5300, 5300, 5300, 5300]
            }
        ])
        
        let sumArray = chart.actualBreakdown.reduce((prev, val) => {
                for (let i = 0; i < val.data.length; i++) {
                    prev.data[i] += val.data[i]
                }
                return prev
        }, {
            name: "all",
            data: [0, 0, 0,0, 0, 0,0, 0, 0,0, 0, 0]
        })

        expect(sumArray.data).toEqual(chart.actuals)
    })

    test("getBudgetExpenseSummary", () => {
        const result = service.getBudgetExpenseSummary("2024", 7)
        
        expect(result.lineItems.length).toBe(4)
        
        for (let entry of [ ["Expenses", 10100], ["Expenses:Groceries", 2850], ["Expenses:Public-Transportation", 4250], ["Expenses:Travel", 3000]]) {
            expect(result.summary[entry[0]].values).toEqual(entry[1])
        }

        const expenses = result.summary["Expenses"]
        const expBreakdown = expenses.valueBreakdown
        let sum = 0
        for (let entry in expBreakdown) {
            sum += expBreakdown[entry]
        }

        expect(sum).toEqual(expenses.values)
    })

    test("getBudgetIncomeSummary", () => {
        const result = service.getBudgetIncomeSummary("2024", 5)
        console.log(result)
        expect(result.lineItems.length).toBe(4)
        
        // Note: Income budget has 100/month on top on "Income" account level
        for (let entry of [ ["Income", 35500], ["Income:Work", 35000], ["Income:Work:Bonus", 0], ["Income:Work:Salary", 35000]]) {
            expect(result.summary[entry[0]].values).toEqual(entry[1])
        }

        // TODO: the value break-down needs to consider the "current" account as well (if there's separate income!)
        const expenses = result.summary["Income"]
        const expBreakdown = expenses.valueBreakdown
        let sum = 0
        for (let entry in expBreakdown) {
            sum += expBreakdown[entry]
        }

        expect(sum).toEqual(expenses.values)

    })

    test("getExpenseComparison", () => {
        const comp = service.getExpenseComparison("2023", 12)

        expect(comp.lineItems.length).toBe(4)

        const expected = {
            budget: 12600,
            actuals: 11780,
            absoluteDiff: -820,
            relativeDiff: -0.06507936507936508,
            warn: false
        }

        for (let key in expected) {
            const val: any = (expected as any)[key]
            const cmp: any = (comp.comparison["Expenses"] as any)[key]
            expect(cmp).toEqual(val)
        }

        // TODO: this looks like an error
        //console.log(comp.comparison["Expenses"].actualBreakdown)
        //expect(false).toBe(true)
    })

    test("getIncomeComparison", () => {
        const comp = service.getIncomeComparison("2023", 12)

        expect(comp.lineItems.length).toBe(4)

        const expected = {
            budget: 71200,
            actuals: 73183,
            absoluteDiff: 1983,
            relativeDiff: 0.02785112359550562,
            warn: false,
          }

        for (let key in expected) {
            const val: any = (expected as any)[key]
            const cmp: any = (comp.comparison["Income"] as any)[key]
            expect(cmp).toEqual(val)
        }

        // TODO: this looks like an error
        //console.log(comp.comparison["Income"].actualBreakdown)
        //expect(false).toBe(true)
    })


    test("getIncExpProfitBudget", () => {
        const result = service.getIncExpProfitBudget("2023", 6)
        expect(result.budget.expenses).toBe(4800)
        expect(result.budget.income).toBe(30600)
        expect(result.budget.profit).toBe(25800)
    })

    test("getIncExpProfitSummary", () => {
        const result = service.getIncExpProfitSummary("2023", 6)
        expect(result.budget.expenses).toBe(4800)
        expect(result.budget.income).toBe(30600)
        expect(result.budget.profit).toBe(25800)

        expect(result.actuals?.expenses).toBe(6890)
        expect(result.actuals?.income).toBe(31800)
        expect(result.actuals?.profit).toBe(24910)

    })

})