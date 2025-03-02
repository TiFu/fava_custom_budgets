from fava.ext import FavaExtensionBase, extension_endpoint
from fava_budgets.actuals import ActualIncomeExpenseSummary
from flask import jsonify
from datetime import datetime

from fava_budgets.services.BudgetReportServices import IncomeExpenseReportService
from fava_budgets.services.AssetBudgetReportService import AssetBudgetReportService

from fava_budgets.services.Loaders import BudgetLoader, PriceDatabaseLoader, ActualsLoader, FavaLedgerHelper, AssetBudgetLoader
class BudgetContext:
    pass

class BudgetFavaPlugin(FavaExtensionBase):
    report_title = "Budget"
    has_js_module = True

    custom_extension_type = ""

    budgetLoader = BudgetLoader()
    incomeActualsLoader = ActualsLoader("EUR", "Income")
    expensesActualsLoader = ActualsLoader("EUR", "Expenses")
    assetBudgetLoader = AssetBudgetLoader()
    priceDatabaseLoader = PriceDatabaseLoader("EUR")

    budgetReportService = None
    budgetSummary = None
    incomeSummary  = None
    expensesSummary = None

    def after_load_file(self):
        self.budgetSummary = self.budgetLoader.loadLedger(self.ledger)
        self.incomeSummary = self.incomeActualsLoader.loadLedger(self.ledger)
        self.expensesSummary = self.expensesActualsLoader.loadLedger(self.ledger)

        favaLedger = FavaLedgerHelper(self.ledger)
        self.priceDatabase = self.priceDatabaseLoader.loadLedger(favaLedger)
        self.assetBudgetInformation = self.assetBudgetLoader.loadLedger(favaLedger)

        self.assetBudgetReportService = AssetBudgetReportService(self.assetBudgetInformation, self.priceDatabase)
        
        self.budgetReportService = IncomeExpenseReportService(self.budgetSummary, self.incomeSummary, self.expensesSummary)

    # TODO: We can optimize load times here by pre-calculating everything & then just sending whatever is needed from bootstrap

    @extension_endpoint("ytd_summary")
    def getYtDSummary(self):
        month = 12# datetime.now().month
        year = 2024#datetime.now().year
        
        return self.budgetReportService.getYtDSummary(year, month)


    @extension_endpoint("ytd_breakdown")
    def getYtDBreakdown(self):
        month = 12# datetime.now().month
        year = 2024 #datetime.now().year
        
        return self.budgetReportService.getYtDBreakdown(year, month)

    def bootstrapIncomeExpenseBudget(self):
        return {
            "budgets": self.getBudgets(),
            "actuals": {
                "Income": self.getIncome(),
                "Expenses": self.getExpenses()
            }
        }

    def bootstrapAssetBudget(self):
        
        result = {
            "budgetBalance": self.assetBudgetReportService.getBudgetBalances(),
            "accountBalance": self.assetBudgetReportService.getAccountBalances(),
            "accounts": self.assetBudgetReportService.getBudgetedAccounts(),
            "budgets": self.assetBudgetReportService.getBudgets().getSummary()
        }
        return result

    @extension_endpoint("budget")
    def getBudgets(self):
        return {
            "Income": self.budgetSummary["Income"].getSummary(),
            "Expenses": self.budgetSummary["Expenses"].getSummary()
        }
        
    @extension_endpoint("actuals_income")
    def getIncome(self):
        return self.incomeSummary.getSummary()


    @extension_endpoint("actuals_expenses")
    def getExpenses(self):
        return self.expensesSummary.getSummary()
