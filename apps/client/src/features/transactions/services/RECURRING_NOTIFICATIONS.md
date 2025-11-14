# Recurring Transaction Notification System

This system integrates the recurring transaction generator with the notification system to provide an offline-first, CRDT-based approach to handling recurring transactions.

## Architecture

### Components

1. **Recurring Instance Generator** (`recurring-instance-generator.ts`)
   - Pure function that generates recurring transaction instances
   - Supports all frequency types: daily, weekly, biweekly, monthly, yearly, custom
   - Handles complex patterns: "first Monday", "last weekday", "1st and 15th", weekdays only

2. **Recurring Processor Service** (`recurring-processor.service.ts`)
   - Main orchestration service
   - Processes recurring transactions by generating instances and creating notifications/transactions
   - Handles both auto-post and manual review workflows

3. **Notification Service** (`notification.service.ts`)
   - CRDT-based service for managing notifications
   - Stores notification state offline-first with eventual consistency

4. **React Query Hooks**
   - `useProcessRecurringTransactions` - Process all recurring transactions
   - `useCreateTransactionFromRecurring` - Create a transaction from a recurring transaction
   - `useCreateDueNotification` - Create a notification for a due recurring transaction
   - `useAutoProcessRecurring` - Auto-process recurring transactions on mount

## Workflows

### Auto-Post Workflow (auto_post: true)

1. Processor generates instances for the next N days
2. For each instance:
   - Check if already processed (by looking for existing notifications)
   - If not processed:
     - Create transaction with `status: 'posted'`
     - Create notification with `status: 'actioned'` (informational)
     - Link notification to transaction

### Manual Review Workflow (auto_post: false)

1. Processor generates instances for the next N days
2. For each instance:
   - Check if already processed
   - If not processed:
     - Create notification with `status: 'unread'`
     - User reviews notification in inbox
     - User can post, skip, or modify the transaction
     - When posted, notification status changes to `actioned`

## Usage

### Basic Usage

```typescript
import { useAutoProcessRecurring } from "@/features/transactions/services/recurring-processor.hooks";
import { useRecurringTransactions } from "@/features/transactions/services/recurring-transaction.queries";

function DashboardLayout() {
  const { data: recurringTransactions } = useRecurringTransactions();
  const userId = useAuthStore((state) => state.user?.id);

  useAutoProcessRecurring({
    recurringTransactions: recurringTransactions || [],
    userId: userId || "",
    lookAheadDays: 7,
    enabled: !!userId,
    onSuccess: (result) => {
      console.log(`Created ${result.notificationsCreated} notifications`);
      console.log(`Created ${result.transactionsCreated} transactions`);
    },
  });

  return <div>...</div>;
}
```

### Manual Processing

```typescript
import { useProcessRecurringTransactions } from "@/features/transactions/services/recurring-processor.mutations";

function RecurringTransactionsPage() {
  const { mutate: processRecurring } = useProcessRecurringTransactions();
  const { data: recurringTransactions } = useRecurringTransactions();
  const userId = useAuthStore((state) => state.user?.id);

  const handleProcess = () => {
    processRecurring({
      recurringTransactions: recurringTransactions || [],
      userId: userId || "",
      lookAheadDays: 30,
    });
  };

  return <button onClick={handleProcess}>Process Recurring Transactions</button>;
}
```

### Manual Transaction Creation

```typescript
import { useCreateTransactionFromRecurring } from "@/features/transactions/services/recurring-processor.mutations";

function RecurringInstanceCard({ recurring, dueDate }) {
  const { mutate: createTransaction } = useCreateTransactionFromRecurring();
  const userId = useAuthStore((state) => state.user?.id);

  const handlePost = () => {
    createTransaction({
      recurring,
      dueDate,
      userId: userId || "",
    });
  };

  return <button onClick={handlePost}>Post Transaction</button>;
}
```

## When Processing Occurs

The processor should be triggered in the following scenarios:

1. **App Launch** - Process when app initializes
2. **Calendar View** - Process when viewing calendar/schedule
3. **Dashboard Load** - Process on dashboard mount
4. **Manual Trigger** - User clicks "Process Recurring" button
5. **After Creating Recurring Transaction** - Process immediately after creation

## Data Flow

```
RecurringTransaction (CRDT)
  ↓
RecurringInstanceGenerator
  ↓
RecurringProcessorService
  ↓
  ├─→ auto_post: true
  │     ↓
  │   TransactionService.createTransaction()
  │     ↓
  │   NotificationService.create(type: 'recurring_transaction_due', status: 'actioned')
  │
  └─→ auto_post: false
        ↓
      NotificationService.create(type: 'recurring_transaction_due', status: 'unread')
        ↓
      User reviews in inbox
        ↓
      User posts → TransactionService.createTransaction()
        ↓
      NotificationService.markAsActioned()
```

## Database Schema

### Notifications Table

- `id` - UUID
- `type` - enum (recurring_transaction_due, etc.)
- `status` - enum (unread, read, archived, actioned)
- `priority` - enum (low, medium, high, urgent)
- `related_recurring_id` - UUID (links to recurring transaction)
- `related_transaction_id` - UUID (links to created transaction if posted)
- `data` - JSON (stores due_date, amount, etc.)
- CRDT fields: `hlc`, `node_id`

### Transactions Table

- Existing table with new `status` column added
- `status` - enum (draft, pending, posted, reconciled)

## Priority Calculation

- **Urgent** - Overdue (past due date)
- **High** - Due today
- **Medium** - Due within 2 days
- **Low** - Due within 7 days

## Deduplication

The processor checks if an instance has already been processed by:
1. Querying notifications by `related_recurring_id`
2. Filtering by `due_date` in the notification data
3. Skipping if a notification already exists for that date

This ensures idempotency when the processor runs multiple times.

## Future Enhancements

1. **Background Processing** - Use Web Workers or Service Workers for processing
2. **Smart Scheduling** - Process only when needed based on last run time
3. **Batch Notifications** - Group multiple recurring transactions into a single notification
4. **Notification Preferences** - Allow users to customize notification timing
5. **Retry Logic** - Automatically retry failed auto-post transactions
