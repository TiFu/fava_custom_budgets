# File Structure for Python

## API endpoints



* on_refresh_ledger
    loadBudget
    loadActuals & do all the precalculations
* /YtDSummary (-> Income, Expenses, Profit YtD)
* /YtDBreakdown (-> account level summary of income, expenses, profit)
* /budget
* /actuals

# Model

* BudgetLoader
* ActualsLoader
* Summary
    __init__(self, elements: { year, account, values}) # accumulated values adds up over the time period

    _initializeDictionary(self, elements)
        Step one: Initialize base
        Step two: Fill in empty values with zero
        Step three: Traverse account hierarchy
        (later Step four: Accumulate annual values)

    getValue(account, month, year) -> Decimal

* IncomeExpenseBudgetReportService
    getYtDSummary(year, month)
    getYtDBreakdown(year, month)

    getMonthBreakdown(year, month)