import { AssetBudget } from "../../src/data_model/AssetBudget";
import { AssetBudgetService } from "../../src/services/AssetBudgetService";
import { api } from '../resources/api_asset_budget'
import {beforeEach, describe, expect, test} from '@jest/globals';



describe("AssetBudgetService", () => {
    let service: AssetBudgetService = new AssetBudgetService(api as AssetBudget);

    test("getChart", () => {
        const budget = "saving-goal-1"
        let chart = service.getChart(budget, "2023", 12)

        expect(chart.chartName).toBe(budget)
        expect(chart.actuals).toEqual([
            0,    0,    0,    0,
            0,    0,    0,    0,
            0, 3000, 3000, 3000  
        ])

        expect(chart.budget).toEqual([
            300,  650,  950,
            1250, 1550, 1850,
            2150, 2450, 2750,
            3050, 3350, 3650
        ])

        expect(chart.minYAxis).toEqual(0)
        expect(chart.maxYAxis).toEqual(4015)

        expect(chart.actualBreakdown).toEqual([
            {
                name: "Assets:Fixed-Deposits", 
                data: [0 ,0 ,0 ,0 ,0 ,0 ,0 ,0 ,0 ,3000, 3000, 3000]
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

    test("getBudgetActualComparisonSummary", () => {
        let summary = service.getBudgetActualComparisonSummary("2023", 12)

        expect(summary.lineItems.length).toEqual(3)

        let expected: any = {
            'saving-goal-3': {
                budget: 6927,
                actuals: 6000,
                warn: true,
                absoluteDiff: -927,
                relativeDiff: -0.13382416630576008
            },
            'saving-goal-1': {
                budget: 3650,
                actuals: 3000,
                warn: true,
                absoluteDiff: -650,
                relativeDiff: -0.1780821917808219
            },
            'saving-goal-2': {
                budget: 2000,
                actuals: 2000,
                warn: false,
                absoluteDiff: 0,
                relativeDiff: 0
            }
        }


        for (let budget of ["saving-goal-1", "saving-goal-2", "saving-goal-3"]) {
            const exp = expected[budget]
            const res = summary.comparison[budget]
            for (let key in exp) {
                expect((res as any)[key]).toEqual(exp[key])
            }
        }
    })

    test("getAnnualChart", () => {
        // saving-goal-3 has a 3% appreciation directive - the annual chart must show the flat,
        // non-compounded monthly contribution plan (400/month) instead of the compounded lifetime plan.
        const budget = "saving-goal-3"
        let chart = service.getAnnualChart(budget, "2023", 12)

        expect(chart.chartName).toBe(budget)
        expect(chart.actuals).toEqual([
            0,    0,    0,    0,
            0,    0,    0,    0,
            0, 6000, 6000, 6000
        ])

        expect(chart.budget).toEqual([
            400,  800,  1200,
            1600, 2000, 2400,
            2800, 3200, 3600,
            4000, 4400, 4800
        ])

        expect(chart.minYAxis).toEqual(0)
        expect(chart.maxYAxis).toEqual(6600)

        // Unlike the lifetime chart, the annual chart omits the per-account breakdown so that
        // mixed-sign contributions within a year don't render as conflicting stacked segments.
        expect(chart.actualBreakdown).toEqual([])
    })

    test("getAnnualBudgetActualComparisonSummary", () => {
        let summary = service.getAnnualBudgetActualComparisonSummary("2023", 12)

        expect(summary.lineItems.length).toEqual(3)

        let expected: any = {
            // Unlike the lifetime comparison, saving-goal-3's annual plan (4800) is not
            // compounded with appreciation, so actuals now exceed the plan instead of trailing it.
            'saving-goal-3': {
                budget: 4800,
                actuals: 6000,
                absoluteDiff: 1200,
                relativeDiff: 0.25
            },
            'saving-goal-1': {
                budget: 3650,
                actuals: 3000,
                absoluteDiff: -650,
                relativeDiff: -0.1780821917808219
            },
            'saving-goal-2': {
                budget: 2000,
                actuals: 2000,
                absoluteDiff: 0,
                relativeDiff: 0
            }
        }

        for (let budget of ["saving-goal-1", "saving-goal-2", "saving-goal-3"]) {
            const exp = expected[budget]
            const res = summary.comparison[budget]
            for (let key in exp) {
                expect((res as any)[key]).toEqual(exp[key])
            }
        }
    })
})