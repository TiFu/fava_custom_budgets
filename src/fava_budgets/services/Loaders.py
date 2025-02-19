from fava_budgets.services.Summary import CostSummary
from fava.context import g
from fava.helpers import FavaAPIError
from beanquery.query import run_query  # type: ignore
from collections import namedtuple
from beancount.core.data import Transaction, Price, Open, Commodity, Close, Balance, Custom
from decimal import Decimal

# TODO: the income expense beancount plugin needs to check for errors -> eg correct number of values, only income/expense accounts
class BeancountLedgerHelper:
    def __init__(self, entries):
        self.entries = entries

    def getTransactions(self):
        return filter(lambda x: isinstance(x, Transaction), self.entries)
    
    def getOpen(self):
        return filter(lambda x: isinstance(x, Open), self.entries)

    def getCustom(self):
        return filter(lambda x: isinstance(x, Custom), self.entries)
    def getEntries(self):
        return self.entries


class FavaLedgerHelper:
    def __init__(self, favaLedger):
        self.ledger = favaLedger

    def getTransactions(self):
        return self.ledger.all_entries_by_type.Transaction
    
    def getOpen(self):
        return self.ledger.all_entries_by_type.Open

    def getCustom(self):
        return self.ledger.all_entries_by_type.Custom
    
    def getEntries(self):
        return self.ledger.all_entries


class ILedgerHelper:

    def getTransactions(self):
        pass
    
    def getOpen(self):
        pass

    def getCustom(self):
        pass


class AssetBudgetLoader:
    
    def loadLedger(self, ledgerHelper):
        #print("Parsing custom")

        budgetedAccounts = self._loadAccounts(ledgerHelper)
        budgetEntries = self._loadBudgets(ledgerHelper)
        budgetedTransactions = self._loadTransactions(ledgerHelper, budgetedAccounts)
        #print(budgetedTransactions)
        return {
            "budget": CostSummary(budgetEntries),
            "accounts": budgetedAccounts,
            "budgetedTransactions": budgetedTransactions
        }

    def _loadTransactions(self, ledger, budgetedAccounts):
        entries = []
        # Parse custom
        transactions = ledger.getTransactions()
        for entry in transactions:
            postings = entry.postings
            budgetedPostings = []
            atLeast1BudgetedPosting = False
            for posting in postings:
                if posting.account in budgetedAccounts:
                    budgetedPostings.append(posting)
                    atLeast1BudgetedPosting = True
            if atLeast1BudgetedPosting:
                entries.append({ "entry": entry, "budgetedPostings": budgetedPostings})

        return entries


    def _loadAccounts(self, ledger):
        entries = []
        # Parse custom
        accounts = ledger.getOpen()
        for entry in accounts:
            if "budgeted" in entry.meta:
                entries.append(entry.account)
        return set(entries)

    def _loadBudgets(self, ledger):
        entries = []
        # Parse custom
        customs = ledger.getCustom()
        for entry in customs:
            if entry.type == "asset_budget": # Structure is budget_name start_value january_value february_value [...] december_value
                year = entry.date.year
                values = entry.values
                name = entry.values[0].value
                start = entry.values[1].value
            
                monthlyValues = []
                #print("Start: " + str(type(start)))
                accumulatedAmount = Decimal(start)
                for i, x in enumerate(entry.values[2:]):
                    #print("Value: " + str(type(x.value)) + ": " + str(x.value))
                    accumulatedAmount += Decimal(x.value)
                    monthlyValues.append([i+1, accumulatedAmount])

                entries.append({ 
                    "account": name,
                    "year": year,
                    "values": monthlyValues
                })
        return entries


class BudgetLoader:

    def loadLedger(self, ledger):
        #print("Parsing custom")
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
