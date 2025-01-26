from fava_budgets.services.Summary import CostSummary
from fava.context import g
from fava.helpers import FavaAPIError
from beanquery.query import run_query  # type: ignore
from collections import namedtuple

class BudgetLoader:

    def __init__(self):
        pass

    def loadLedger(self, ledger):
        print("Parsing custom")
        entries = []
        # Parse custom
        customs = ledger.all_entries_by_type.Custom
        for entry in customs:
            #if entry.type == "asset_budget": # Structure is budget_name start_value january_value february_value [...] december_value
            #    year = entry.date.year
            #    values = entry.values
            #    name = entry.values[0].value
            #    start = entry.values[1].value
            #    monthlyValues = list(map(lambda x: x.value, entry.values[2:]))
            #
            #    self.assetBudget.setStartAmount(name, year, start)
            #    month = 1
            #    for value in monthlyValues:
            #        self.assetBudget.setBudget(name, year, month, value)
            #        month += 1
            #
            if entry.type == "income_expense_budget":
                year = entry.date.year
                values = entry.values
                account = entry.values[0].value
                monthlyValues = []
                for i, x in enumerate(entry.values[1:]):
                    monthlyValues.append([i+1, x.value])

                entries.append({
                    "account": account,
                    "year": year,
                    "values": monthlyValues
                })
            else:
                pass

        incomeEntries = list(filter(lambda x: x["account"].startswith("Income"), entries))
        expenseEntries = list(filter(lambda x: x["account"].startswith("Expenses"), entries))

        return {
            "Income": CostSummary(incomeEntries),
            "Expenses": CostSummary(expenseEntries)
        }


class ActualsLoader:

    def __init__(self, currency, accountFilter):
        self.currency = currency
        self.accountFilter = accountFilter

    def loadLedger(self, ledger):
        results = self.exec_query(ledger, "SELECT year, month, account, CONVERT(SUM(position), '" + self.currency + "') AS value where account ~'^" + self.accountFilter + ":' group by account, year, month order by account")
        
        entries = {}

        for result in results[1]:
            year = result.year
            month = result.month
            account = result.account

            if account not in entries:
                entries[account] = {}
            
            if year not in entries[account]:
                entries[account][year] = {
                    "account": account,
                    "year": year,
                    "values": []
                }
            
            if result.value.get_only_position() is None:
                value = 0
            else:
                value = result.value.get_only_position().units.number

            if account.startswith("Income"):
                value *= -1
            entries[account][year]["values"].append([month, value])

        # flat map the dictionary
        outputEntries = []
        for account in entries.keys():
            for year in entries[account].keys():
                outputEntries.append(entries[account][year])

        return CostSummary(outputEntries)

    def exec_query(self, ledger, query):
        try:
            rtypes, rrows = run_query(ledger.all_entries, ledger.options, query)
        except Exception as ex:
            raise FavaAPIError(f"failed to execute query {query}: {ex}") from ex

        # convert to legacy beancount.query format for backwards compat
        result_row = namedtuple("ResultRow", [col.name for col in rtypes])
        rtypes = [(t.name, t.datatype) for t in rtypes]
        rrows = [result_row(*row) for row in rrows]

        return rtypes, rrows
