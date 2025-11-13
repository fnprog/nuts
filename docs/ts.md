## Core Philosophy
**Safety → Performance → Developer Experience**  
Be consistent, explicit, and simple. Offline-first means bulletproof data handling.

---

## 1. TYPE SAFETY WITH ARKTYPE

### Schema Definition
```typescript
import { type } from "arktype";

// Define schemas close to usage
const User = type({
  id: "string",
  name: "string",
  email: "email", // built-in validator
  "age?": "number", // optional
  createdAtMs: "number",
});

type User = typeof User.infer;

// Branded types for IDs
const UserId = type("string").narrow((s): s is UserId => {
  return s.length === 36; // UUID length
});
type UserId = typeof UserId.infer & { readonly brand: unique symbol };

// Discriminated unions
const Result = type({
  status: "'success' | 'error'",
  "data?": "unknown",
  "error?": "string",
});

// Nested schemas
const UserProfile = type({
  user: User,
  settings: {
    theme: "'light' | 'dark'",
    notifications: "boolean",
  },
});
```

### Validation at Boundaries
```typescript
// Validate ALL external data - API, localStorage, IndexedDB
function parseApiUser(data: unknown): Result<User, string> {
  const result = User(data);
  if (result instanceof type.errors) {
    return err(result.summary); // NeverThrow
  }
  return ok(result); // type-safe User
}

// Validate before storage
function saveUser(user: User): Result<void, string> {
  const validated = User(user);
  if (validated instanceof type.errors) {
    return err("Invalid user data");
  }
  localStorage.setItem("user", JSON.stringify(validated));
  return ok(undefined);
}

// Validate after retrieval
function loadUser(): Result<User, string> {
  const raw = localStorage.getItem("user");
  if (!raw) {
    return err("No user found");
  }
  
  try {
    const parsed = JSON.parse(raw);
    return parseApiUser(parsed);
  } catch {
    return err("Invalid JSON");
  }
}
```

### Don't Trust Anything
```typescript
// ❌ Don't assume localStorage data is valid
const user = JSON.parse(localStorage.getItem("user")!);

// ✅ Always validate
const userResult = loadUser();
if (userResult.isErr()) {
  // Handle corrupt data
  localStorage.removeItem("user");
  return;
}
const user = userResult.value;

// ❌ Don't assume API shape matches types
const data = await fetch("/api/user").then(r => r.json()) as User;

// ✅ Validate API responses
const response = await fetch("/api/user");
const data = await response.json();
const userResult = parseApiUser(data);
```

---

## 2. ERROR HANDLING WITH NEVERTHROW

### Result Type Everywhere
```typescript
import { Result, ok, err, ResultAsync } from "neverthrow";

// All functions that can fail return Result
function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return err("Division by zero");
  }
  return ok(a / b);
}

// Chain operations
function calculate(x: string, y: string): Result<number, string> {
  return parseNumber(x)
    .andThen(a => parseNumber(y).map(b => ({ a, b })))
    .andThen(({ a, b }) => divide(a, b));
}

// Async operations
function fetchUser(id: string): ResultAsync<User, string> {
  return ResultAsync.fromPromise(
    fetch(`/api/users/${id}`).then(r => r.json()),
    () => "Network error",
  ).andThen(data => ResultAsync.fromSafePromise(parseApiUser(data)));
}

// Combine multiple Results
function validateForm(data: unknown): Result<FormData, string[]> {
  const nameResult = validateName(data.name);
  const emailResult = validateEmail(data.email);
  
  return Result.combine([nameResult, emailResult])
    .map(([name, email]) => ({ name, email }));
}
```

### Never Throw in Application Code
```typescript
// ❌ Don't throw - errors become invisible
function getUser(id: string): User {
  const user = users.get(id);
  if (!user) {
    throw new Error("User not found"); // caller might not catch
  }
  return user;
}

// ✅ Return Result - errors are explicit in type signature
function getUser(id: string): Result<User, "not_found"> {
  const user = users.get(id);
  if (!user) {
    return err("not_found");
  }
  return ok(user);
}

// Exception: Programmer errors (assertions) should panic
function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error("Programmer error: division by zero should be checked");
  }
  return a / b;
}
```

### Handle Errors Once
```typescript
// ❌ Don't log and return error
function saveUser(user: User): Result<void, string> {
  const result = validateUser(user);
  if (result.isErr()) {
    console.error("Validation failed", result.error);
    return result; // caller also logs - duplicate
  }
  return ok(undefined);
}

// ✅ Return error, let caller decide
function saveUser(user: User): Result<void, string> {
  return validateUser(user)
    .andThen(valid => writeToStorage(valid));
}

// Caller handles once
const result = saveUser(user);
if (result.isErr()) {
  toast.error(`Failed to save: ${result.error}`);
  logger.error("Save failed", { error: result.error, user });
}
```

