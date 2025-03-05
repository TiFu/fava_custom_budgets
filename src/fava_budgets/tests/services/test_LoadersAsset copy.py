from fava_budgets.services.Loaders import BudgetLoader, ActualsLoader, AssetBudgetLoader, FavaLedgerHelper

from fava.core import FavaLedger
import os
import unittest
import decimal

class TestAssetLoader(unittest.TestCase):

    def setUp(self):
        pass

    def _loadSimpleCase(self):
        return self._loadCase("../../resources/beancount_assets/main.bean")
        
    def _loadAssetBudgetErrorCase(self):
        return self._loadCase("../../resources/beancount_assets/error_incorrect_asset_budget.bean")

    def _loadCase(self, file):
        assetPath = os.path.abspath(file)
        assetLedger = FavaLedger(assetPath)
        helper = FavaLedgerHelper(assetLedger)
        result = AssetBudgetLoader().loadLedger(helper)
        return result

#            if entry.type == "asset_budget_once":
#                parseErrors = self._parseAssetBudgetOnce(entry)
#                errors.extend(parseErrors)
#            elif entry.type == "asset_budget": 
#                parseErrors = self._parseAssetBudget(entry)
#                errors.extend(parseErrors)
#            elif entry.type == "asset_budget_appreciation":
#                parseErrors = self._parseAssetBudgetAppreciation(entry)
#                errors.extend(parseErrors)
    def test_asset_budget_errors(self):
        result = self._loadAssetBudgetErrorCase()

        self.assertEqual(len(result["errors"]), 2)        

    def test_asset_budget_budgeted_accounts(self):
        result = self._loadSimpleCase()

        self.assertEqual(len(result["errors"]), 0)

        self.assertTrue("accounts" in result)
        for account in ["Assets:Brokerage", "Assets:Foreign-currency-deposit", "Assets:Fixed-Deposits"]:
            self.assertTrue(account in result["accounts"], str(account) + " not in " + str(result["accounts"]))

    def test_asset_budget_budgeted_trx(self):
        result = self._loadSimpleCase()

        self.assertTrue("budgetedTransactions" in result)
        trx = result["budgetedTransactions"]
        self.assertEqual(3, len(trx), "Found " + str(len(trx)) + " transactions, although only 3 were expected")

    def test_asset_budget_values(self):
        result = self._loadSimpleCase()

        self.assertTrue("budget" in result)
        budget = result["budget"]
        self._checkBudget(budget, "saving-goal-1", 2023, 1, 300)
        self._checkBudget(budget, "saving-goal-1", 2023, 12, 12*300+50)


    def test_asset_budget_appreciation(self):
        result = self._loadSimpleCase()

        self.assertTrue("budget" in result)
        budget = result["budget"]
        interest = 1+0.03/12
        self._checkBudget(budget, "saving-goal-3", 2022, 12, 2000)
        self._checkBudget(budget, "saving-goal-3", 2023, 1, 2000*interest + 400)
        self._checkBudget(budget, "saving-goal-3", 2023, 2, (2000*interest + 400)*interest + 400)
        self._checkBudget(budget, "saving-goal-3", 2023, 3, ((2000*interest + 400)*interest + 400)*interest +400)

    def test_asset_budget_once(self):
        result = self._loadSimpleCase()

        self.assertTrue("budget" in result)
        budget = result["budget"]
        self._checkBudget(budget, "saving-goal-2", 2023, 1, 0)
        self._checkBudget(budget, "saving-goal-2", 2023, 6, 2000)
        self._checkBudget(budget, "saving-goal-2", 2023, 8, 2000)


    def _checkBudget(self, budget, name, year, month, expected):
        expected = decimal.Decimal(expected)
        self.assertAlmostEqual(expected, budget.getValue(name, year, month))
