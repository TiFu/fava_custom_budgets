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
})