---


### Fixed Limits for Offline Storage
```typescript
// Set explicit bounds
const MAX_CACHED_ITEMS = 1000;
const MAX_STORAGE_BYTES = 50 * 1024 * 1024; // 50MB
const MAX_SYNC_QUEUE_SIZE = 100;
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Eviction policy when limits reached
function evictOldest(cache: Map<string, CachedItem>): Result<void, string> {
  if (cache.size < MAX_CACHED_ITEMS) {
    return ok(undefined);
  }
  
  const sorted = Array.from(cache.entries())
    .sort((a, b) => a[1].accessedAtMs - b[1].accessedAtMs);
  
  const toRemove = sorted.slice(0, cache.size - MAX_CACHED_ITEMS);
  for (const [key] of toRemove) {
    cache.delete(key);
  }
  
  return ok(undefined);
}
```

---

## 4. REACT PATTERNS

### Component Structure
```typescript
// Order: types → constants → component → hooks → helpers

// Types
interface UserCardProps {
  readonly userId: string;
  readonly onDelete?: (id: string) => void;
}

// Constants
const MAX_NAME_LENGTH = 50;

// Component (< 70 lines)
export function UserCard({ userId, onDelete }: UserCardProps) {
  const userResult = useUser(userId);
  
  if (userResult.isErr()) {
    return <ErrorDisplay error={userResult.error} />;
  }
  
  const user = userResult.value;
  
  return (
    <div>
      <h2>{user.name}</h2>
      {onDelete && (
        <button onClick={() => onDelete(user.id)}>Delete</button>
      )}
    </div>
  );
}

// Hooks
function useUser(id: string): Result<User, string> {
  const [result, setResult] = useState<Result<User, string>>(
    err("Loading...")
  );
  
  useEffect(() => {
    loadUser(id).match(
      user => setResult(ok(user)),
      error => setResult(err(error))
    );
  }, [id]);
  
  return result;
}
```

### State Management
```typescript
// Keep state minimal and derived
interface AppState {
  // Minimal state
  readonly users: ReadonlyMap<string, User>;
  readonly syncStatus: SyncStatus;

  // Don't store derived values
  // ❌ readonly userCount: number;
  // ❌ readonly sortedUsers: User[];
}

// Derive on render
function UserList({ state }: { state: AppState }) {
  const sortedUsers = useMemo(
    () => Array.from(state.users.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    ),
    [state.users]
  );
  
  return <>{sortedUsers.map(renderUser)}</>;
}

// Use zustand or reducer for complex state updates
```

### Data Fetching (react-query)

### Event Handlers
```typescript
// Keep handlers simple - delegate to functions
function UserForm() {
  const [name, setName] = useState("");
  
  // ❌ Don't inline complex logic
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const validated = validateName(name);
    if (validated.isErr()) {
      toast.error(validated.error);
      return;
    }
    saveUser({ name: validated.value }).match(
      () => toast.success("Saved"),
      err => toast.error(err)
    );
  };
  
  // ✅ Delegate to focused functions
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    submitForm({ name });
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}

function submitForm(data: { name: string }): Result<void, string> {
  return validateName(data.name)
    .andThen(name => saveUser({ name }))
    .match(
      () => { toast.success("Saved"); return ok(undefined); },
      error => { toast.error(error); return err(error); }
    );
}
```

### Props Validation
```typescript
// Define prop types with ArkType for runtime safety
const UserCardProps = type({
  userId: "string",
  "onDelete?": "unknown", // function type
  "className?": "string",
});

type UserCardProps = typeof UserCardProps.infer;

export function UserCard(props: unknown) {
  // Validate props if they come from external source
  const validated = UserCardProps(props);
  if (validated instanceof type.errors) {
    console.error("Invalid props", validated.summary);
    return null;
  }
  
  const { userId, onDelete, className } = validated;
  // Component logic
}

// For TypeScript-only props (internal), regular interface is fine
interface InternalProps {
  readonly user: User;
  readonly onChange: (user: User) => void;
}
```

---

## 5. PERFORMANCE

