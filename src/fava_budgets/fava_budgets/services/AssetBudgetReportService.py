import math
import collections

BudgetError = collections.namedtuple("BudgetError", "source message entry")

class AssetBudgetReportService:

    def __init__(self, assetBudgetInformation):
        self.accounts = assetBudgetInformation["accounts"]
        self.budget = assetBudgetInformation["budget"]
        self.transactions = assetBudgetInformation["budgetedTransactions"] # { entry: Entry, postings: [postings]}
        self.balances = {}
        self.budgetBalances = {}
        self.errors = []
        self.errors += self._calculateBalances()
        self.errors += self._validateTransactions()

    def validate(self):
        return self.errors

    def getBudgetBalances(self):
        return self.budgetBalances

    def getAccountBalances(self): 
        #print(self.balances)
        return self.balances
    
    def getBudgets(self):
        #print(self.budget)
        return self.budget

    def getBudgetedAccounts(self):
        #print(self.accounts)
        return self.accounts

    def _calculateBalances(self):
        self.balances = {}
        errors = []
        minYear = 10000
        maxYear = 0
        for transaction in self.transactions:
            entry = transaction["entry"]
            year = entry.date.year
            minYear = min(year, minYear)
            maxYear = max(year, maxYear)

            month = entry.date.month
            
            for posting in transaction["budgetedPostings"]:
                val = self._convertToBaseCurrency(posting)
                account = posting.account
                actualBalance = self._increaseBalance(year, month, account, "actual", val)
                #print("budgeted posting meta")
                #print(posting.meta)

                for key in posting.meta.keys():
                    if key.startswith("budget_"):
                        name = key.replace("budget_", "")
                        budgetVal = posting.meta[key]
                        budgetBalance = self._increaseBalance(year, month, account, name, budgetVal)
                        if budgetBalance < 0:
                            errors.append(BudgetError(entry.meta, "Budgeted amount exceeds balance for " + name + ": " + str(budgetBalance - budgetVal) + " available vs " + str(budgetVal) + " transferred.", entry))
        
        # TODO: need to validate whether balances are actually correctly summed up... 
        # This may not be the case...especially across years...
        # Actual balances
        #print(self.balances)
        #print(minYear)
        #print(maxYear)
        for account in self.balances.keys():
            for year in range(minYear, maxYear+1):
                if year not in self.balances[account]:
                    self.balances[account][year] = {}

                for month in range(1,13):
                    if month == 1 and month not in self.balances[account][year] and year == minYear:
                        self.balances[account][year][month] = {}
                    elif month == 1 and month not in self.balances[account][year]:
                        self.balances[account][year][month] = self.balances[account][year-1][12]
                    elif month not in self.balances[account][year]:
                        self.balances[account][year][month] = self.balances[account][year][month-1]
                    elif year == minYear and month == 1:
                        pass
                    else:
                        priorYear = year - 1 if month == 1 else year
                        priorMonth = 12 if month == 1 else month-1

                        for type in self.balances[account][year][month]:
                            if type in self.balances[account][priorYear][priorMonth]:
                                prior = self.balances[account][priorYear][priorMonth][type] 
                            else:
                                prior = 0
                            self.balances[account][year][month][type] = prior + self.balances[account][year][month][type]
        
        return errors

    def _increaseBalance(self, year, month, account, type, value):
        # Update account budget balance for the month
        if account not in self.balances:
            self.balances[account] = {}
        
        if year not in self.balances[account]:
            self.balances[account][year] = {}
        
        if month not in self.balances[account][year]:
            self.balances[account][year][month] = {}

        if type not in self.balances[account][year][month]:
            self.balances[account][year][month][type] = 0

        self.balances[account][year][month][type] += value

        # Update budget overall balance for the month
        name = type
        if name not in self.budgetBalances:
            self.budgetBalances[name] = {}

        if year not in self.budgetBalances[name]:
            self.budgetBalances[name][year] = {}
        
        if month not in self.budgetBalances[name][year]:
            self.budgetBalances[name][year][month] = 0

        self.budgetBalances[name][year][month] += value

        return self.balances[account][year][month][type]

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
        pass
        meta = posting.meta
        balance = self._convertToBaseCurrency(posting)

        if meta is None:
            return False, float("nan"), balance

        totalBudget = 0
        for key in meta.keys():
            if key.startswith("budget_"):
                name = key.replace("budget_", "")
                val = meta[key]
                #print("Balance ++ " + str(val))
                totalBudget += val

        #print("Balance: " + str(balance) + " / totalBudget " + str(totalBudget))
        return abs(totalBudget - balance) < 10e-9, totalBudget, balance


        # TODO iterate
    def _convertToBaseCurrency(self, posting):
        currency = posting.units.currency
        units = posting.units.number

        price = posting.cost.number if posting.cost is not None else 1

        return units * price