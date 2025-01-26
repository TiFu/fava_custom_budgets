from datetime import datetime


class IncomeExpenseReportService:

    def __init__(self, budgetSummary, incomeSummary, expensesSummary):
        self.budgetSummary = budgetSummary
        self.incomeSummary = incomeSummary
        self.expensesSummary = expensesSummary

    def getYtDSummary(self, year, currentMonth):
        incomeBudget = self.budgetSummary["Income"].getYtDSummary("Income", year, currentMonth)
        incomeNumbers = self.incomeSummary.getYtDSummary("Income", year, currentMonth)
        
        
        expenseBudget = self.budgetSummary["Expenses"].getYtDSummary("Expenses", year, currentMonth)
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
        incomeBudget = self.budgetSummary["Income"].getYtDBreakdown(year, currentMonth)
        incomeNumbers = self.incomeSummary.getYtDBreakdown(year, currentMonth)        
        expensesNumbers = self.expensesSummary.getYtDBreakdown(year, currentMonth)
        expenseBudget = self.budgetSummary["Expenses"].getYtDBreakdown(year, currentMonth)

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

