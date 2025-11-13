export type WidgetSize = 'small' | 'medium' | 'large';

export type WidgetType =
  | 'net-worth-chart'
  | 'accounts-list'
  | 'recent-transactions'
  | 'spending-by-category'
  | 'income-vs-expenses'
  | 'monthly-summary';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  description: string;
  defaultSize: WidgetSize;
  icon: string;
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  size: WidgetSize;
  position: number;
  isLocked: boolean;
}

export interface DashboardLayout {
  widgets: DashboardWidget[];
}

export const AVAILABLE_WIDGETS: WidgetConfig[] = [
  {
    id: 'net-worth-chart',
    type: 'net-worth-chart',
    title: 'Net Worth Chart',
    description: 'Track your net worth over time',
    defaultSize: 'large',
    icon: 'line-chart-line',
  },
  {
    id: 'accounts-list',
    type: 'accounts-list',
    title: 'Accounts',
    description: 'View all your accounts at a glance',
    defaultSize: 'medium',
    icon: 'wallet-3-line',
  },
  {
    id: 'recent-transactions',
    type: 'recent-transactions',
    title: 'Recent Transactions',
    description: 'See your latest transactions',
    defaultSize: 'medium',
    icon: 'exchange-line',
  },
  {
    id: 'spending-by-category',
    type: 'spending-by-category',
    title: 'Spending by Category',
    description: 'Analyze your spending patterns',
    defaultSize: 'large',
    icon: 'pie-chart-line',
  },
  {
    id: 'income-vs-expenses',
    type: 'income-vs-expenses',
    title: 'Income vs Expenses',
    description: 'Compare your income and expenses',
    defaultSize: 'medium',
    icon: 'bar-chart-line',
  },
  {
    id: 'monthly-summary',
    type: 'monthly-summary',
    title: 'Monthly Summary',
    description: 'Quick overview of this month',
    defaultSize: 'small',
    icon: 'calendar-line',
  },
];

export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayout = {
  widgets: [
    {
      id: 'net-worth-chart',
      type: 'net-worth-chart',
      size: 'large',
      position: 0,
      isLocked: false,
    },
    {
      id: 'accounts-list',
      type: 'accounts-list',
      size: 'medium',
      position: 1,
      isLocked: false,
    },
  ],
};
