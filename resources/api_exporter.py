from fava_budgets.services.Loaders import BudgetLoader, ActualsLoader
from fava_budgets.fava_plugin import BudgetFavaPlugin
from fava.core import FavaLedger
import os
import unittest
from datetime import datetime
import json
import decimal

path = os.path.abspath("./beancount_inc_exp/main.bean")
ledger = FavaLedger(path)

favaPlugin = BudgetFavaPlugin(ledger)
favaPlugin.ledger = ledger
favaPlugin.after_load_file()


path = os.path.abspath("./beancount_assets/main.bean")
ledger = FavaLedger(path)
assetFavaPlugin = BudgetFavaPlugin(ledger)
assetFavaPlugin.ledger = ledger
assetFavaPlugin.after_load_file()

assetBudget = assetFavaPlugin.bootstrapAssetBudget()
incExpBudget = favaPlugin.bootstrapIncomeExpenseBudget()

class SetEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, set):
            return list(obj)
        if isinstance(obj, decimal.Decimal):
            return float(obj)
        return json.JSONEncoder.default(self, obj)


# Output to right folder
print(assetBudget.keys())
output = """import { AssetBudget } from "../../src/data_model/AssetBudget";
export const api: AssetBudget = """ + json.dumps(assetBudget, cls=SetEncoder, indent=4)

with open("../src/frontend/tests/resources/api_asset_budget.tsx", "w") as f:
    f.write(output)

output = """import { BudgetActualsSummary } from "../../src/data_model/IncomeExpenseBudget"
export const api: BudgetActualsSummary = """ + json.dumps(incExpBudget, cls=SetEncoder, indent=4)
with open("../src/frontend/tests/resources/api_inc_exp.tsx", "w") as f:
    f.write(output)
