# Go Development Guide for LLMs

## Core Philosophy
**Safety → Performance → Developer Experience**  
Be consistent, explicit, and simple above all else.

---

## 1. SAFETY FIRST

### Control Flow & Limits
- **Simple, explicit control flow** - avoid complex logic, minimize recursion
- **Set fixed limits** - bound all loops, queues, channels, slices (fail-fast)
- **Functions < 70 lines** - single responsibility, easy to test
- **Centralize branching** - main function controls if/switch, helpers are pure
- **Reduce nesting** - handle errors early, return/continue immediately

### Error Handling
```go
// Handle all errors - never ignore
result, err := doSomething()
if err != nil {
    return fmt.Errorf("do something: %w", err) // wrap with context, no "failed to"
}

// Assertions for programmer errors
if userID < 0 {
    panic("invalid userID: must be >= 0") // fail fast on invariant violation
}

// Handle once - don't log AND return
if err := process(); err != nil {
    return err // let caller decide what to do
}
```

**Rules:**
- Use `%w` to wrap errors for unwrapping
- Use `%v` to obfuscate underlying errors
- Named errors: `ErrNotFound` (exported) or `errNotFound` (unexported)
- Custom types: suffix with `Error` (e.g., `NotFoundError`)
- Treat warnings as errors (strictest compiler settings)
- Assert function arguments, return values, and invariants
- Avoid implicit defaults - be explicit with library options

### Type Safety & Memory
```go
// Use explicit sizes for cross-platform code
var timeout int64 = 5000      // not int
var bufferSize uint32 = 1024  // not uint

// Pre-allocate for known sizes
users := make([]User, 0, maxUsers)           // slices
cache := make(map[string]Value, expectedSize) // maps

// Zero-value mutexes are valid
var mu sync.Mutex  // not new(sync.Mutex)
mu.Lock()

// Don't embed mutexes
type Server struct {
    mu   sync.Mutex  // named field, not embedded
    data map[string]string
}

// Copy at boundaries to prevent mutations
func (s *Server) GetData() map[string]string {
    s.mu.Lock()
    defer s.mu.Unlock()
    
    result := make(map[string]string, len(s.data))
    for k, v := range s.data {
        result[k] = v
    }
    return result
}
```

### Interface Compliance
```go
// Verify at compile time
type Handler struct{}

var _ http.Handler = (*Handler)(nil) // fails if Handler doesn't implement

// Never use pointers to interfaces
func Process(w io.Writer) {} // correct
func Process(w *io.Writer) {} // wrong - interfaces already contain pointers
```

---

## 2. PERFORMANCE

### Design Early
```go
// Napkin math in comments - aim for 10x accuracy
// Expected load: 1,000 RPS × 1KB/request × 86,400s = ~86GB/day
// Monthly storage: 86GB × 30 = 2.6TB
// Cost estimate: 2.6TB × $0.02/GB = ~$52/month
const (
    maxRequestsPerSecond = 1000
    logRetentionDays    = 30
)

// Batch operations - amortize expensive work
func ProcessBatch(items []Item) error {
    const batchSize = 100
    for i := 0; i < len(items); i += batchSize {
        end := min(i+batchSize, len(items))
        if err := processBatch(items[i:end]); err != nil {
            return err
        }
    }
    return nil
}
```

### Resource Optimization Priority
**Network → Disk → Memory → CPU**

### Efficient Conversions
```go
// strconv over fmt for primitives
s := strconv.Itoa(42)        // not fmt.Sprint(42)
i, _ := strconv.Atoi("42")   // not fmt.Sscanf

// Avoid repeated string-to-byte conversions
data := []byte("Hello world")
for i := 0; i < n; i++ {
    w.Write(data) // not w.Write([]byte("Hello world"))
}
```

### Predictable Code
- Write predictable execution paths (better CPU cache/branch prediction)
- Don't rely solely on compiler optimizations
- Specify container capacity upfront

---

## 3. DEVELOPER EXPERIENCE

### Naming (Go conventions mandatory)
```go
// MixedCaps for exports, camelCase for internal
func GetUserBalance() int64 {}
func calculateTax() float64 {}

// Include units/qualifiers - descending significance order
timeoutMs := 5000                    // not timeout
cacheSizeBytes := 1024 * 1024       // not cacheSize
latencyMsMax := 100                 // not maxLatency

// No abbreviations (except standard: ID, URL, HTTP, API)
customerName := "John"  // not custName
requestID := "abc123"   // OK - standard abbreviation

// Unexported globals prefixed with _
const _defaultTimeout = 30
var _globalCache = make(map[string]string)

// Exception: unexported errors use err without _
var errNotFound = errors.New("not found")
```

### Comments
```go
// Document the "why" not the "what"
// Use complete sentences with proper punctuation.

// Bad: increments counter
// Good: Track requests for rate limiting across service restarts.
counter++

// For complex decisions
// We use SHA-256 instead of MD5 because MD5 is cryptographically broken.
// See: https://security.googleblog.com/2014/09/gradually-sunsetting-sha-1.html
hash := sha256.Sum256(data)
```

