from beanquery.query import run_query  # type: ignore
from fava.context import g
from fava.helpers import FavaAPIError
from collections import namedtuple

class ActualIncomeExpenseSummary:

    def __init__(self):
        self.output_dict = None
        self.accumulated_dict = None
        self.incomeRoot = "Income"
        self.expensesRoot = "Expenses"

    def getYtDSummary(self, year, month):
        print("Keys in Actuals")
        print(sorted(list(self.output_dict.keys())))
        incomeSummary = 0
        expenseSummary = 0
        year = str(year)

        for i in range(1, month + 1):
            i = str(i)
            incomeSummary += self.accumulated_dict[self.incomeRoot][year][i]
            expenseSummary += self.accumulated_dict[self.expensesRoot][year][i]

        return {
            "income": incomeSummary,
            "expenses": expenseSummary,
            "profit": incomeSummary - expenseSummary
        }

    def getYtDBreakdown(self, year, month):
        year = str(year)

        output = {}
        for account in self.output_dict:
            incomeSummary = 0
            expenseSummary = 0
            for i in range(1, month + 1):
                incomeSummary += self.output_dict[self.incomeRoot][year][str(i)]
                expenseSummary += self.output_dict[self.expensesRoot][year][str(i)]

            output[account] = {
                "income": incomeSummary,
                "expenses": expenseSummary,
                "profit": incomeSummary - expenseSummary
            }

        return output


        