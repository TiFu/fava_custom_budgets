from fava_budgets.services.Loaders import BudgetLoader, PriceDatabaseLoader, ActualsLoader, AssetBudgetLoader, FavaLedgerHelper

from fava.core import FavaLedger
import os
import unittest
import datetime

class TestIncExpLoader(unittest.TestCase):
    def setUp(self):
        path = os.path.abspath("../../resources/beancount_assets/main.bean")
        ledger = FavaLedger(path)
        helper = FavaLedgerHelper(ledger)

        priceDatabase = PriceDatabaseLoader("EUR")
        self.result = priceDatabase.loadLedger(helper)

    def test_convert_price(self):
        print(self.result)
        date = datetime.date(2025, 3, 5)
        convertedToEur = self.result.convertPrice("XYZ_SHARES", date, 200)
        self.assertAlmostEqual(convertedToEur, 200*120)

        date = datetime.date(2025, 3, 11)
        convertedToEur = self.result.convertPrice("XYZ_SHARES", date, 200)
        self.assertAlmostEqual(convertedToEur, 200*130)


    def test_lookup_nearest_price(self):
        date = datetime.date(2025, 3, 5)
        price= self.result.lookupNearestPrice("XYZ_SHARES", date)
        self.assertAlmostEqual(price, 120)

        date = datetime.date(2025, 3, 18)
        price= self.result.lookupNearestPrice("XYZ_SHARES", date)
        self.assertAlmostEqual(price, 130)

    def test_price_from_trx(self):
        date = datetime.date(2023, 10, 1)
        price= self.result.lookupNearestPrice("XYZ_SHARES", date)
        self.assertAlmostEqual(price, 10)

        date = datetime.date(2023, 10, 2)
        price= self.result.lookupNearestPrice("XYZ_SHARES", date)
        self.assertAlmostEqual(price, 10)