### Organization
```go
// Order: struct → constructor → exported methods → unexported methods → helpers

type Server struct {
    http.Server  // embedded types at top with blank line
    
    mu      sync.Mutex
    clients map[string]*Client
}

func NewServer(addr string) *Server {
    return &Server{
        clients: make(map[string]*Client),
    }
}

func (s *Server) Start() error {
    // Main function: control flow only
    if err := s.validate(); err != nil {
        return err
    }
    
    return s.listen()
}

func (s *Server) validate() error {
    // Helper: pure logic
    if s.clients == nil {
        return errors.New("clients map not initialized")
    }
    return nil
}
```

### Declarations
```go
// Group similar declarations
const (
    statusPending = iota
    statusActive
    statusDone
)

var (
    errTimeout = errors.New("timeout")
    errClosed  = errors.New("closed")
)

// Top-level: use var, omit type if obvious
var _cache = newCache()

// Local: use := for explicit values
user := User{Name: "John"}

// Zero values: use var
var users []User
var count int

// Struct initialization with field names
server := Server{
    Addr:    ":8080",
    Timeout: 30 * time.Second,
    // Omit zero values unless meaningful
}

// Zero-value struct: use var
var config Config

// References: use &T{} not new(T)
client := &Client{Name: "api"}
```

### Scope & Simplicity
```go
// Minimize scope - declare close to use
func Process(items []Item) error {
    const maxBatch = 100 // only used here
    
    for _, item := range items {
        // Reduce scope with if-initialization
        if err := item.Validate(); err != nil {
            return err
        }
        
        result := calculate(item) // declare close to use
        save(result)
    }
    return nil
}

// Don't reduce scope if it increases nesting
// Bad:
if data, err := os.ReadFile(name); err == nil {
    if err := process(data); err != nil {
        return err
    }
} else {
    return err
}

// Good:
data, err := os.ReadFile(name)
if err != nil {
    return err
}
if err := process(data); err != nil {
    return err
}
```

### Consistency
```go
// Avoid duplicates - single source of truth
type Config struct {
    timeout time.Duration
}
func (c *Config) GetTimeout() time.Duration {
    return c.timeout // not a duplicate field
}

// Pass large objects (>16 bytes) by reference
func Process(cfg *Config) error {} // not (cfg Config)

// Minimize dimensionality: void > bool > int > string
func Save(data []byte) error {}           // not bool (saved or not)
func Count() int {}                       // not (int, bool) for count+exists

// nil is valid empty slice
if len(users) == 0 {} // not if users == nil
return nil            // not return []User{}

// Unnecessary else elimination
timeout := 30
if urgent {
    timeout = 5
}
// not: if urgent { timeout = 5 } else { timeout = 30 }
```

---

## 4. CONCURRENCY

### Goroutines
```go
// Always have stop mechanism
type Worker struct {
    stop chan struct{}
    done chan struct{}
}

func NewWorker() *Worker {
    w := &Worker{
        stop: make(chan struct{}),
        done: make(chan struct{}),
    }
    go w.run()
    return w
}

func (w *Worker) run() {
    defer close(w.done)
    
    ticker := time.NewTicker(1 * time.Second)
    defer ticker.Stop()
    
    for {
        select {
        case <-ticker.C:
            w.doWork()
        case <-w.stop:
            return
        }
    }
}

func (w *Worker) Shutdown() {
    close(w.stop)
    <-w.done // wait for exit
}

// Wait for multiple goroutines
var wg sync.WaitGroup
for i := 0; i < n; i++ {
    wg.Add(1)
    go func(i int) {
        defer wg.Done()
        process(i)
    }(i) // pass loop var explicitly
}
wg.Wait()
```

### Channels
```go
// Size 0 (unbuffered) or 1 only
results := make(chan Result)    // unbuffered
done := make(chan struct{}, 1)  // buffered size 1

// Anything else needs justification in comments
// We use size 100 because we batch process 100 items at a time
// and need to prevent blocking the producer goroutine.
queue := make(chan Item, 100)
```

### Defer for Cleanup
```go
func Process() error {
    mu.Lock()
    defer mu.Unlock() // always runs
    
    f, err := os.Open(path)
    if err != nil {
        return err
    }
    defer f.Close()
    
    // multiple returns OK - defers always execute
    if condition {
        return nil
    }
    return process(f)
}
```

---

## 5. STYLE RULES

### Formatting (gofmt enforced)
- **Tabs for indentation** (not spaces - gofmt decides)
- **99-100 character line limit** (soft)
- **One statement per line**
- **Clear code blocks** with blank lines

### Imports
```go
import (
    "context"
    "fmt"
    
    "github.com/user/project/pkg"
    "go.uber.org/zap"
)
```

### Time Handling
```go
// Use time.Time for instants
func IsActive(now, start, stop time.Time) bool {
    return (start.Before(now) || start.Equal(now)) && now.Before(stop)
}

// Use time.Duration for periods
func Poll(delay time.Duration) {
    time.Sleep(delay)
}
poll(10 * time.Second) // clear units

// Use time.AddDate for calendar, time.Add for duration
nextDay := t.AddDate(0, 0, 1)      // same time, next day
plus24h := t.Add(24 * time.Hour)   // exactly 24 hours later
```

