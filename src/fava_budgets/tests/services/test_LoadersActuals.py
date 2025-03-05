from fava_budgets.services.Loaders import BudgetLoader, ActualsLoader, AssetBudgetLoader, FavaLedgerHelper

from fava.core import FavaLedger
import os
import unittest

class TestActualsLoaders(unittest.TestCase):
    
    def setUp(self):
        path = os.path.abspath("../../resources/beancount_inc_exp/main.bean")
        self.ledger = FavaLedger(path)

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

