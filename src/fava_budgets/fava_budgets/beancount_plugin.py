__plugins__ = [ "budget" ]

from fava_budgets.services.Loaders import BeancountLedgerHelper, AssetBudgetLoader, PriceDatabaseLoader
from fava_budgets.services.AssetBudgetReportService import AssetBudgetReportService
def budget(entries, options_map):
    ledger = BeancountLedgerHelper(entries)

    priceDatabaseLoader = PriceDatabaseLoader("EUR")
    priceDatabase = priceDatabaseLoader.loadLedger(ledger)

    loader = AssetBudgetLoader()
    input = loader.loadLedger(ledger)

    service = AssetBudgetReportService(input, priceDatabase)

    errors = service.validate()
    errors += input["errors"]
    return entries, errors ## TODO return errors
