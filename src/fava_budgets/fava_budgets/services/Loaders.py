from fava_budgets.services.Summary import CostSummary, PriceDatabase
from fava.context import g
from fava.helpers import FavaAPIError
from beanquery.query import run_query  # type: ignore
from collections import namedtuple
from beancount.core.data import Transaction, Price, Open, Commodity, Close, Balance, Custom
from decimal import Decimal
import collections
from fava_budgets.services.NestedDictionary import NestedDictionary

# TODO: the income expense beancount plugin needs to check for errors -> eg correct number of values, only income/expense accounts
class BeancountLedgerHelper:
    def __init__(self, entries):
        self.entries = entries

    def getTransactions(self):
        return filter(lambda x: isinstance(x, Transaction), self.entries)

    def getPrices(self):
        return filter(lambda x: isinstance(x, Price), self.entries)


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

    def getPrices(self):
        return self.ledger.all_entries_by_type.Price

    def getCustom(self):
        return self.ledger.all_entries_by_type.Custom
    
    def getEntries(self):
        return self.ledger.all_entries


class ILedgerHelper:

    def getPrices(self):
        pass

    def getTransactions(self):
        pass
    
    def getOpen(self):
        pass

    def getCustom(self):
        pass

BudgetError = collections.namedtuple("BudgetError", "source message entry")

class PriceDatabaseLoader:
    def __init__(self, targetCurrency):
        self.targetCurrency = targetCurrency

    def loadLedger(self, ledgerHelper):

        prices = ledgerHelper.getPrices()

        outputTable = {}
        for price in prices:
            if price.amount.currency != self.targetCurrency:
                continue
            currency = price.currency
            if currency not in outputTable:
                outputTable[currency] = []

            outputTable[currency].append((price.date, price.amount.number))

        trxs = ledgerHelper.getTransactions()
        for trx in trxs:
            postings = trx.postings
            for posting in postings:
                if posting.cost is None:
                    continue

                currency = posting.units.currency
                cost = posting.cost.number
                costCurrency = posting.cost.currency
                if costCurrency != self.targetCurrency:
                    continue
                
                outputTable[currency].append((trx.date, cost))
                #print("Adding " + str(currency) + " for " + str(cost))
        return PriceDatabase(outputTable, self.targetCurrency)


