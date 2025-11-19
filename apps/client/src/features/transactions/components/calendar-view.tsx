import { useState, useMemo } from "react";
import { Calendar } from "@/core/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, addMonths, subMonths, subDays } from "date-fns";
import { useTransactions } from "../services/transaction.queries";
import { TableRecordSchema } from "@/features/transactions/services/transaction.types";

const DUMMY_CALENDAR_DATA = {
  data: [
    {
      date: subDays(new Date(), 1),
      id: "group-1",
      total: -137.32,
      transactions: [
        {
          id: "dummy-cal-1",
          description: "Whole Foods Market",
          amount: -85.32,
          type: "expense" as const,
          transaction_datetime: subDays(new Date(), 1),
          is_external: true,
          category: { id: "cat-1", name: "Groceries", icon: "🛒", type: "expense" as const },
          account: { id: "acc-1", name: "Chase Checking", type: "checking" as const },
        },
        {
          id: "dummy-cal-2",
          description: "Gas Station",
          amount: -52.0,
          type: "expense" as const,
          transaction_datetime: subDays(new Date(), 1),
          is_external: true,
          category: { id: "cat-2", name: "Transportation", icon: "🚗", type: "expense" as const },
          account: { id: "acc-1", name: "Chase Checking", type: "checking" as const },
        },
      ],
    },
    {
      date: subDays(new Date(), 3),
      id: "group-2",
      total: 5000.0,
      transactions: [
        {
          id: "dummy-cal-3",
          description: "Monthly Salary",
          amount: 5000.0,
          type: "income" as const,
          transaction_datetime: subDays(new Date(), 3),
          is_external: true,
          category: { id: "cat-3", name: "Salary", icon: "💰", type: "income" as const },
          account: { id: "acc-1", name: "Chase Checking", type: "checking" as const },
        },
      ],
    },
    {
      date: subDays(new Date(), 5),
      id: "group-3",
      total: -15.99,
      transactions: [
        {
          id: "dummy-cal-4",
          description: "Netflix Subscription",
          amount: -15.99,
          type: "expense" as const,
          transaction_datetime: subDays(new Date(), 5),
          is_external: true,
          category: { id: "cat-4", name: "Entertainment", icon: "🎬", type: "expense" as const },
          account: { id: "acc-3", name: "Credit Card", type: "credit" as const },
        },
      ],
    },
  ],
  pagination: { total_items: 3, page: 1, limit: 50, total_pages: 1 },
};

interface CalendarViewProps {
  initialPage?: number;
  hasAccounts?: boolean;
}

export function CalendarView({ initialPage = 1, hasAccounts }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Get the start and end of the month for the calendar
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const { data: realTransactionsData, isLoading } = useTransactions({
    page: initialPage,
    q: "",
    group_by: "date",
    start_date: monthStart.toISOString().split('T')[0],
    end_date: monthEnd.toISOString().split('T')[0],
    enabled: hasAccounts === true,
  });

  const transactionsData = hasAccounts ? realTransactionsData : DUMMY_CALENDAR_DATA;

  // Create a map of dates to transactions for easy lookup
  const transactionsByDate = useMemo(() => {
    if (!transactionsData?.data) return new Map();

    const map = new Map<string, TableRecordSchema[]>();

    transactionsData.data.forEach((dayGroup) => {
      const dateKey = format(dayGroup.date, 'yyyy-MM-dd');
      map.set(dateKey, dayGroup.transactions);
    });

    return map;
  }, [transactionsData]);

  // Get transactions for the selected date
  const selectedDateTransactions = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return transactionsByDate.get(dateKey) || [];
  }, [selectedDate, transactionsByDate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(amount));
  };

  const getTransactionTypeColor = (type: string, amount: number) => {
    if (type === "transfer") return "blue";
    return amount >= 0 ? "green" : "red";
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg font-semibold">
              {format(currentDate, 'MMMM yyyy')}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={currentDate}
                onMonthChange={setCurrentDate}
                className="w-full"
                modifiers={{
                  hasTransactions: (date) => {
                    const dateKey = format(date, 'yyyy-MM-dd');
                    const dayTransactions = transactionsByDate.get(dateKey) || [];
                    return dayTransactions.length > 0;
                  }
                }}
                modifiersClassNames={{
                  hasTransactions: "bg-primary/10 font-semibold"
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Selected Date Transactions */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateTransactions.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No transactions on this date
              </p>
            ) : (
              <div className="space-y-3">
                {selectedDateTransactions.map((transaction: TableRecordSchema) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-sm">{transaction.description}</p>
                        <Badge
                          variant="outline"
                          className={`text-xs ${getTransactionTypeColor(transaction.type, transaction.amount) === 'red'
                            ? 'border-red-200 text-red-700'
                            : getTransactionTypeColor(transaction.type, transaction.amount) === 'green'
                              ? 'border-green-200 text-green-700'
                              : 'border-blue-200 text-blue-700'
                            }`}
                        >
                          {transaction.type}
                        </Badge>
                      </div>
                      {transaction.category && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {transaction.category.name}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {transaction.account.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
