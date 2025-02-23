from fava_budgets.services.Loaders import BudgetLoader, ActualsLoader, AssetBudgetLoader, FavaLedgerHelper

from fava.core import FavaLedger
import os
import unittest

class TestLoaders(unittest.TestCase):

    def setUp(self):
        path = os.path.abspath("../../resources/beancount_inc_exp/main.bean")
        self.ledger = FavaLedger(path)

        assetPath = os.path.abspath("../../resources/beancount_assets/main.bean")
        self.assetLedger = FavaLedger(assetPath)

    def test_asset_loader(self):
        helper = FavaLedgerHelper(self.assetLedger)
        result = AssetBudgetLoader().loadLedger(helper)

        self.assertTrue("accounts" in result)
        for account in ["Assets:Brokerage", "Assets:Foreign-currency-deposit", "Assets:Fixed-Deposits"]:
            self.assertTrue(account in result["accounts"], str(account) + " not in " + str(result["accounts"]))

        self.assertTrue("budget" in result)
        budget = result["budget"]
        self.assertEqual(3300, budget.getValue("saving-goal-1", 2023, 1))
        self.assertEqual(3000 + 12*300 + 50, budget.getValue("saving-goal-1", 2023, 12))

        self.assertTrue("budgetedTransactions" in result)
        trx = result["budgetedTransactions"]
        self.assertEqual(3, len(trx), "Found " + str(len(trx)) + " transactions, although only 3 were expected")

    # TODO: test with currency conversions as well... EUR vs others
    # TODO: make currency configurable
    def test_actuals_loader_expenses(self):
        actualsLoader = ActualsLoader("EUR", "Expenses")
        result = actualsLoader.loadLedger(self.ledger)

        self.assertEqual(480, result.getValue("Expenses:Public-Transportation", 2023, 4))
        self.assertEqual(480*12, result.getYtDSummary("Expenses:Public-Transportation", 2023, 12))
        self.assertEqual(475*4, result.getYtDSummary("Expenses:Public-Transportation", 2024, 4))

        self.assertEqual(0, result.getYtDSummary("Expenses:Public-Transportation", 2025, 4))
        self.assertEqual(0, result.getYtDSummary("Expenses:Public-Transportation", 1993, 4))

    def test_budget_loader(self):
        budgetLoader = BudgetLoader()
        result = budgetLoader.loadLedger(self.ledger)
        self.assertTrue("Income" in result, "Key Income not present in result")
        self.assertTrue("Expenses" in result, "Key Income not present in result")

        # Validate income
        incSummary = result["Income"]

        # Test defined budget for Salary
        self.assertEqual(5000, incSummary.getValue("Income:Work:Salary", 2023, 1))
        self.assertEqual(7000, incSummary.getValue("Income:Work:Salary", 2024, 3))

        # Test not defined budget for Salary
        self.assertEqual(0, incSummary.getValue("Income:Work:Salary", 2025, 3))
        self.assertEqual(0, incSummary.getValue("Income:Work:Salary", 1993, 3))

        # Test bonus
        self.assertEqual(0, incSummary.getValue("Income:Work:Bonus", 2023, 5))
        self.assertEqual(10000, incSummary.getValue("Income:Work:Bonus", 2023, 12))
        self.assertEqual(0, incSummary.getValue("Income:Work:Bonus", 2024, 7))
        self.assertEqual(20000, incSummary.getValue("Income:Work:Bonus", 2024, 12))

        # Test sum up account
        self.assertEqual(15000, incSummary.getValue("Income:Work", 2023, 12))
        self.assertEqual(5100, incSummary.getValue("Income", 2023, 4))

        #  Test YtD summary
        self.assertEqual(5000*5, incSummary.getYtDSummary("Income:Work:Salary", 2023, 5))
        self.assertEqual(7000*7 + 500, incSummary.getYtDSummary("Income:Work:Salary", 2024, 7))

        self.assertEqual(7000*12 + 500 + 20000, incSummary.getYtDSummary("Income:Work", 2024, 12))

        expSummary = result["Expenses"]

        self.assertEqual(500*6 - 50, expSummary.getYtDSummary("Expenses:Public-Transportation", 2023, 6))



        