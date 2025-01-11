class CostSummary:
    
    def __init__(self, elements):
        self.budget = {}
        self.accumulatedBudget = {}

        self.incomeRoot = "Income"
        self.expensesRoot = "Expenses"


    def _initializeDictionary(self, elements):
        # Step 1 - Load the initiail values
        minYear = 10000
        maxYear = 0
        for element in elements:
            acc = element["account"]
            year = element["year"]
            values = elements["values"]

            if year < minYear:
                minYear = year
            if year > maxYear:
                maxYear = year

            for i in range(len(values)):
                month = values[i][0]
                value = values[i][1]
                self._setIfNotExists(self.budget, year, month, value)

        # Step 2 fill in "gaps" across all accounts
        for account in self.budget.keys():
            for year in range(minYear, maxYear + 1):
                for month in range(1, 12+1):
                    self._setIfNotExists(self.budget, accountt, year, month, 0)

        # Step 3: Traverse the account hierarchy & set in the accumulated budget
        for account in self.budget.keys():
            parentAccounts = account.split(":")
            for year in range(minYear, maxYear + 1):
                for month in range(1, 12+1):
                    value = self.budget[account][year][month]
                    for i in range(1, len(parentAccounts)+1):
                        parentAccount = ":".join(parentAccounts[0:i])
                        self._increase(self, dictionary, account, year, month, value)

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
        

    def getYtDSummary(self, year, month):
        incomeSummary = 0
        expenseSummary = 0
        for i in range(1, month + 1):
            incomeSummary += self.accumulatedBudget[self.incomeRoot][year][str(i)]
            expenseSummary += self.accumulatedBudget[self.expensesRoot][year][str(i)]

        return {
            "income": incomeSummary,
            "expenses": expenseSummary,
            "profit": incomeSummary - expenseSummary
        }

    def getYtDBreakdown(self, year, month):
        output = {}
        for account in self.accumulatedBudget:
            incomeSummary = 0
            expenseSummary = 0
            for i in range(1, month + 1):
                incomeSummary += self.accumulatedBudget[self.incomeRoot][year][str(i)]
                expenseSummary += self.accumulatedBudget[self.expensesRoot][year][str(i)]

            output[account] = {
                "income": incomeSummary,
                "expenses": expenseSummary,
                "profit": incomeSummary - expenseSummary
            }

        return output

    def printBudget(self):
        for account in self.budget.keys():
            print(account, end="    ")
            for year in self.budget[account].keys():
                print("    " + year  +": ", end = "")
                for month in self.budget[account][year].keys():
                    print(self.budget[account][year][month], end="    ")
            print("")