### Exit Strategy
```go
// Exit only in main, only once
func main() {
    if err := run(); err != nil {
        fmt.Fprintf(os.Stderr, "Error: %v\n", err)
        os.Exit(1)
    }
}

func run() error {
    // All business logic here
    // Return errors, never call os.Exit
    return nil
}
```

---

## 6. TESTING

### Table-Driven Tests
```go
func TestParse(t *testing.T) {
    tests := []struct {
        name    string
        give    string
        want    int
        wantErr bool
    }{
        {
            name: "valid positive",
            give: "42",
            want: 42,
        },
        {
            name:    "invalid input",
            give:    "abc",
            wantErr: true,
        },
    }
    
    for _, tt := range tests {
        tt := tt // for t.Parallel
        t.Run(tt.name, func(t *testing.T) {
            t.Parallel()
            
            got, err := Parse(tt.give)
            
            if tt.wantErr {
                require.Error(t, err)
                return
            }
            
            require.NoError(t, err)
            assert.Equal(t, tt.want, got)
        })
    }
}
```

### Keep Tests Simple
- Avoid complex logic in table tests
- Split into multiple tests if branching is needed
- One assertion path per test case

---

## 7. PATTERNS

### Functional Options
```go
type Server struct {
    addr    string
    timeout time.Duration
    logger  *log.Logger
}

type Option func(*Server)

func WithTimeout(d time.Duration) Option {
    return func(s *Server) { s.timeout = d }
}

func WithLogger(l *log.Logger) Option {
    return func(s *Server) { s.logger = l }
}

func NewServer(addr string, opts ...Option) *Server {
    s := &Server{
        addr:    addr,
        timeout: 30 * time.Second,
        logger:  log.Default(),
    }
    for _, opt := range opts {
        opt(s)
    }
    return s
}

// Usage
srv := NewServer(":8080",
    WithTimeout(5*time.Second),
    WithLogger(customLogger),
)
```

### Constructor Pattern
```go
// Return concrete type unless interface is required
func NewCache() *Cache {
    return &Cache{
        items: make(map[string]Item),
    }
}

// Use run() wrapper for services
func (s *Server) Start() error {
    return s.run()
}

func (s *Server) run() error {
    // All initialization here
    // Easy to test without actually starting
    return nil
}
```

---

## 8. ANTI-PATTERNS TO AVOID

```go
// ❌ Don't panic in production code
func GetUser(id int) User {
    user, err := db.Get(id)
    if err != nil {
        panic(err) // DON'T
    }
    return user
}

// ✅ Return errors
func GetUser(id int) (User, error) {
    return db.Get(id)
}

// ❌ Don't use init() unless absolutely necessary
func init() {
    db = connectDB() // side effects, hard to test
}

// ✅ Explicit initialization in main
func main() {
    db, err := connectDB()
    // ...
}

// ❌ Don't ignore errors
db.Execute(query) // ignoring error

// ✅ Handle or propagate
if err := db.Execute(query); err != nil {
    return fmt.Errorf("execute query: %w", err)
}

// ❌ Don't fire-and-forget goroutines
go doWork() // no way to stop or wait

// ✅ Manage lifecycle
w := NewWorker()
defer w.Shutdown()

// ❌ Don't embed types in public structs
type Server struct {
    http.Server  // leaks implementation
}

// ✅ Use composition
type Server struct {
    srv *http.Server
}

// ❌ Don't use naked parameters
Start(":8080", true, false, 100)

// ✅ Use named parameters or options
Start(":8080", WithCache(true), WithRetries(100))
```

---

## 9. QUICK REFERENCE CHECKLIST

**Before committing code:**
- [ ] All errors handled
- [ ] Functions < 70 lines
- [ ] Fixed limits on loops/channels/slices
- [ ] Variable names include units where relevant
- [ ] No mutable globals (use dependency injection)
- [ ] Goroutines have shutdown mechanism
- [ ] Comments explain "why" not "what"
- [ ] No abbreviations in names
- [ ] Capacity specified for slices/maps
- [ ] `gofmt` and `go vet` pass with no warnings
- [ ] No naked parameters in function calls
- [ ] Interface compliance verified at compile time
- [ ] Defers used for cleanup
- [ ] Zero technical debt - done right first time

**Performance considerations:**
- [ ] Napkin math done for resource usage
- [ ] Batch operations where applicable
- [ ] Predictable code paths
- [ ] No repeated string-to-byte conversions
- [ ] Appropriate use of references for large objects

**Safety checks:**
- [ ] Assertions for invariants
- [ ] Type assertions use comma-ok idiom
- [ ] Explicit sizes for cross-platform integers
- [ ] Boundaries copy slices/maps when needed
- [ ] Mutexes are named fields, not embedded

---

## 10. ZERO TECHNICAL DEBT MINDSET

- **Do it right the first time** - no shortcuts
- **Be proactive** - anticipate and fix issues early
- **Build momentum** - quality code enables faster development
- **Review ruthlessly** - every line matters
- **Refactor fearlessly** - but test thoroughly
