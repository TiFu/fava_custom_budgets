from fava.ext import FavaExtensionBase, extension_endpoint
from fava_budgets.calculators import BudgetSummary
from fava_budgets.actuals import ActualIncomeExpenseSummary
from flask import jsonify
from datetime import datetime

from fava_budgets.BudgetReportServices import IncomeExpenseReportService

class BudgetContext:
    pass

class BudgetFavaPlugin(FavaExtensionBase):
    report_title = "Budget"
    has_js_module = True

    custom_extension_type = ""

    calculator = BudgetSummary()
    actualsCalculator = ActualIncomeExpenseSummary()
    incomeExpenseReportService = None


    def after_load_file(self):
        self.calculator.refresh(self.ledger)
        self.actualsCalculator.calculateIncomeExpensesByMonth(self.ledger)
        incExpBudget = self.calculator.getIncomeBudget()
        actuals = self.actualsCalculator
        self.incomeExpenseReportService = IncomeExpenseReportService(incExpBudget, self.actualsCalculator)


    @extension_endpoint("ytd_summary")
    def getYtDBudgetSummary(self):
        self.actualsCalculator.calculateIncomeExpensesByMonth(self.ledger)

        month = datetime.now().month + 6
        year = datetime.now().year - 1

        return self.incomeExpenseReportService.getYtDSummary(year, month)


        # 
    @extension_endpoint("budget")
    def getBudgets(self):
        return self.calculator.getIncomeBudget()
        
    @extension_endpoint("actuals")
    def getActuals(self):
        self.actualsCalculator.calculateIncomeExpensesByMonth(self.ledger)
        return self.actualsCalculator.output_dict
