# Agent Development Guide

## Build & Test Commands

### Client (TypeScript/React)
- Build: `cd client && pnpm build`
- Lint: `cd client && pnpm lint` (fix: `pnpm lint:fix`)
- Type check: `cd client && pnpm type-check`
- Test: `cd client && pnpm test`
- Dev: `cd client && pnpm dev`

### Server (Go)
- Build: `cd server && task build` (runs all checks + build)
- Lint: `cd server && task lint`
- Format: `cd server && task fmt`
- Test all: `cd server && task test` or `ENVIRONMENT=test go test ./...`
- Test single: `cd server && go test ./path/to/package -run TestName`
- Test integration: `cd server && task test:integration`
- Dev: `cd server && task dev` (hot reload with air)

### Mobile (React Native/Expo)
- Lint: `cd mobile && pnpm lint`
- Type check: `cd mobile && pnpm type-check`
- Test: `cd mobile && pnpm test`
- Check all: `cd mobile && pnpm check-all`

### AI Service (Python)
- Test: `cd services/ai && python -m pytest`
- Format: `cd services/ai && black .`

## Code Style

### TypeScript/React (Client & Mobile)
- Use **functional components** with hooks (React 19)
- Import order: external → internal → relative → types
- Formatting: **Prettier** with 160 char line length, 2 spaces, double quotes, semicolons
- Naming: kebab-case for files (`account.balance-chart.tsx`), PascalCase for components
- State: Tanstack Query for server state, Zustand for client state
- Types: Always type function params and returns; use Zod for runtime validation
- Error handling: Use react-error-boundary for component errors

### Go (Server)
- Follow `gofmt` and `golangci-lint` standards
- Package structure: `internal/domain/<feature>/{models,requests,errors,service}.go`
- Use **SQLC** for type-safe DB queries
- Error handling: Return custom domain errors (e.g., `ErrAccountNotFound`)
- Naming: Exported vars/funcs PascalCase, private camelCase
- Testing: Unit tests in `*_test.go`, integration tests with `Integration` prefix

### Python (AI Service)
- Follow PEP 8, use Black for formatting
- Include type hints and docstrings
- Use Pydantic for data validation

### General
- **NO COMMENTS** unless explicitly requested
- Keep functions small and focused
- Write self-documenting code with clear variable names
- Follow existing patterns in the codebase
