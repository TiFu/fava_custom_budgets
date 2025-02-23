from fava_budgets.services.Loaders import BudgetLoader, ActualsLoader
from fava_budgets.services.BudgetReportServices import IncomeExpenseReportService

from fava.core import FavaLedger
import os
import unittest
from decimal import Decimal

class TestBudgetReportService(unittest.TestCase):

    def setUp(self):
        path = os.path.abspath("../../resources/beancount_inc_exp/main.bean")
        ledger = FavaLedger(path)
        incActuals = ActualsLoader("EUR", "Income").loadLedger(ledger)
        expActuals = ActualsLoader("EUR", "Expenses").loadLedger(ledger)
        budget = BudgetLoader().loadLedger(ledger)

        self.reportService= IncomeExpenseReportService(budget, incActuals, expActuals)

    def test_YtdSummary(self):
        result = self.reportService.getYtDSummary(2024, 5)

        budgetInc = 100*5+7000*5
        actualInc = 0*5+6753*5
        budgetExp = 600*5+50+400*5
        actualExp = 475*5+335*5

        self.assertEqual(2024, result["year"])
        self.assertEqual(5, result["month"])
        self.assertTrue("income" in result, "Key income not found in result")
        self.assertEqual(Decimal(budgetInc), result["income"]["budget"])
        self.assertEqual(Decimal(actualInc), result["income"]["actuals"])

        self.assertTrue("expenses" in result, "Key expenses not found in result")
        self.assertEqual(Decimal(budgetExp), result["expenses"]["budget"])
        self.assertEqual(Decimal(actualExp), result["expenses"]["actuals"])

        self.assertTrue("profits" in result, "Key profits not found in result")
        self.assertEqual(Decimal(budgetInc - budgetExp), result["profits"]["budget"])
        self.assertEqual(Decimal(actualInc - actualExp), result["profits"]["actuals"])


    def test_getYtDBreakdown(self):
        result = self.reportService.getYtDBreakdown(2024, 5)
        
        # Structure is budget -> Income | Expenses -> AcountName -> val
        # Structure is income | expenses -> budget | actuals -> acount name -> val
        self.assertEqual(2024, result["year"])
        self.assertEqual(5, result["month"])

        self.assertTrue("budget" in result)
        self.assertTrue("Income" in result["budget"])
        self.assertTrue("Expenses" in result["budget"])


        self.assertTrue("income" in result)
        self.assertTrue("budget" in result["income"])
        self.assertTrue("actuals" in result["income"])

        self.assertTrue("Income:Work" in result["income"]["budget"])
        self.assertTrue("Income:Work" in result["income"]["actuals"])
        self.assertEqual(35000, result["income"]["budget"]["Income:Work"])
        self.assertEqual(33765, result["income"]["actuals"]["Income:Work"])

        self.assertTrue("expenses" in result)
        self.assertTrue("budget" in result["expenses"])
        self.assertTrue("actuals" in result["expenses"])
