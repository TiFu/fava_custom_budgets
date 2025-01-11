class Budget:

    def __init__(self, isAssetBudget):
        self.isAssetBudget = isAssetBudget
        self.budget = {}
        self.accumulatedBudget = {}
        self.hasBudgetBeenAccumulated = False

        self.incomeRoot = "Income"
        self.expensesRoot = "Expenses"

    def getYtDSummary(self, year, month):
        self._refreshAccumulatedBudget()
        year = str(year)
        print(self.accumulatedBudget.keys())

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
        self._refreshAccumulatedBudget()
        year = str(year)

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

    def setStartAmount(self, account, year, budget):
        self.setBudget(account, year, "_start", budget)

    def setBudget(self, account, year, month, budget):
        self.budgetAccumulated = False
        year = str(year)
        month = str(month)

        if account not in self.budget:
            self.budget[account] = {}

        if year not in self.budget[account]:
            self.budget[account][year] = {}
        
        self.budget[account][year][month] = budget

    def _increaseBudget(self, account,year, month, budget):
        year = str(year)
        month = str(month)

        if account not in self.accumulatedBudget:
            self.accumulatedBudget[account] = {}

        if year not in self.accumulatedBudget[account]:
            self.accumulatedBudget[account][year] = {}


        if month not in self.accumulatedBudget[account][year]:
            self.accumulatedBudget[account][year][month] = 0

        self.accumulatedBudget[account][year][month] += budget
    
    def _getBudget(self, account, year, month):
        if account not in self.budget:
            return 0
        
        if str(year) not in self.budget[account]:
            return 0

        if str(month) not in self.budget[account][str(year)]:
            return 0
        else:
            return self.budget[account][str(year)][str(month)]

    # ToDo: BFS across account hierarchy would be better but YOLO
    def _refreshAccumulatedBudget(self):
        # TBD
        if self.budgetAccumulated:
            return

        self.budgetAccumulated = True
        self.accumulatedBudget = {}

        for a in self.budget.keys():
            parentAccounts = a.split(":")
            for y in self.budget[a].keys():

                # If there's a start budget, we do this...
                if self.isAssetBudget:
                    for i in range(1, len(parentAccounts)+1):
                        parentAccount = ":".join(parentAccounts[0:i])
                        self._increaseBudget(parentAccount, y, 1, self._getBudget(a, y, "_start"))

                print(self.budget[a][y].keys())
                print("----------------")
                for m in range(1, 12+1):
                    m = str(m)
                    for i in range(1, len(parentAccounts)+1):
                        parentAccount = ":".join(parentAccounts[0:i])
                        self._increaseBudget(parentAccount, y, m, self._getBudget(a, y, m))

        if self.isAssetBudget:
            for a in self.accumulatedBudget.keys():
                for y in self.accumulatedBudget[a].keys():
                    for m in range(2, 12+1):
                        self._increaseBudget(a, y, m, self._getBudget(a, y, m-1)) # Sum up budgets over entire year
        #else:
        #    for a in self.accumulatedBudget.keys():
        #        for y in self.accumulatedBudget[a].keys():
        #            annualBudget = 0
        #            quarterlyBudget = 0
        #            for m in range(1, 12+1):
        #                annualBudget += self.accumulatedBudget[a][y][str(m)]
        #                quarterlyBudget += self.accumulatedBudget[a][y][str(m)]
        #                if m % 3 == 0:
        #                    self.accumulatedBudget[a][y]["q" + str(m // 3)] = quarterlyBudget
        #                    quarterlyBudget = 0
#
        #            self.accumulatedBudget[a][y]["annual"] = annualBudget

    def printBudget(self):
        for account in self.budget.keys():
            print(account, end="    ")
            for year in self.budget[account].keys():
                print("    " + year  +": ", end = "")
                for month in self.budget[account][year].keys():
                    print(self.budget[account][year][month], end="    ")
            print("")


class BudgetSummary:

    def __init__(self):
        self.incomeExpenseBudget = Budget(False)
        self.assetBudget = Budget(True)

    def getIncomeBudget(self):
        return self.incomeExpenseBudget

    def getAssetBudget(self):
        return self.assetBudget

    # TODO: add validation
    # Budgets that are *not* an account need to be errored for inc/exp budget
    # Format errors need to be raised (eg number of inputs)
    def refresh(self, ledger):
        self.incomeExpenseBudget = Budget(False)
        self.assetBudget = Budget(True)
        print("Parsing custom")
        # Parse custom
        customs = ledger.all_entries_by_type.Custom
        for entry in customs:
            if entry.type == "asset_budget": # Structure is budget_name start_value january_value february_value [...] december_value
                year = entry.date.year
                values = entry.values
                name = entry.values[0].value
                start = entry.values[1].value
                monthlyValues = list(map(lambda x: x.value, entry.values[2:]))

                self.assetBudget.setStartAmount(name, year, start)
                month = 1
                for value in monthlyValues:
                    self.assetBudget.setBudget(name, year, month, value)
                    month += 1

            elif entry.type == "income_expense_budget":
                year = entry.date.year
                values = entry.values
                account = entry.values[0].value
                monthlyValues = list(map(lambda x: x.value, entry.values[1:]))

                month = 1
                for value in monthlyValues:
                    self.incomeExpenseBudget.setBudget(account, year, month, value)
                    month += 1
            else:
                pass
        


        self.incomeExpenseBudget.printBudget()
        self.assetBudget.printBudget()