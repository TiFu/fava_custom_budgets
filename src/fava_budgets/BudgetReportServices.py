from datetime import datetime


class IncomeExpenseReportService:

    def __init__(self, budget, incomeExpenseActualsSummary):
        self.budget = budget
        self.incomeExpenseActualsSummary = incomeExpenseActualsSummary

    def getYtDSummary(self, year, currentMonth):

        budgetNumbers = self.budget.getYtDSummary(year, currentMonth)
        actualNumbers = self.incomeExpenseActualsSummary.getYtDSummary(year, currentMonth)

        return {
            "year": year,
            "month": currentMonth,
            "budget": budgetNumbers,
            "actuals": actualNumbers
        }


    def getYtDBreakdown(self, year, currentMonth):

        budgetNumbers = self.budget.getYtDBreakdown(year, currentMonth)
        actualNumbers = self.incomeExpenseActualsSummary.getYtDBreakdown(year, currentMonth)

        return {
            "budget": budgetNumbers,
            "actuals": actualNumbers
        }