### Memoization
```typescript
// Use React.memo for expensive pure components
export const UserCard = React.memo(function UserCard({ user }: Props) {
  return <div>{user.name}</div>;
});

// Custom equality for complex props
export const UserList = React.memo(
  function UserList({ users }: { users: ReadonlyMap<string, User> }) {
    return <>{Array.from(users.values()).map(renderUser)}</>;
  },
  (prev, next) => prev.users === next.users // reference equality
);

// useMemo for expensive computations
function Analytics({ data }: { data: readonly DataPoint[] }) {
  const stats = useMemo(() => {
    // Expensive calculation
    return calculateStatistics(data);
  }, [data]);
  
  return <div>{stats.mean}</div>;
}

// useCallback for event handlers passed to children
function Parent() {
  const handleClick = useCallback((id: string) => {
    deleteItem(id);
  }, []); // stable reference
  
  return <Child onClick={handleClick} />;
}
```

### Virtualization
```typescript
// For long lists, use virtualization
import { useVirtualizer } from "@tanstack/react-virtual";

function UserList({ users }: { users: readonly User[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: users.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // row height
    overscan: 5,
  });
  
  return (
    <div ref={parentRef} style={{ height: "400px", overflow: "auto" }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(item => (
          <div key={item.key} style={{ height: `${item.size}px` }}>
            {users[item.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Code Splitting
```typescript
// Lazy load heavy components
const Dashboard = lazy(() => import("./Dashboard"));
const Settings = lazy(() => import("./Settings"));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}

// Preload on hover
function NavLink({ to, children }: Props) {
  const handleMouseEnter = () => {
    if (to === "/dashboard") {
      import("./Dashboard"); // preload
    }
  };
  
  return (
    <Link to={to} onMouseEnter={handleMouseEnter}>
      {children}
    </Link>
  );
}
```

### Batch Updates
```typescript
// React 18+ automatically batches, but for manual control:
import { unstable_batchedUpdates } from "react-dom";

function processItems(items: readonly Item[]) {
  unstable_batchedUpdates(() => {
    items.forEach(item => {
      updateItem(item); // all updates batched into single render
    });
  });
}

// Or use single setState with all changes
function processItems(items: readonly Item[]) {
  setState(prev => {
    const next = { ...prev };
    items.forEach(item => {
      next.items.set(item.id, item);
    });
    return next;
  });
}
```

---
---
## 7. ANTI-PATTERNS

```typescript
// ❌ Don't store functions in state
const [handler, setHandler] = useState(() => doSomething);

// ✅ Use refs or define outside component
const handlerRef = useRef(doSomething);

// ❌ Don't mutate state directly
setState(prev => {
  prev.items.push(newItem); // mutation!
  return prev;
});

// ✅ Return new object
setState(prev => ({
  ...prev,
  items: [...prev.items, newItem],
}));

// ❌ Don't use index as key for dynamic lists
{items.map((item, i) => <div key={i}>{item}</div>)}

// ✅ Use stable IDs
{items.map(item => <div key={item.id}>{item}</div>)}

// ❌ Don't call hooks conditionally
if (condition) {
  useEffect(() => {}, []); // breaks rules of hooks
}

// ✅ Put condition inside hook
useEffect(() => {
  if (condition) {
    // logic
  }
}, [condition]);

// ❌ Don't forget cleanup
useEffect(() => {
  const interval = setInterval(doWork, 1000);
  // missing cleanup - memory leak!
}, []);

// ✅ Return cleanup function
useEffect(() => {
  const interval = setInterval(doWork, 1000);
  return () => clearInterval(interval);
}, []);

// ❌ Don't trust external data without validation
const user = await response.json() as User;

// ✅ Always validate with ArkType
const data = await response.json();
const userResult = User(data);
if (userResult instanceof type.errors) {
  return err(userResult.summary);
}
const user = userResult;
```

---

## 8. QUICK CHECKLIST

**Before committing:**
- [ ] All external data validated with ArkType
- [ ] All fallible operations return Result
- [ ] No unhandled errors or exceptions
- [ ] Offline-first: local writes succeed immediately
- [ ] Fixed limits on cache/queue sizes
- [ ] Components < 70 lines
- [ ] No mutations of state/props
- [ ] Cleanup functions in all effects
- [ ] Stable keys for lists
- [ ] Proper TypeScript strict mode

**Offline-first specific:**
- [ ] Optimistic updates with rollback
- [ ] Storage quota monitoring

**Performance:**
- [ ] Virtualization for long lists (>100 items)
- [ ] Code splitting for routes
- [ ] Memoization for expensive renders
- [ ] Batch state updates
- [ ] No unnecessary re-renders

---

*Principles from Uber Go Style + Tiger Style adapted for TypeScript + React + ArkType + NeverThrow with offline-first architecture.*
