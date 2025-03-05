from fava_budgets.services.Loaders import BudgetLoader, ActualsLoader, AssetBudgetLoader, FavaLedgerHelper

from fava.core import FavaLedger
import os
import unittest

class TestAssetLoader(unittest.TestCase):

    def setUp(self):
        assetPath = os.path.abspath("../../resources/beancount_assets/main.bean")
        self.assetLedger = FavaLedger(assetPath)

#            if entry.type == "asset_budget_once":
#                parseErrors = self._parseAssetBudgetOnce(entry)
#                errors.extend(parseErrors)
#            elif entry.type == "asset_budget": 
#                parseErrors = self._parseAssetBudget(entry)
#                errors.extend(parseErrors)
#            elif entry.type == "asset_budget_appreciation":
#                parseErrors = self._parseAssetBudgetAppreciation(entry)
#                errors.extend(parseErrors)

    def test_asset_budget(self):
        helper = FavaLedgerHelper(self.assetLedger)
        result = AssetBudgetLoader().loadLedger(helper)

        for e in result["errors"]:
            print(e)
            print()

        self.assertEqual(len(result["errors"]), 0)

        self.assertTrue("accounts" in result)
        for account in ["Assets:Brokerage", "Assets:Foreign-currency-deposit", "Assets:Fixed-Deposits"]:
            self.assertTrue(account in result["accounts"], str(account) + " not in " + str(result["accounts"]))

        self.assertTrue("budget" in result)
        budget = result["budget"]
        self.assertEqual(300, budget.getValue("saving-goal-1", 2023, 1))
        self.assertEqual(12*300 + 50, budget.getValue("saving-goal-1", 2023, 12))

        self.assertTrue("budgetedTransactions" in result)
        trx = result["budgetedTransactions"]
        self.assertEqual(3, len(trx), "Found " + str(len(trx)) + " transactions, although only 3 were expected")

        