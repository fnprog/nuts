import { WidgetType } from '../../lib/services/dashboard/dashboard.types';
import { AccountsListWidget } from './accounts-list-widget';
import { NetWorthChartWidget } from './net-worth-chart-widget';
import { RecentTransactionsWidget } from './recent-transactions-widget';
import { SpendingByCategoryWidget } from './spending-by-category-widget';
import { IncomeVsExpensesWidget } from './income-vs-expenses-widget';
import { MonthlySummaryWidget } from './monthly-summary-widget';

interface WidgetRendererProps {
  widgetType: WidgetType;
}

export function WidgetRenderer({ widgetType }: WidgetRendererProps) {
  switch (widgetType) {
    case 'accounts-list':
      return <AccountsListWidget />;
    case 'net-worth-chart':
      return <NetWorthChartWidget />;
    case 'recent-transactions':
      return <RecentTransactionsWidget />;
    case 'spending-by-category':
      return <SpendingByCategoryWidget />;
    case 'income-vs-expenses':
      return <IncomeVsExpensesWidget />;
    case 'monthly-summary':
      return <MonthlySummaryWidget />;
    default:
      return null;
  }
}
