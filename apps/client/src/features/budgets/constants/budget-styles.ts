export const BUDGET_STYLES = {
  TRADITIONAL: "traditional",
  FLEX_BUCKET: "flex_bucket",
  GLOBAL_LIMIT: "global_limit",
  ZERO_BASED: "zero_based",
  PERCENTAGE_BASED: "percentage_based",
} as const;

export type BudgetStyle = (typeof BUDGET_STYLES)[keyof typeof BUDGET_STYLES];

export interface BudgetStyleOption {
  id: BudgetStyle;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  icon: string;
  bestFor: string;
}

export const BUDGET_STYLE_OPTIONS: BudgetStyleOption[] = [
  {
    id: BUDGET_STYLES.TRADITIONAL,
    title: "Traditional Category Budgets",
    description: "Allocate specific amounts to individual spending categories each month. Perfect for detailed tracking.",
    pros: [
      "Detailed control per category",
      "Clear spending limits",
      "Easy to track overspending",
      "Great for planning ahead",
    ],
    cons: [
      "Requires regular maintenance",
      "Less flexibility between categories",
      "Can feel restrictive",
    ],
    icon: "LayoutList",
    bestFor: "People who like detailed control and want to track every category separately",
  },
  {
    id: BUDGET_STYLES.FLEX_BUCKET,
    title: "Flex Bucket System",
    description: "Single flexible spending pool that adapts to your lifestyle. Money flows naturally where you need it.",
    pros: [
      "Maximum flexibility",
      "Less mental overhead",
      "Adapts to changing needs",
      "Simple to maintain",
    ],
    cons: [
      "Less granular control",
      "Harder to identify problem areas",
      "May lead to overspending in some areas",
    ],
    icon: "Droplets",
    bestFor: "People with variable spending patterns who want simplicity over rigid categories",
  },
  {
    id: BUDGET_STYLES.GLOBAL_LIMIT,
    title: "Global Spending Limit",
    description: "Set one total spending cap and track against it. The simplest approach to budgeting.",
    pros: [
      "Extremely simple",
      "No category management",
      "Quick to set up",
      "Low maintenance",
    ],
    cons: [
      "No category insights",
      "Limited visibility into spending patterns",
      "Harder to optimize",
    ],
    icon: "Target",
    bestFor: "Minimalists who want the simplest possible budget with just one number to track",
  },
  {
    id: BUDGET_STYLES.ZERO_BASED,
    title: "Zero-Based Budgeting",
    description: "Assign every dollar a job. Income minus expenses equals zero. Complete financial control.",
    pros: [
      "Complete money control",
      "Forces intentional spending",
      "No money left unassigned",
      "Builds financial discipline",
    ],
    cons: [
      "Time-intensive setup",
      "Requires regular updates",
      "Can feel overwhelming at first",
    ],
    icon: "Calculator",
    bestFor: "Financial enthusiasts who want complete control and are willing to invest time",
  },
  {
    id: BUDGET_STYLES.PERCENTAGE_BASED,
    title: "Percentage-Based Budgeting",
    description: "Automated allocation using proven frameworks like 50/30/20 (needs/wants/savings).",
    pros: [
      "Proven frameworks",
      "Automatic calculations",
      "Scales with income",
      "Easy to understand",
    ],
    cons: [
      "Less customization",
      "May not fit unique situations",
      "Requires income tracking",
    ],
    icon: "PieChart",
    bestFor: "People who want a balanced, automatic approach based on proven financial rules",
  },
];

export const PERCENTAGE_TEMPLATES = [
  {
    id: "50-30-20",
    name: "50/30/20 Rule",
    description: "Balanced approach for most lifestyles",
    allocations: {
      needs: 50,
      wants: 30,
      savings: 20,
    },
  },
  {
    id: "60-20-20",
    name: "60/20/20 Rule",
    description: "Higher needs, balanced wants and savings",
    allocations: {
      needs: 60,
      wants: 20,
      savings: 20,
    },
  },
  {
    id: "70-20-10",
    name: "70/20/10 Rule",
    description: "Focus on essentials, moderate savings",
    allocations: {
      needs: 70,
      wants: 20,
      savings: 10,
    },
  },
  {
    id: "80-10-10",
    name: "80/10/10 Rule",
    description: "High essential spending, minimal wants",
    allocations: {
      needs: 80,
      wants: 10,
      savings: 10,
    },
  },
];

export const BUDGET_FREQUENCIES = {
  MONTHLY: "monthly",
  WEEKLY: "weekly",
  YEARLY: "yearly",
} as const;

export type BudgetFrequency = (typeof BUDGET_FREQUENCIES)[keyof typeof BUDGET_FREQUENCIES];
