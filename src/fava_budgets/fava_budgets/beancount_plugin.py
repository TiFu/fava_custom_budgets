__plugins__ = [ "budget" ]

from fava_budgets.services.Loaders import BeancountLedgerHelper, AssetBudgetLoader
from fava_budgets.services.AssetBudgetReportService import AssetBudgetReportService
def budget(entries, options_map):
    ledger = BeancountLedgerHelper(entries)

    loader = AssetBudgetLoader()
    input = loader.loadLedger(ledger)

    service = AssetBudgetReportService(input)

    errors = service.validate()

    return entries, errors ## TODO return errors
