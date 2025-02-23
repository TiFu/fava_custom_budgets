from datetime import datetime
class CostSummary:
    
    def __init__(self, elements):
        self.budget = {}
        self.accumulatedBudget = {}

        self.incomeRoot = "Income"
        self.expensesRoot = "Expenses"
        self._initializeDictionary(elements)

    def getSummary(self):
        return self.accumulatedBudget

    def _initializeDictionary(self, elements):
        # Step 1 - Load the initiail values
        minYear = 10000
        maxYear = 0
        for element in elements:
            acc = element["account"]
            year = element["year"]
            values = element["values"]

            if year < minYear:
                minYear = year
            if year > maxYear:
                maxYear = year

            for i in range(len(values)):
                month = values[i][0]
                value = values[i][1]
                self._setIfNotExists(self.budget, acc, year, month, value)

        currentYear = datetime.now().year
        self.minYear = minYear
        self.maxYear = max(currentYear, maxYear)
        maxYear = self.maxYear
        

        # Step 2 fill in "gaps" across all accounts
        for account in self.budget.keys():
            for year in range(minYear, maxYear + 1):
                for month in range(1, 12+1):
                    self._setIfNotExists(self.budget, account, year, month, 0)

        # Step 3: Traverse the account hierarchy & set in the accumulated budget
        for account in self.budget.keys():
            parentAccounts = account.split(":")
            for year in range(minYear, maxYear + 1):
                for month in range(1, 12+1):
                    value = self.budget[account][year][month]
                    for i in range(1, len(parentAccounts)+1):
                        parentAccount = ":".join(parentAccounts[0:i])
                        self._increase(self.accumulatedBudget, parentAccount, year, month, value)

    def _increase(self, dictionary, account, year, month, value):
        self._setIfNotExists(dictionary, account, year, month, 0)
        dictionary[account][year][month] += value

    def _setIfNotExists(self, dictionary, account, year, month, value):
        if account not in dictionary:
            dictionary[account] = {}
        if year not in dictionary[account]:
            dictionary[account][year] = {}
        if month not in dictionary[account][year]:
            dictionary[account][year][month] = value
        

    def getValue(self, account, year, month):
        if account not in self.accumulatedBudget:
            raise FavaAPIError("Account " + str(account) + " not found in budget or actuals")

        if year not in self.accumulatedBudget[account]:
            return 0
        
        if month not in self.accumulatedBudget[account][year]:
            return 0

        return self.accumulatedBudget[account][year][month]

    def getYtDSummary(self, baseAccount, year, month):
        value = 0

        for i in range(1, month + 1):
            value += self.getValue(baseAccount, year, i)

        return value

    def getYtDBreakdown(self, year, month):
        output = {}
        for account in self.accumulatedBudget:
            value = 0
            for i in range(1, month + 1):
                value += self.getValue(account, year, i)

            output[account] = value

        return output

    def printBudget(self):
        for account in self.budget.keys():
            print(account, end="\n")
            for year in self.budget[account].keys():
                print("    BASE " + str(year)  +": ", end = "")
                for month in self.budget[account][year].keys():
                    print(self.budget[account][year][month], end="    ")
                print("")
                print("    ACCC " + str(year)  +": ", end = "")
                for month in self.accumulatedBudget[account][year].keys():
                    print(self.accumulatedBudget[account][year][month], end="    ")
                print("")

                print("")
            print("")
