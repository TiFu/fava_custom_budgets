
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