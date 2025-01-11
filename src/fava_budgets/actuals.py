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

    def calculateIncomeExpensesByMonth(self, ledger):
        # TODO: use one of the main reporting currencies here...
        results = self.exec_query(ledger, "SELECT year, month, account, CONVERT(SUM(position), 'EUR') AS value where account ~'^Income:' or account ~ '^Expenses:' group by account, year, month order by account")
        print(results)
        self.output_dict = {}

        minYear = 10000
        maxYear = 0


        for result in results[1]:
            if result.year < minYear:
                minYear = result.year
            if result.year > maxYear:
                maxYear = result.year

            y = str(result.year)

            m = str(result.month)
            a = result.account

            if a not in self.output_dict:
                self.output_dict[a] = {}
            if y not in self.output_dict[a]:
                self.output_dict[a][y] = {}
            
            if result.value.get_only_position() is None:
                print(result.value)
                print("Did not get only position for " + str(result))
                self.output_dict[a][y][m] = -1
            else:
                self.output_dict[a][y][m] = result.value.get_only_position().units.number
        print("Before and after")
        print(self.output_dict["Income:Work:Sunrise:Salary"])
        for account in self.output_dict.keys():
            for year in range(minYear, maxYear + 1):
                year = str(year)
                if year not in self.output_dict[account]:
                    self.output_dict[account][year] = {}
                
                for month in range(1, 12+1):
                    month = str(month)
                    if month not in self.output_dict[account][year]:
                        self.output_dict[account][year][month] = 0
        
        print(self.output_dict["Income:Work:Sunrise:Salary"])
        # Aggregate balances up?
        self.accumulated_dict = {}
        for account in self.output_dict.keys():
            parentAccounts = account.split(":")
            for year in range(minYear, maxYear + 1):
                year = str(year)
                for month in range(1, 12+1):
                    month = str(month)
                    for i in range(1, len(parentAccounts)+1):
                        parentAccount = ":".join(parentAccounts[0:i])
                        if parentAccount not in self.accumulated_dict:
                            self.accumulated_dict[parentAccount] = {}

                        if year not in self.accumulated_dict[parentAccount]:
                            self.accumulated_dict[parentAccount][year] = {}

                        if month not in self.accumulated_dict[parentAccount][year]:
                            self.accumulated_dict[parentAccount][year][month] = 0

                        value = self.output_dict[account][year][month]
                        self.accumulated_dict[parentAccount][year][month] += value

    def exec_query(self, ledger, query):
        try:
            rtypes, rrows = run_query(ledger.all_entries, ledger.options, query)
        except Exception as ex:
            raise FavaAPIError(f"failed to execute query {query}: {ex}") from ex

        # convert to legacy beancount.query format for backwards compat
        result_row = namedtuple("ResultRow", [col.name for col in rtypes])
        rtypes = [(t.name, t.datatype) for t in rtypes]
        rrows = [result_row(*row) for row in rrows]

        return rtypes, rrows

        