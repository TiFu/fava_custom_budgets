from datetime import datetime


class IncomeExpenseReportService:

    def __init__(self, budgetSummary, incomeSummary, expensesSummary):
        self.budgetSummary = budgetSummary
        self.incomeSummary = incomeSummary
        self.expensesSummary = expensesSummary

    def getYtDSummary(self, year, currentMonth):
        incomeBudget = self.budgetSummary.getYtDSummary("Income", year, currentMonth)
        incomeNumbers = self.incomeSummary.getYtDSummary("Income", year, currentMonth)
        
        
        expenseBudget = self.budgetSummary.getYtDSummary("Expenses", year, currentMonth)
        expensesNumbers = self.expensesSummary.getYtDSummary("Expenses", year, currentMonth)

        return {
            "year": year,
            "month": currentMonth,
            "income": {
                "budget": incomeBudget,
                "actuals": incomeNumbers
            }, 
            "expenses": {
                "budget": expenseBudget,
                "actuals": expensesNumbers
            },
            "profits": {
                "budget": incomeBudget - expenseBudget,
                "actuals": incomeNumbers - expensesNumbers
            }
        }


    def getYtDBreakdown(self, year, currentMonth):
        budget = self.budgetSummary.getYtDBreakdown(year, currentMonth)
        incomeNumbers = self.incomeSummary.getYtDBreakdown(year, currentMonth)        
        expensesNumbers = self.expensesSummary.getYtDBreakdown(year, currentMonth)

        incomeBudget = {} 
        expenseBudget = {}
        for account in budget.keys():
            if account.startswith("Income"):
                incomeBudget[account] = budget[account]
            elif account.startswith("Expenses"):
                expenseBudget[account] = budget[account]

        return {
            "year": year,
            "month": currentMonth,
            "income": {
                "budget": incomeBudget,
                "actuals": incomeNumbers
            }, 
            "expenses": {
                "budget": expenseBudget,
                "actuals": expensesNumbers
            }
        }