class AssetBudgetLoader:   
    def loadLedger(self, ledgerHelper):

        budgetedAccounts, accountErrors = self._loadAccounts(ledgerHelper)
        budgetEntries, budgetDetails, errors = self._loadBudgets(ledgerHelper)
        budgetedTransactions = self._loadTransactions(ledgerHelper, budgetedAccounts)
        #print(budgetedTransactions)
        finalErrors = accountErrors + errors
        return {
            "budget": CostSummary(budgetEntries),
            "budgetDetails": budgetDetails,
            "accounts": budgetedAccounts,
            "errors": finalErrors,
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
        errors = []
        # Parse custom
        accounts = ledger.getOpen()
        for entry in accounts:
            if "budgeted" in entry.meta:
                entries.append(entry.account)
                if len(entry.currencies) != 1:
                    errors.append(BudgetError(entry.meta, "Multiple currencies found in account " + str(entry.account) + ": " + str(entry.currencies), entry))

        return set(entries), errors

    def _parseAssetBudget(self, entry):
        errors = []
        if len(entry.values) != 14:
            errors.append(BudgetError(entry.meta, "Incorrect number of values provided for asset_budget; expected 14 (budgetName, referenceName, 12 decimals) but received " + str(len(entry.values)), entry))
            return errors

        year = entry.date.year
        values = entry.values
        name = entry.values[0].value
        referenceName = entry.values[1].value

        entryName = str(name) + " - " + str(year) + " - " + str(referenceName)
        if entryName in self.alreadySeenAssetBudgetEntries:
            errors.append(BudgetError(entry.meta, "Duplicate asset budget entry " + entryName + " on " + str(entry.date) + " and " + str(self.alreadySeenAssetBudgetEntries[entryName]), entry))
        self.alreadySeenAssetBudgetEntries[entryName] = entry.date

        accumulatedAmount = Decimal(0)
        for i, x in enumerate(entry.values[2:]):
            #print("Value: " + str(type(x.value)) + ": " + str(x.value))
            val = Decimal(x.value)
            self.budgetDetails.increase(val, name, year, i+1, entryName)

        return errors

    def _parseAssetBudgetOnce(self, entry):
        errors = []
        if len(entry.values) != 3:
            errors.append(BudgetError(entry.meta, "Incorrect number of values provided for asset_budget_once; expected 3 (budgetName, referenceName, value) but received " + str(len(entry.values)), entry))
            return errors

        year = entry.date.year
        month = entry.date.month
        values = entry.values
        name = entry.values[0].value
        reference = entry.values[1].value
        amount = Decimal(entry.values[2].value)

        # TODO: refactor into separate function(s) to reduce duplication
        entryName = str(name) + " - " + str(year) + "/" + str(month) + "-" + str(reference)
        if entryName in self.alreadySeenAssetBudgetEntries:
            errors.append(BudgetError(entry.meta, "Duplicate asset budget entry " + entryName + " on " + str(entry.date) + " and " + str(self.alreadySeenAssetBudgetEntries[entryName]), entry))
        self.alreadySeenAssetBudgetEntries[entryName] = entry.date

        for i in range(1, 13):
            if i == month:
                self.budgetDetails.increase(amount, name, year, i, entryName)
            else:
                self.budgetDetails.increase(Decimal(0), name, year, i, entryName)
        return errors

    def _parseAssetBudgetAppreciation(self, entry):
        errors = []
        if len(entry.values) != 3:
            errors.append(BudgetError(entry.meta, "Incorrect number of values provided for asset_budget_appreciation; expected 3 (budgetName, referenceName, value) but received " + str(len(entry.values)), entry))
            return errors

        year = entry.date.year
        name = entry.values[0].value
        reference = entry.values[1].value
        amount = Decimal(entry.values[2].value)

        self.budgetAppreciation.increase(amount, name, year)
        return errors

    def _loadBudgets(self, ledger):
        entries = []
        # Parse custom
        customs = ledger.getCustom()

        # TODO: Rewrite to parse 
        #   asset_budget, asset_budget_one_off (to initiate and/or process)
        #   Then also allow multiple asset_budget feeding the same (for ease of use, eg interest income)
        #   then re-parse this as a cumulative value
        #   TODO: how to handle multiple different asset types, eg Money Market Fund
        #       "Contribution" vs "Value" -> should budget account for value growth over time?
        #   This would require 2 changes
        #       (A) Add some kind of "percentage of existing assets growth"
        #       (B) Adjust value calculation to be *asset value as of end of month (-> prior assets at end of month value + this month's contributions)
        #

        self.budgetDetails = NestedDictionary(0)
        self.budgetAppreciation = NestedDictionary(0)
        self.alreadySeenAssetBudgetEntries = {}
        errors = []
        
        minYear = 20000
        maxYear = 0

        for entry in customs:
            year = entry.date.year
            minYear = min(year, minYear)
            maxYear = max(year, maxYear)

            if entry.type == "asset_budget_once":
                parseErrors = self._parseAssetBudgetOnce(entry)
                errors.extend(parseErrors)
            elif entry.type == "asset_budget": 
                parseErrors = self._parseAssetBudget(entry)
                errors.extend(parseErrors)
            elif entry.type == "asset_budget_appreciation":
                parseErrors = self._parseAssetBudgetAppreciation(entry)
                errors.extend(parseErrors)
                # TODO: expect X% growth rate (eg based on investments)

        # Add asset_budget_percentage
        entries = self._accumulateBudgets(minYear, maxYear)
        return entries, self.budgetDetails.getDict(), errors

    def _accumulateBudgets(self, minYear, maxYear):
        entries = []
        
        for budget in self.budgetDetails.getKeys():
            priorSum = Decimal(0)
            for year in range(minYear, maxYear + 1):
                budgetAppreciation = self.budgetAppreciation.get(budget, year)
                appreciation = Decimal(1)+ budgetAppreciation / Decimal(12)

                monthlyValues = []
                for i in range(1, 13):
                    monthEntryKeys = self.budgetDetails.getKeys(budget, year, i)
                    monthSum = Decimal(0)
                    for entryName in monthEntryKeys:
                        monthSum += self.budgetDetails.get(budget, year, i, entryName)
                    
                    priorSum = priorSum * appreciation + monthSum
                    monthlyValues.append([i, priorSum])

                entries.append({ 
                    "account": budget,
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
