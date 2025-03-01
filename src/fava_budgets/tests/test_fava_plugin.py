from fava_budgets.services.Loaders import BudgetLoader, ActualsLoader
from fava_budgets.fava_plugin import BudgetFavaPlugin
from fava.core import FavaLedger
import os
import unittest
from datetime import datetime
import json
import decimal

class TestFavaPlugin(unittest.TestCase):

    def setUp(self):
        path = os.path.abspath("../../resources/beancount_inc_exp/main.bean")
        ledger = FavaLedger(path)

        self.favaPlugin = BudgetFavaPlugin(ledger)
        self.favaPlugin.ledger = ledger
        self.favaPlugin.after_load_file()

        path = os.path.abspath("../../resources/beancount_assets/main.bean")
        ledger = FavaLedger(path)
        self.assetFavaPlugin = BudgetFavaPlugin(ledger)
        self.assetFavaPlugin.ledger = ledger
        self.assetFavaPlugin.after_load_file()

    def _validate(self, expected, result):
        currentYear = datetime.now().year
        for i in range(2023, currentYear+1):
            self.assertTrue(i in result, "Year "+ str(i) + " not found in result...")

        for year in range(2023, currentYear + 1):
            arr = expected[year-2023]
            for i in range(len(arr)):
                self.assertEqual(arr[i], result[year][i+1])


    def test_bootstrapIncomeExpenseBudget_budgetIncome(self):
        result = self.favaPlugin.bootstrapIncomeExpenseBudget()
        result = result["budgets"]["Income"]["Income"]
        expected = [
            [5100, 5100, 5100, 5100, 5100, 5100, 5100, 5100, 5100, 5100, 5100, 15100],
            [7100, 7100, 7100, 7100, 7100, 7600, 7100, 7100, 7100, 7100, 7100, 27100],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ]
        self._validate(expected, result)

    def test_bootstrapIncomeExpenseBudget_budgetExpenses(self):
        result = self.favaPlugin.bootstrapIncomeExpenseBudget()

        # Check "Income" account as top most account
        result = result["budgets"]["Expenses"]["Expenses"]

        expected = [
            [800, 800, 750, 800, 850, 800,3800,800,800,800,800,800],
            [1000,1000,1000,1000,1050,1000,4050,1100,1100,1100,1100,1100],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ]
        self._validate(expected, result)


    def test_bootstrapIncomeExpenseBudget_actualsIncome(self):
        result = self.favaPlugin.bootstrapIncomeExpenseBudget()
        result = result["actuals"]["Income"]["Income"]
        expected = [
            [5300] * 12,
            [6753] * 12,
            [0] * 12,
        ]
        expected[0][11] += 9583 # Bonus

        self._validate(expected, result)
    def test_bootstrapIncomeExpenseBudget_actualsExpenses(self):
        result = self.favaPlugin.bootstrapIncomeExpenseBudget()
        class SetEncoder(json.JSONEncoder):
            def default(self, obj):
                if isinstance(obj, set):
                    return list(obj)
                if isinstance(obj, decimal.Decimal):
                    return float(obj)
                return json.JSONEncoder.default(self, obj)

        data_str = json.dumps(result, cls=SetEncoder, indent=4)
        print(data_str)


        result = result["actuals"]["Expenses"]["Expenses"]
        expected = [
            [480+335] * 12,
            [335+475] * 12,
            [0] * 12,
        ]
        expected[0][0] += 2000 # Bonus
        expected[1][9] += 8000 # Bonus

        self._validate(expected, result)
 
    def test_bootstrapAssetBudget(self):
        assetBudget = self.assetFavaPlugin.bootstrapAssetBudget()
        class SetEncoder(json.JSONEncoder):
            def default(self, obj):
                if isinstance(obj, set):
                    return list(obj)
                if isinstance(obj, decimal.Decimal):
                    return float(obj)
                return json.JSONEncoder.default(self, obj)

        data_str = json.dumps(assetBudget, cls=SetEncoder, indent=4)
        #print(data_str)

        for entry in ["budgetBalance", "accountBalance", "accounts", "budgets"]:
            self.assertTrue(entry in assetBudget, "Expected " + entry + " to be present in " + str(assetBudget.keys()))

