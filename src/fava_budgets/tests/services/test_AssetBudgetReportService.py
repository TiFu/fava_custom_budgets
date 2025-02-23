from fava_budgets.services.Loaders import BudgetLoader, ActualsLoader, FavaLedgerHelper, AssetBudgetLoader
from fava_budgets.services.AssetBudgetReportService import AssetBudgetReportService

from fava.core import FavaLedger
import os
import unittest
from decimal import Decimal

class TestAssetBudgetReportService(unittest.TestCase):

    def setUp(self):
        self.reportService = self._getService("../../resources/beancount_assets/main.bean")
        self.errorReportService = self._getService("../../resources/beancount_assets/error.bean")

    def _getService(self, path):
        path = os.path.abspath(path)
        ledger = FavaLedger(path)
        helper = FavaLedgerHelper(ledger)
        budget = AssetBudgetLoader().loadLedger(helper)
        return AssetBudgetReportService(budget)

    def test_validate_successful(self):
        errors = self.reportService.validate()
        self.assertEqual(0, len(errors), "Expected to find 0 errors but found " + str(len(errors)))

        errors = self.errorReportService.validate()
        self.assertEqual(3, len(errors), "Expected to find 3 errors but found " + str(len(errors)))

    def test_getBudgetBalances(self):
        balances = self.reportService.getBudgetBalances()
        #print(balances)
        for entry in ["actual", "saving-goal-1", "saving-goal-2", "saving-goal-3", "saving-goal-4"]:
            self.assertTrue(entry in balances, "Expected " + entry + " to be in budget balances but was not present in " + str(balances))
    
        # TODO: should this have entries for all months?

    def test_getAccountBalances(self):
        accountBalances = self.reportService.getAccountBalances()

        for account in ["Assets:Fixed-Deposits", "Assets:Brokerage", "Assets:Foreign-currency-deposit"]:
            self.assertTrue(account in accountBalances, "Expected " + str(account) + " to be present in " + str(accountBalances.keys()))

            for i in range(1, 12+1):
                self.assertTrue(i in accountBalances[account][2023], "Expected to find month " + str(i) + " in " + str(accountBalances[account][2023]))

        account = "Assets:Fixed-Deposits"
        balances = [5000, 3000, 1000, 1000]
        goals = ["actual", "saving-goal-1", "saving-goal-2", "saving-goal-4"]

        self._checkAccountBalance(accountBalances, account, balances, goals)

        account = "Assets:Brokerage"
        balances = [1000, 1000]
        goals = ["actual", "saving-goal-3"]
        self._checkAccountBalance(accountBalances, account, balances, goals)

    def _checkAccountBalance(self, accountBalances, account, balances, goals):
        for month in range(10, 12+1):
            for i in range(len(balances)):
                self.assertEqual(balances[i], accountBalances[account][2023][month][goals[i]])

    def test_getBudgets(self):
        budgets = self.reportService.getBudgets()

        self.assertEqual(3300, budgets.getValue("saving-goal-1", 2023, 1))

    def test_getBudgetedAccounts(self):
        accs = self.reportService.getBudgetedAccounts()
        self.assertEqual(3, len(accs))