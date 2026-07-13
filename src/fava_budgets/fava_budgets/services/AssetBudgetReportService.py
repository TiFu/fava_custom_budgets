import math
import collections
from datetime import date
import json
import logging
from fava_budgets.services.NestedDictionary import NestedDictionary
BudgetError = collections.namedtuple("BudgetError", "source message entry")
import decimal
import sys
import uuid

class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, decimal.Decimal):
            return str(o)
        if isintstance(o, set): 
            return list(o)
        return super().default(o)


class AssetBudgetReportService:

    def __init__(self, assetBudgetInformation, priceDatabase):
        self.priceDatabase = priceDatabase
        self.accounts = assetBudgetInformation["accounts"]
        self.budget = assetBudgetInformation["budget"]
        self.annualBudget = assetBudgetInformation["annualBudget"]
        self.transactions = assetBudgetInformation["budgetedTransactions"] # { entry: Entry, postings: [postings]}
        self.accountBalances = NestedDictionary(0)
        self.budgetBalances = NestedDictionary(0)
        self.errors = []
        self.errors += self._calculateBalances()
        self.errors += self._validateTransactions()

    def validate(self):
        return self.errors

    def getBudgetBalances(self):
        return self.budgetBalances.getDict()

    def getAccountBalances(self):
        #print(self.accountBalances)
        return self.accountBalancesConverted.getDict()

    def getBudgets(self):
        #print(self.budget)
        return self.budget

    def getAnnualBudgetBalances(self):
        # Accrued contributions within each year (resets every January), as opposed to
        # getBudgetBalances() which is cumulative since inception.
        return self.annualBudgetBalances.getDict()

    def getAnnualAccountBalances(self):
        return self.annualAccountBalancesConverted.getDict()

    def getAnnualBudgets(self):
        return self.annualBudget

    def getBudgetedAccounts(self):
        #print(self.accounts)
        return self.accounts

    def _getPostingId(self, posting):
        """Get or generate an ID for a posting. Creates a new UUID if no ID exists."""
        id = posting.meta["id"] if "id" in posting.meta else str(uuid.uuid4())
        posting.meta["id"] = id
        return id

    def _processTransactions(self):
        errors = []
        minYear = 10000
        maxYear = 0

        budgetBalanceTracker = NestedDictionary(0)

        # Assumption: transactions ordered by date (guaranteed by beancount)
        for transaction in self.transactions:
            entry = transaction["entry"]
            year = entry.date.year
            minYear = min(year, minYear)
            maxYear = max(year, maxYear)

            month = entry.date.month
            
            # (5) Allow setting base currency (e.g. fetch from first operating currency)
            idsSeen= set()
            for posting in transaction["budgetedPostings"]:
                currency = posting.units.currency
                val = posting.units.number 
                account = posting.account

                # TODO: add check whether already exists & differs from currency -> if so, add error
                self.accountCurrencies[account] = currency

                actualBalance = self.accountBalances.increase(val, account, year, month, "actual")
                self.rawAccountBalances.increase(val, account, year, month, "actual")
                #print("budgeted posting meta")
                #print(posting.meta)
                # Special case: IDs are duplicated in case a posting (automatically) matches multiple lots - so the ID helps with deduplication
                #print(posting.meta)
                id = self._getPostingId(posting)
                if id in idsSeen:
                    continue

                idsSeen.add(id)
                for key in posting.meta.keys():
                    if key.startswith("budget_"):
                        name = key.replace("budget_", "")
                        budgetVal = posting.meta[key]
                        self.accountBalances.increase(budgetVal, account, year, month, name)
                        self.rawAccountBalances.increase(budgetVal, account, year, month, name)

                        budgetBalanceTracker.increase(budgetVal, name)
                        budgetBalance = budgetBalanceTracker.get(name)

                        if budgetBalance < 0:
                            errors.append(BudgetError(entry.meta, "Budgeted amount exceeds balance for " + name + ": " + str(budgetBalance - budgetVal) + " available vs " + str(budgetVal) + " transferred.", entry))
        
        return errors, minYear, maxYear

    def _calculateBalances(self):
        self.accountBalances = NestedDictionary(0)
        self.accountBalancesConverted = NestedDictionary(0)
        self.rawAccountBalances = NestedDictionary(0)
        self.annualAccountBalances = NestedDictionary(0)
        self.annualAccountBalancesConverted = NestedDictionary(0)

        self.accountCurrencies = {}
        self.convertedAccountBalances = NestedDictionary(0)

        errors = []

        processErrors, minYear, maxYear = self._processTransactions()
        errors.extend(processErrors)

        accumulationErrors = self._accumulateAccountBalances(minYear, maxYear)
        errors.extend(accumulationErrors)

        annualAccumulationErrors = self._accumulateAnnualAccountBalances(minYear, maxYear)
        errors.extend(annualAccumulationErrors)

        budgetErrors = self._calculateBudgetBalances(minYear, maxYear)
        errors.extend(budgetErrors)

        annualBudgetErrors = self._calculateAnnualBudgetBalances(minYear, maxYear)
        errors.extend(annualBudgetErrors)

        #print(json.dumps(self.accountBalancesConverted.getDict(), indent=2, cls=DecimalEncoder))
        #print("Done calculating balances")
        #print("-----------------------------------------------------------------------------------")
        return errors

    def _calculateBudgetBalances(self, minYear, maxYear):
        errors = []
        # Calculate budget balances
        self.budgetBalances = NestedDictionary(0)
        for account in self.accountBalances.getKeys():
            for year in range(minYear, maxYear+1):
                for month in range(1, 12+1):
                    for budget in self.accountBalancesConverted.getKeys(account, year, month):
                        val = self.accountBalancesConverted.get(account, year, month, budget)
                        self.budgetBalances.increase(val, budget, year, month)

        return errors

    def _calculateAnnualBudgetBalances(self, minYear, maxYear):
        errors = []
        # Same aggregation as _calculateBudgetBalances, but sourced from the within-year
        # (non-cumulative-across-years) account balances.
        self.annualBudgetBalances = NestedDictionary(0)
        for account in self.rawAccountBalances.getKeys():
            for year in range(minYear, maxYear+1):
                for month in range(1, 12+1):
                    for budget in self.annualAccountBalancesConverted.getKeys(account, year, month):
                        val = self.annualAccountBalancesConverted.get(account, year, month, budget)
                        self.annualBudgetBalances.increase(val, budget, year, month)

        return errors

    def _accumulateAccountBalances(self, minYear, maxYear):
        errors = []

        for account in self.accountBalances.getKeys():
            for year in range(minYear, maxYear+1):
                budgetSets = set()
                # Calculate all budgets in this year & use these to iterate
                for month in range(1, 13):
                    additional = self.accountBalances.getKeys(account, year, month)
                    budgetSets.update(additional)

                for month in range(1,13):
                    priorYear = year - 1 if month == 1 else year
                    priorMonth = 12 if month == 1 else month-1

                    # Get all budgets in prior Month + this month
                    #budgetSets = set(self.accountBalances.getKeys(account, year, month))
                    priorMonthBudgets = set(self.accountBalances.getKeys(account, priorYear, priorMonth))
                    fullBudgetSets = budgetSets.union(priorMonthBudgets)
                    for budgetName in fullBudgetSets:
                        priorBalance = self.accountBalances.get(account, priorYear, priorMonth, budgetName)
                        thisBalance = self.accountBalances.get(account, year, month, budgetName)

                        newBalance = priorBalance + thisBalance
                        self.accountBalances.set(newBalance, account, year, month, budgetName)

                        newBalanceConverted = self._convertBalance(account, date(year, month, 28), newBalance)
                        self.accountBalancesConverted.set(newBalanceConverted, account, year, month, budgetName)
                        # Convert balance
                        # TODO: fetch account currency, convert currency
        return errors

    def _accumulateAnnualAccountBalances(self, minYear, maxYear):
        errors = []

        for account in self.rawAccountBalances.getKeys():
            for year in range(minYear, maxYear+1):
                budgetSets = set()
                for month in range(1, 13):
                    budgetSets.update(self.rawAccountBalances.getKeys(account, year, month))

                runningBalance = {}
                for month in range(1, 13):
                    for budgetName in budgetSets:
                        # Reset every January - no carry-over from the prior year.
                        priorBalance = 0 if month == 1 else runningBalance[budgetName]
                        thisBalance = self.rawAccountBalances.get(account, year, month, budgetName)

                        newBalance = priorBalance + thisBalance
                        runningBalance[budgetName] = newBalance
                        self.annualAccountBalances.set(newBalance, account, year, month, budgetName)

                        newBalanceConverted = self._convertBalance(account, date(year, month, 28), newBalance)
                        self.annualAccountBalancesConverted.set(newBalanceConverted, account, year, month, budgetName)
        return errors

    def _convertBalance(self, account, date, balance):
        currency = self.accountCurrencies[account]
        result = self.priceDatabase.convertPrice(currency, date, balance)
        return result

    def _validateBalances(self):
        pass

    def _validateTransactions(self):
        errors = []

        for transaction in self.transactions:
            #print(transaction)
            entry = transaction["entry"]
            valuesById = {}
            budgetById = {}
            for posting in transaction["budgetedPostings"]:
                id = self._getPostingId(posting)
                if id not in valuesById:
                    valuesById[id] = 0
                valuesById[id] += posting.units.number

            for posting in transaction["budgetedPostings"]:
                isValid = self._isValidPosting(posting, budgetById)

                if isValid:
                    continue
            
            for id in valuesById.keys():
                value = valuesById[id]
                budget = budgetById[id]

                diff = abs(value - budget)
                if math.isnan(diff):
                    errors.append(BudgetError(entry.meta, "Posting for account " + str(posting.account) + " is for a budgeted account, but posting does not have any budget_ metadata", entry))
                elif diff > 10e-9:
                    logging.error("Posting does not balance...")
                    logging.error(posting)
                    logging.error(posting.meta)
                    print("", file=sys.stderr)
                    errors.append(BudgetError(entry.meta, "Budget for posting " + str(posting.account) + " does not balance: " + str(budget) + " budgeted vs. actual " + str(value), entry))
                else: # All good - everything budgeted
                    pass 

        return errors
    def _isValidPosting(self, posting, budgetById):
        meta = posting.meta
        balance = posting.units.number 

        id = meta["id"]
        if id in budgetById:
            return True
        if meta is None:
            budgetById[id] = float("nan")
            return False#, float("nan"), balance

        totalBudget = 0
        for key in meta.keys():
            if key.startswith("budget_"):
                name = key.replace("budget_", "")
                val = meta[key]
                #print("Balance ++ " + str(val))
                totalBudget += val

        convertedBalance = posting.units.number
        convertedActuals = totalBudget
        budgetById[id] = totalBudget
        #print("Balance: " + str(balance) + " / totalBudget " + str(totalBudget))
        return True#, convertedActuals, convertedBalance