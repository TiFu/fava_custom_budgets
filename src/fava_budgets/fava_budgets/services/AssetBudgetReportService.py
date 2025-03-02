import math
import collections
import json
from fava_budgets.services.NestedDictionary import NestedDictionary
BudgetError = collections.namedtuple("BudgetError", "source message entry")
import decimal
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
        self.transactions = assetBudgetInformation["budgetedTransactions"] # { entry: Entry, postings: [postings]}
        self.accountBalances = {}
        self.budgetBalances = {}
        self.errors = []
        self.errors += self._calculateBalances()
        self.errors += self._validateTransactions()

    def validate(self):
        return self.errors

    def getBudgetBalances(self):
        return self.budgetBalances

    def getAccountBalances(self): 
        #print(self.accountBalances)
        return self.accountBalances
    
    def getBudgets(self):
        #print(self.budget)
        return self.budget

    def getBudgetedAccounts(self):
        #print(self.accounts)
        return self.accounts

    def _calculateBalances(self):
        self.accountBalances = {}
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
            
            # (1) Convert to NestedDictionary for simplicity
            # (2) In original one by account calculate balance in "acc currency"; assume accounts only have 1 currency
            # (3) use a separate nested dictionary for step (2)
            # (3) In the post "accumulation step", use both NestedDictionaries; one in acc currency, other in "base currency"
            # (4) Validate "budgeted accounts" only have 1 currency -> otherwise error
            # (5) Allow setting base currency (e.g. fetch from first operating currency)
            
            for posting in transaction["budgetedPostings"]:
                val = self._convertToBaseCurrency(posting)
                account = posting.account
                actualBalance = self._increaseAccountBalance(year, month, account, "actual", val)
                #print("budgeted posting meta")
                #print(posting.meta)

                for key in posting.meta.keys():
                    if key.startswith("budget_"):
                        name = key.replace("budget_", "")
                        budgetVal = self._convertActualsToBaseCurrency(posting.meta[key], posting)
                        self._increaseAccountBalance(year, month, account, name, budgetVal)

                        budgetBalanceTracker.increase(budgetVal, name)
                        budgetBalance = budgetBalanceTracker.get(name)

                        if budgetBalance < 0:
                            errors.append(BudgetError(entry.meta, "Budgeted amount exceeds balance for " + name + ": " + str(budgetBalance - budgetVal) + " available vs " + str(budgetVal) + " transferred.", entry))

        # Actual balances
        budgetSet = set()

        for account in self.accountBalances.keys():
            for year in range(minYear, maxYear+1):
                if year not in self.accountBalances[account]:
                    self.accountBalances[account][year] = {}

                for month in range(1,13):
                    if month == 1 and month not in self.accountBalances[account][year] and year == minYear:
                        self.accountBalances[account][year][month] = {}
                    elif month == 1 and month not in self.accountBalances[account][year]:
                        self.accountBalances[account][year][month] = self.accountBalances[account][year-1][12]
                    elif month not in self.accountBalances[account][year]:
                        self.accountBalances[account][year][month] = self.accountBalances[account][year][month-1]
                    elif year == minYear and month == 1:
                        pass
                    else:
                        priorYear = year - 1 if month == 1 else year
                        priorMonth = 12 if month == 1 else month-1

                        types = set(self.accountBalances[account][year][month].keys())
                        if priorMonth in self.accountBalances[account][priorYear]:
                            types = types.union(set(self.accountBalances[account][priorYear][priorMonth].keys()))
                        for type in types:
                            if type in self.accountBalances[account][priorYear][priorMonth]:
                                prior = self.accountBalances[account][priorYear][priorMonth][type] 
                            else:
                                prior = 0
                            if type in self.accountBalances[account][year][month]:
                                thisBalance = self.accountBalances[account][year][month][type]
                            else:
                                thisBalance = 0
                            self.accountBalances[account][year][month][type] = prior + thisBalance
                    budgetSet.update(set(self.accountBalances[account][year][month].keys()))

        # Calculate budget balances
        self.budgetBalances = {}
        for account in self.accountBalances:
            for year in range(minYear, maxYear+1):
                for month in range(1, 12+1):
                    for budget in self.accountBalances[account][year][month]:
                        val = self._getAccountValue(year, month, account, budget)
                        self._increaseBudgetBalance(year, month, account, budget, val)

        return errors

    def _getAccountValue(self, year, month, account, budget):
        if account not in self.accountBalances:
            return 0
        elif year not in self.accountBalances[account]:
            return 0
        elif month not in self.accountBalances[account][year]:
            return 0
        elif budget not in self.accountBalances[account][year][month]:
            return 0
        else:
            return self.accountBalances[account][year][month][budget]

    def _increaseBudgetBalance(self, year, month, account, type, value):
        name = type
        if name not in self.budgetBalances:
            self.budgetBalances[name] = {}

        if year not in self.budgetBalances[name]:
            self.budgetBalances[name][year] = {}
        
        if month not in self.budgetBalances[name][year]:
            self.budgetBalances[name][year][month] = 0

        self.budgetBalances[name][year][month] += value


    def _increaseAccountBalance(self, year, month, account, type, value):
        # Update account budget balance for the month
        if account not in self.accountBalances:
            self.accountBalances[account] = {}
        
        if year not in self.accountBalances[account]:
            self.accountBalances[account][year] = {}
        
        if month not in self.accountBalances[account][year]:
            self.accountBalances[account][year][month] = {}

        if type not in self.accountBalances[account][year][month]:
            self.accountBalances[account][year][month][type] = 0

        self.accountBalances[account][year][month][type] += value

        # Update budget overall balance for the month
        return self.accountBalances[account][year][month][type]

    def _validateBalances(self):
        pass

    def _validateTransactions(self):
        errors = []

        for transaction in self.transactions:
            #print(transaction)
            entry = transaction["entry"]
            for posting in transaction["budgetedPostings"]:
                isValid, budget, value = self._isValidPosting(posting)

                if isValid:
                    continue
                
                if math.isnan(budget):
                    errors.append(BudgetError(entry.meta, "Posting for account " + str(posting.account) + " is for a budgeted account, but posting does not have any budget_ metadata", entry))
                else:
                    errors.append(BudgetError(entry.meta, "Budget for posting " + str(posting.account) + " does not balance: " + str(budget) + " budgeted vs. actual " + str(value), entry))

        return errors
    def _isValidPosting(self, posting):
        meta = posting.meta
        balance = posting.units.number 

        if meta is None:
            return False, float("nan"), balance

        totalBudget = 0
        for key in meta.keys():
            if key.startswith("budget_"):
                name = key.replace("budget_", "")
                val = meta[key]
                #print("Balance ++ " + str(val))
                totalBudget += val

        convertedBalance = self._convertToBaseCurrency(posting)
        convertedActuals = self._convertActualsToBaseCurrency(totalBudget, posting)
        #print("Balance: " + str(balance) + " / totalBudget " + str(totalBudget))
        return abs(totalBudget - balance) < 10e-9, convertedActuals, convertedBalance

    def _convertActualsToBaseCurrency(self, actuals, posting):
        currency = posting.units.currency
        price = posting.cost.number if posting.cost is not None else 1
        return actuals * price

        # TODO iterate
    def _convertToBaseCurrency(self, posting):
        currency = posting.units.currency
        units = posting.units.number

        price = posting.cost.number if posting.cost is not None else 1

        return units * price