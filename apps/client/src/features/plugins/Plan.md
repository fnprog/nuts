🎯 Plugin System Architecture Plan - Offline-First with CRDT & Migrations
Current State Analysis
✅ What Already Exists
1. Client-side Plugin Infrastructure
   - Plugin loader with dynamic imports (apps/client/src/features/plugins/loader.ts)
   - Plugin store with Zustand persistence (apps/client/src/features/plugins/store.ts)
   - Plugin type definitions (routes, charts, settings)
   - Example plugin: Real Estate (fully implemented with local Zustand store)
2. CRDT Infrastructure
   - CRDT document schema with collections (transactions, accounts, categories, etc.)
   - Client-side migration system (packages/migrations/src/runner.ts)
   - Offline-first sync architecture
   - Migration versioning and rollback support
3. Server Infrastructure
   - Go backend with domain-driven structure
   - PostgreSQL with SQLC for type-safe queries
   - Migration system using goose (SQL migrations in server/database/migrations/)
🚫 What's Missing
1. Plugin Metadata Storage - No CRDT collection for plugin metadata
2. Plugin Data Isolation - No namespaced storage for plugin-specific data
3. Plugin Migration System - No way for plugins to register their own migrations
4. Plugin Lifecycle Hooks - No install/uninstall/enable/disable callbacks
5. Server-side Plugin API - No plugin endpoints or domain logic
6. Data Collision Prevention - No namespace strategy for plugin tables/collections
---
🏗️ Proposed Architecture
1. Plugin Data Storage Strategy - CRDT Collections
A. Add plugins Collection to CRDT Schema
// packages/types/src/crdt-schema.ts
export const crdtPluginSchema = type({
  id: "string",                    // plugin ID (e.g., "real-estate")
  name: "string",                  // Display name
  version: "string",               // Semantic version
  status: "'installed' | 'enabled' | 'disabled' | 'uninstalling'",
  installed_at: "string",
  updated_at: "string",
  "config?": "Record<string, unknown>",  // Plugin-specific config
  "migration_version?": "number",  // Current plugin migration version
});
// Add to main CRDT document
export const crdtDocumentSchema = type({
  // ... existing collections
  plugins: "Record<string, unknown>",           // Plugin metadata
  plugin_data: "Record<string, Record<string, unknown>>",  // Namespaced plugin data
});
B. Plugin Data Namespacing
// Structure in CRDT document:
{
  plugin_data: {
    "real-estate": {
      properties: { ... },      // Property records
      settings: { ... }         // Plugin settings
    },
    "budgeting-pro": {
      goals: { ... },
      templates: { ... }
    }
  }
}
Benefits:
- ✅ Offline-first by default
- ✅ Automatic sync across devices
- ✅ Version control and conflict resolution via CRDT
- ✅ No schema migration needed for basic plugin data
- ✅ Clear namespace boundaries
---
2. Plugin Migration System
A. Plugin Migration Interface
// packages/types/src/plugin.ts
export interface PluginMigration {
  version: number;
  pluginId: string;
  name: string;
  up: (execute: ExecuteFunction) => Promise<void>;
  down: (execute: ExecuteFunction) => Promise<void>;
}
export interface PluginConfig {
  id: string;
  name: string;
  version: string;
  migrations?: PluginMigration[];
  
  // Lifecycle hooks
  onInstall?: (context: PluginContext) => Promise<void>;
  onUninstall?: (context: PluginContext) => Promise<void>;
  onEnable?: (context: PluginContext) => Promise<void>;
  onDisable?: (context: PluginContext) => Promise<void>;
}
export interface PluginContext {
  pluginId: string;
  crdtService: typeof crdtService;
  execute: ExecuteFunction;  // For direct SQLite operations
}
B. Plugin Migration Storage
// Store plugin migration state in CRDT
interface PluginMigrationState {
  plugin_id: string;
  version: number;
  applied_at: string;
}
// Add to CRDT document
{
  plugin_migrations: "Record<string, PluginMigrationState>"
}
C. Migration Runner Extension
// packages/migrations/src/plugin-runner.ts
export class PluginMigrationRunner {
  constructor(
    private crdtService: typeof crdtService,
    private baseRunner: MigrationRunner
  ) {}
  async installPlugin(config: PluginConfig): Promise<void> {
    // 1. Register plugin in CRDT
    await this.crdtService.createPlugin({
      id: config.id,
      name: config.name,
      version: config.version,
      status: 'installing',
      installed_at: new Date().toISOString(),
    });
    // 2. Run plugin migrations
    if (config.migrations) {
      for (const migration of config.migrations) {
        await this.runPluginMigration(config.id, migration);
      }
    }
    // 3. Initialize plugin data namespace
    await this.crdtService.initializePluginData(config.id);
    // 4. Call onInstall hook
    if (config.onInstall) {
      await config.onInstall({
        pluginId: config.id,
        crdtService: this.crdtService,
        execute: this.baseRunner.execute,
      });
    }
    // 5. Update status to installed
    await this.crdtService.updatePlugin(config.id, {
      status: 'enabled',
    });
  }
  async uninstallPlugin(pluginId: string): Promise<void> {
    const plugin = await this.crdtService.getPlugin(pluginId);
    
    // 1. Call onUninstall hook
    const config = getPluginConfig(pluginId);
    if (config.onUninstall) {
      await config.onUninstall({ ... });
    }
    // 2. Rollback ALL plugin migrations
    const migrations = config.migrations || [];
    for (const migration of migrations.reverse()) {
      await this.rollbackPluginMigration(pluginId, migration);
    }
    // 3. Delete plugin data namespace
    await this.crdtService.deletePluginData(pluginId);
    // 4. Remove plugin metadata
    await this.crdtService.deletePlugin(pluginId);
  }
}
---
3. Collision Prevention Strategy
A. Table Naming Convention
-- Plugin tables MUST be prefixed with plugin ID
-- Example for real-estate plugin:
CREATE TABLE IF NOT EXISTS plugin_real_estate_properties (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  data TEXT NOT NULL,  -- JSON blob for flexibility
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_plugin_real_estate_properties_user 
  ON plugin_real_estate_properties(user_id);
Rules:
- ✅ All plugin tables: plugin_{plugin_id}_{table_name}
- ✅ All plugin indices: idx_plugin_{plugin_id}_{index_name}
- ✅ Foreign keys to core tables allowed (users, accounts)
- ✅ No foreign keys FROM core tables TO plugin tables
B. CRDT Collection Namespacing
// Enforced by type system
interface CRDTDocument {
  plugin_data: {
    [pluginId: string]: {
      [collection: string]: Record<string, unknown>
    }
  }
}
// Access pattern:
crdtService.getPluginData('real-estate', 'properties');
crdtService.setPluginData('real-estate', 'properties', data);
C. LocalStorage/IndexedDB Namespacing
// Zustand persist names
{
  name: `plugin-${pluginId}-${storeName}`,
}
// Example: "plugin-real-estate-storage"
---
4. Updated Real Estate Plugin Example
// apps/client/src/features/plugins/real-estate/index.ts
import { PluginConfig } from '@/features/plugins/types';
import { realEstateMigrations } from './migrations';
export default {
  id: 'real-estate',
  name: 'Real Estate',
  version: '1.0.0',
  
  // Migrations for plugin-specific tables
  migrations: realEstateMigrations,
  
  // Lifecycle hooks
  async onInstall(context) {
    // Initialize default categories for real estate
    await context.crdtService.createCategory({
      id: crypto.randomUUID(),
      name: 'Rental Income',
      type: 'income',
      color: '#10b981',
      plugin_id: 'real-estate',
    });
    
    await context.crdtService.createCategory({
      id: crypto.randomUUID(),
      name: 'Property Maintenance',
      type: 'expense',
      color: '#ef4444',
      plugin_id: 'real-estate',
    });
  },
  
  async onUninstall(context) {
    // Clean up categories created by this plugin
    const categories = await context.crdtService.getCategories();
    const pluginCategories = Object.values(categories)
      .filter(c => c.plugin_id === 'real-estate');
    
    for (const category of pluginCategories) {
      await context.crdtService.deleteCategory(category.id);
    }
  },
  
  // ... routes, charts, settings
} as PluginConfig;
// apps/client/src/features/plugins/real-estate/migrations.ts
export const realEstateMigrations: PluginMigration[] = [
  {
    version: 1,
    pluginId: 'real-estate',
    name: 'create_properties_table',
    async up(execute) {
      await execute(`
        CREATE TABLE IF NOT EXISTS plugin_real_estate_properties (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          address TEXT NOT NULL,
          purchase_price REAL NOT NULL,
          current_value REAL NOT NULL,
          property_type TEXT NOT NULL,
          data TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          deleted_at INTEGER,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      
      await execute(`
        CREATE INDEX idx_plugin_real_estate_properties_user 
          ON plugin_real_estate_properties(user_id)
      `);
    },
    
    async down(execute) {
      await execute(`DROP INDEX IF EXISTS idx_plugin_real_estate_properties_user`);
      await execute(`DROP TABLE IF EXISTS plugin_real_estate_properties`);
    },
  },
  
  {
    version: 2,
    pluginId: 'real-estate',
    name: 'add_mortgage_tracking',
    async up(execute) {
      await execute(`
        CREATE TABLE IF NOT EXISTS plugin_real_estate_mortgages (
          id TEXT PRIMARY KEY,
          property_id TEXT NOT NULL,
          loan_amount REAL NOT NULL,
          interest_rate REAL NOT NULL,
          term_months INTEGER NOT NULL,
          start_date INTEGER NOT NULL,
          data TEXT NOT NULL,
          FOREIGN KEY (property_id) 
            REFERENCES plugin_real_estate_properties(id) 
            ON DELETE CASCADE
        )
      `);
    },
    
    async down(execute) {
      await execute(`DROP TABLE IF EXISTS plugin_real_estate_mortgages`);
    },
  },
];
---
5. CRDT Service Extensions
// apps/client/src/core/sync/crdt.ts
class CRDTService {
  // ... existing methods
  
  // Plugin management
  async createPlugin(plugin: CRDTPlugin): Promise<Result<void, ServiceError>> {
    const doc = this.getDocument();
    (doc.plugins as any)[plugin.id] = plugin;
    return this.save();
  }
  
  getPlugin(id: string): CRDTPlugin | undefined {
    const doc = this.getDocument();
    return (doc.plugins as any)[id];
  }
  
  async deletePlugin(id: string): Promise<Result<void, ServiceError>> {
    const doc = this.getDocument();
    delete (doc.plugins as any)[id];
    delete (doc.plugin_data as any)[id];
    delete (doc.plugin_migrations as any)[id];
    return this.save();
  }
  
  // Plugin data access
  getPluginData<T>(pluginId: string, collection: string): Record<string, T> {
    const doc = this.getDocument();
    const pluginData = (doc.plugin_data as any)[pluginId] || {};
    return pluginData[collection] || {};
  }
  
  async setPluginData<T>(
    pluginId: string,
    collection: string,
    data: Record<string, T>
  ): Promise<Result<void, ServiceError>> {
    const doc = this.getDocument();
    
    if (!(doc.plugin_data as any)[pluginId]) {
      (doc.plugin_data as any)[pluginId] = {};
    }
    
    (doc.plugin_data as any)[pluginId][collection] = data;
    return this.save();
  }
  
  async createPluginRecord<T>(
    pluginId: string,
    collection: string,
    id: string,
    record: T
  ): Promise<Result<void, ServiceError>> {
    const collectionData = this.getPluginData(pluginId, collection);
    collectionData[id] = record;
    return this.setPluginData(pluginId, collection, collectionData);
  }
  
  async updatePluginRecord<T>(
    pluginId: string,
    collection: string,
    id: string,
    updates: Partial<T>
  ): Promise<Result<void, ServiceError>> {
    const collectionData = this.getPluginData(pluginId, collection);
    const existing = collectionData[id];
    
    if (!existing) {
      return err(ServiceError.notFound(`plugin record`, id));
    }
    
    collectionData[id] = { ...existing, ...updates };
    return this.setPluginData(pluginId, collection, collectionData);
  }
  
  async deletePluginRecord(
    pluginId: string,
    collection: string,
    id: string
  ): Promise<Result<void, ServiceError>> {
    const collectionData = this.getPluginData(pluginId, collection);
    delete collectionData[id];
    return this.setPluginData(pluginId, collection, collectionData);
  }
}
---
6. Plugin Store Updates
// apps/client/src/features/plugins/store.ts
interface PluginState {
  // ... existing
  
  installPlugin: (pluginId: string) => Promise<void>;
  uninstallPlugin: (pluginId: string) => Promise<void>;
  enablePlugin: (pluginId: string) => Promise<void>;
  disablePlugin: (pluginId: string) => Promise<void>;
}
export const usePluginStore = create<PluginState>()(
  persist(
    (set, get) => ({
      // ... existing
      
      installPlugin: async (pluginId) => {
        const module = await loadPluginModule(pluginId);
        if (!module) throw new Error(`Plugin ${pluginId} not found`);
        
        // Run plugin installation via migration runner
        const runner = new PluginMigrationRunner(crdtService, migrationRunner);
        await runner.installPlugin(module);
        
        // Update local store
        set(state => ({
          installedPluginIds: [...state.installedPluginIds, pluginId],
        }));
      },
      
      uninstallPlugin: async (pluginId) => {
        // Run plugin uninstallation
        const runner = new PluginMigrationRunner(crdtService, migrationRunner);
        await runner.uninstallPlugin(pluginId);
        
        // Update local store
        set(state => ({
          installedPluginIds: state.installedPluginIds.filter(id => id !== pluginId),
          pluginConfigs: state.pluginConfigs.filter(c => c.id !== pluginId),
        }));
      },
    }),
    { name: 'plugin-storage' }
  )
);
---
7. Server-Side Plugin Support (Optional)
// server/internal/domain/plugins/models.go
type Plugin struct {
    ID            string                 `json:"id"`
    UserID        string                 `json:"user_id"`
    Name          string                 `json:"name"`
    Version       string                 `json:"version"`
    Status        string                 `json:"status"`
    Config        map[string]interface{} `json:"config,omitempty"`
    InstalledAt   time.Time              `json:"installed_at"`
    UpdatedAt     time.Time              `json:"updated_at"`
}
// server/internal/domain/plugins/service.go
type Service struct {
    db *sql.DB
}
func (s *Service) RegisterPlugin(userID, pluginID string, config map[string]interface{}) error {
    // Validate plugin exists
    // Store metadata
    // Trigger server-side initialization if needed
}
Note: Server-side support is OPTIONAL since plugins primarily run client-side with CRDT storage.
---
📋 Implementation Checklist
Phase 1: Core Plugin Infrastructure (Priority: HIGH)
- [x] Update CRDT schema with plugins, plugin_data, plugin_migrations collections
- [x] Extend CRDTService with plugin data access methods
- [x] Create PluginMigrationRunner class
- [x] Update plugin types with migrations and lifecycle hooks
- [x] Build plugin installation/uninstallation flow
- [x] Add getMigrationRunner() to DatabaseClient
- [x] Create storage/index.ts for dbClient export
- [x] Create test-plugin for validation
- [ ] Test end-to-end plugin flow (see Testing Guide below)
Phase 2: Real Estate Plugin Migration (Priority: MEDIUM)
- [ ] Create migration files for real-estate plugin
- [ ] Convert Zustand store to CRDT-based storage
- [ ] Add lifecycle hooks (onInstall/onUninstall)
- [ ] Test install → use → uninstall flow
- [ ] Verify data cleanup on uninstall
Phase 3: Developer Experience (Priority: MEDIUM)
- [ ] Create plugin template/generator CLI
- [ ] Document plugin development guide
- [ ] Add plugin validation/linting
- [ ] Create plugin testing utilities
- [ ] Build plugin marketplace/registry system
Phase 4: Advanced Features (Priority: LOW)
- [ ] Plugin dependencies system
- [ ] Plugin permissions/capabilities
- [ ] Plugin update mechanism with migration chain
- [ ] Plugin rollback on errors
- [ ] Server-side plugin API endpoints (if needed)
---
🔒 Security & Safety Considerations
1. Migration Safety
   - Wrap all migrations in transactions
   - Validate plugin ID format (alphanumeric + hyphens only)
   - Prevent SQL injection via parameterized queries
   - Limit table/index name length
2. Data Isolation
   - Enforce namespace prefixes in table names
   - Add user_id foreign keys to all plugin tables
   - Prevent cross-plugin data access
   - Audit plugin data access patterns
3. Uninstall Safety
   - Confirm uninstall with user
   - Show data that will be deleted
   - Option to export plugin data before uninstall
   - Fail gracefully if migration rollback fails
4. Performance
   - Lazy-load plugin code
   - Index plugin tables properly
   - Limit plugin data size in CRDT
   - Consider moving large blobs to separate storage
---
🎯 Recommended Next Steps
1. Start with CRDT Schema Updates - Add plugin collections to packages/types/src/crdt-schema.ts
2. Build Plugin Migration Runner - Implement PluginMigrationRunner class
3. Extend CRDT Service - Add plugin data access methods
4. Update Real Estate Plugin - Convert to use new architecture
5. Test End-to-End - Install → Enable → Disable → Uninstall flow
This architecture provides:
- ✅ Offline-first - Everything works without network
- ✅ Safe uninstalls - Complete data cleanup via migration rollbacks
- ✅ No collisions - Enforced namespacing at all layers
- ✅ Type-safe - Full TypeScript support
- ✅ Extensible - Easy to add new plugins
- ✅ Sync-ready - CRDT handles multi-device sync




🎯 Core Plugin Extension Ideas
1. Dashboard Chart Injection (Already Planned - Excellent!)
Your current PluginChartConfig is good, but let's enhance it:
Ideas:
- Dynamic Data Sources: Allow plugins to register data providers that core charts can consume
- Chart Composition: Plugins can add series/overlays to existing charts (e.g., Real Estate plugin adds property values to Net Worth chart)
- Chart Slots: Define strategic insertion points (e.g., "before-networth", "after-expenses", "top-priority")
- Conditional Rendering: Charts appear based on plugin state (e.g., only show mortgage chart if properties exist)
2. Financial Calculation Hooks (Critical Addition!)
This is where plugins become truly powerful:
Hook Points:
interface CalculationHooks {
  // Net Worth Calculation
  onNetWorthCalculate?: (context: NetWorthContext) => Promise<NetWorthContribution>;
  
  // Account Balance Adjustments
  onAccountBalanceCalculate?: (context: AccountContext) => Promise<BalanceModifier>;
  
  // Analytics/Insights
  onAnalyticsGenerate?: (context: AnalyticsContext) => Promise<AnalyticsContribution>;
  
  // Transaction Processing
  onTransactionCreated?: (transaction: Transaction) => Promise<void>;
  onTransactionUpdated?: (transaction: Transaction) => Promise<void>;
  
  // Budget Impact
  onBudgetCalculate?: (context: BudgetContext) => Promise<BudgetContribution>;
}
Real-World Examples:
Real Estate Plugin:
- Contributes property equity to net worth calculation
- Adds mortgage payments to liability tracking
- Provides property appreciation analytics
- Adjusts budget forecasts based on property taxes
Investment Portfolio Plugin:
- Adds unrealized gains/losses to net worth
- Contributes dividend income to cash flow projections
- Provides portfolio performance analytics
- Tracks tax implications
Subscription Tracker Plugin:
- Adds recurring costs to expense forecasts
- Alerts when subscriptions exceed budget
- Contributes to category spending analytics
3. Account Type Extensions
Allow plugins to register custom account types:
interface PluginAccountType {
  id: string;
  name: string;
  icon: React.FC;
  category: 'asset' | 'liability' | 'tracking';
  
  // Custom fields for this account type
  customFields: AccountFieldConfig[];
  
  // How to calculate balance
  balanceCalculator: (account: Account, context: CalculationContext) => Promise<number>;
  
  // How this affects net worth
  netWorthContribution: (account: Account) => Promise<{ assets: number; liabilities: number }>;
}
Examples:
- Real Estate: "Property" account type with custom fields (address, purchase price, mortgage)
- Crypto: "Crypto Wallet" with real-time price updates
- Vehicles: "Vehicle" account with depreciation tracking
- Collectibles: "Collection" account with appreciation/appraisal tracking
4. Category Enhancement Hooks
Let plugins extend or modify category behavior:
interface CategoryHooks {
  // Add metadata to categories
  onCategoryEnrich?: (category: Category) => Promise<CategoryMetadata>;
  
  // Custom category analytics
  onCategoryAnalytics?: (category: Category, timeframe: string) => Promise<AnalyticsData>;
  
  // Budget recommendations
  onBudgetRecommend?: (category: Category, history: Transaction[]) => Promise<BudgetRecommendation>;
}
Examples:
- Tax Plugin: Tags categories as tax-deductible, provides year-end reports
- Savings Goals Plugin: Links categories to savings targets, shows progress
- Business Expense Plugin: Categorizes expenses by project/client
5. Transaction Enrichment
Plugins can add intelligence to transactions:
interface TransactionHooks {
  // Auto-categorization
  onTransactionCategorize?: (transaction: Transaction) => Promise<Category | null>;
  
  // Add tags/metadata
  onTransactionEnrich?: (transaction: Transaction) => Promise<TransactionMetadata>;
  
  // Split transactions automatically
  onTransactionSplit?: (transaction: Transaction) => Promise<Transaction[]>;
  
  // Receipt/document attachment
  onTransactionDocument?: (transaction: Transaction) => Promise<DocumentLink[]>;
}
Examples:
- Receipt Scanner Plugin: OCR receipts, attach to transactions
- Mileage Tracker Plugin: Auto-log business mileage, calculate reimbursements
- Vendor Intelligence Plugin: Identifies vendors, suggests better deals
6. Dashboard Widget System (Beyond Charts)
Not just charts, but interactive widgets:
interface PluginWidget {
  id: string;
  type: 'chart' | 'metric' | 'list' | 'action' | 'alert';
  component: React.FC<WidgetProps>;
  defaultSize: 1 | 2 | 3;
  refreshInterval?: number; // Auto-refresh in seconds
  
  // Permissions
  requiredData?: string[]; // ['transactions', 'accounts']
}
Widget Types:
- Metric Cards: Quick stats (e.g., "Properties Owned: 3", "Crypto Value: $12,500")
- Action Buttons: Quick actions (e.g., "Add Property", "Rebalance Portfolio")
- Alerts/Notifications: Actionable insights (e.g., "Rent due in 3 days")
- Mini-Tables: Quick lists (e.g., "Upcoming Bills", "Top Expenses")
7. Report Generation System
Let plugins contribute to reports:
interface ReportContribution {
  id: string;
  name: string;
  description: string;
  
  // Generate report data
  generate: (timeframe: string, options: ReportOptions) => Promise<ReportData>;
  
  // Export formats
  supportedFormats: ('pdf' | 'csv' | 'excel' | 'json')[];
  
  // Report sections
  sections: ReportSection[];
}
Examples:
- Tax Report Plugin: Year-end tax summary, deductions, capital gains
- Net Worth Report Plugin: Detailed breakdown with charts
- Spending Analysis Plugin: Category trends, insights, recommendations
8. AI/LLM Integration Hooks
Leverage the existing AI service:
interface AIHooks {
  // Custom prompts for AI analysis
  onAIPromptEnhance?: (context: AIContext) => Promise<PromptEnhancement>;
  
  // Custom insights
  onAIInsightsGenerate?: (context: FinancialData) => Promise<Insight[]>;
  
  // Training data contribution
  onAITrainingData?: () => Promise<TrainingDataset>;
}
Examples:
- Investment Advisor Plugin: AI-powered portfolio recommendations
- Budget Coach Plugin: Personalized spending advice
- Fraud Detection Plugin: Unusual transaction alerts
9. Integration Marketplace
Plugins can register external integrations:
interface PluginIntegration {
  id: string;
  name: string;
  type: 'oauth' | 'api_key' | 'manual';
  
  // Authentication
  authenticate: () => Promise<AuthResult>;
  
  // Data sync
  sync: (lastSync: Date) => Promise<SyncResult>;
  
  // Supported data types
  dataTypes: ('transactions' | 'accounts' | 'balances')[];
}
Examples:
- Real Estate APIs: Zillow, Redfin for property valuations
- Crypto Exchanges: Coinbase, Binance for portfolio sync
- Bank Connections: Plaid alternatives for specific banks
- E-commerce: Amazon, Shopify for expense tracking
10. Notification & Alert System
Plugins can create smart alerts:
interface PluginAlert {
  id: string;
  severity: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  actionable: boolean;
  actions?: AlertAction[];
  
  // When to trigger
  condition: (context: AppState) => Promise<boolean>;
}
Examples:
- "Mortgage payment due in 3 days"
- "Portfolio down 5% this week - consider rebalancing"
- "You've exceeded your dining budget by $200"
- "Property insurance renewal next month"
---
📋 Enhanced Plan.md Structure
I'll now provide the improved version that incorporates all these ideas with concrete implementation details. The key improvements include:
1. Calculation Hook System - Plugins can influence net worth, analytics, budgets
2. Account Type Registry - Custom account types with specific behaviors
3. Widget System - Beyond charts: metrics, actions, alerts
4. Transaction Pipeline - Enrichment, categorization, splitting hooks
5. Report Contributions - Plugins add sections to financial reports
6. AI Integration Points - Leverage existing AI service
7. Data Provider Pattern - Plugins expose data to core app and other plugins
8. Event Bus - Inter-plugin communication
9. Permission System - Granular data access control
10. Version Compatibility - Handle breaking changes gracefully
The architecture maintains your offline-first CRDT approach while providing maximum extensibility. Each hook is async, supports rollback, and integrates with the migration system.

---
🧪 Testing Guide
Phase 1 Testing: Test Plugin Installation Flow

1. Test Plugin Overview
   Created: apps/client/src/features/plugins/test-plugin/
   - Simple plugin with 2 migrations
   - Lifecycle hooks (onInstall, onUninstall, onEnable, onDisable)
   - Creates test_items table with migrations
   - Tests CRDT plugin data storage

2. Manual Testing Steps

   A. Start Development Server
      cd apps/client && pnpm dev

   B. Test Installation (via Browser Console)
      // Import the plugin store
      import { usePluginStore } from '@/features/plugins/store';
      
      // Get the store
      const store = usePluginStore.getState();
      
      // Install test plugin
      await store.installPlugin('test-plugin');
      
      Expected Console Output:
      - "Running plugin migration test-plugin:1: create_test_items_table"
      - "✓ Plugin migration test-plugin:1 completed successfully"
      - "Running plugin migration test-plugin:2: add_test_items_category"
      - "✓ Plugin migration test-plugin:2 completed successfully"
      - "🔧 Test Plugin onInstall hook called"
      - "✅ Plugin test-plugin installed successfully"
      
      Expected Database State:
      - _plugin_migrations table has 2 rows (test-plugin, v1 and v2)
      - plugin_test_plugin_test_items table created
      - CRDT document has plugin metadata in plugins collection
      - CRDT document has plugin data in plugin_data.test-plugin.test_collection

   C. Verify Plugin State
      // Check plugin is registered in CRDT
      import { crdtService } from '@/core/sync/crdt';
      const plugin = crdtService.getPlugin('test-plugin');
      console.log(plugin);
      
      Expected Output:
      {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        status: 'enabled',
        installed_at: '<timestamp>',
      }
      
      // Check plugin data
      const pluginData = crdtService.getPluginData('test-plugin', 'test_collection');
      console.log(pluginData);
      
      Expected Output:
      {
        initialized: true,
        timestamp: <number>
      }

   D. Test Disable/Enable
      await store.disablePlugin('test-plugin');
      
      Expected Output:
      - "🔧 Test Plugin onDisable hook called"
      - "✅ Plugin test-plugin disabled successfully"
      - Plugin status in CRDT changes to 'disabled'
      
      await store.enablePlugin('test-plugin');
      
      Expected Output:
      - "🔧 Test Plugin onEnable hook called"
      - "✅ Plugin test-plugin enabled successfully"
      - Plugin status in CRDT changes to 'enabled'

   E. Test Uninstallation
      await store.uninstallPlugin('test-plugin');
      
      Expected Console Output:
      - "🔧 Test Plugin onUninstall hook called"
      - "Rolling back plugin migration test-plugin:2: add_test_items_category"
      - "✓ Plugin migration rollback test-plugin:2 completed successfully"
      - "Rolling back plugin migration test-plugin:1: create_test_items_table"
      - "✓ Plugin migration rollback test-plugin:1 completed successfully"
      - "✅ Plugin test-plugin uninstalled successfully"
      
      Expected Database State:
      - _plugin_migrations table has 0 rows for test-plugin
      - plugin_test_plugin_test_items table dropped
      - CRDT document has no plugin metadata for test-plugin
      - CRDT document has no plugin data for test-plugin

3. Database Verification

   Open IndexedDB in browser DevTools:
   - Application tab > IndexedDB > nuts-db
   - Check _plugin_migrations table
   - Check plugin_test_plugin_test_items table (during installation)
   - Verify cleanup after uninstallation

4. Error Testing

   A. Test Migration Failure
      Modify test-plugin/index.ts migration to have invalid SQL
      Try installing - should rollback cleanly
      
   B. Test Double Installation
      Install test-plugin twice - should skip second install
      
   C. Test Uninstall of Non-existent Plugin
      await store.uninstallPlugin('non-existent');
      Should throw error gracefully

5. Integration Testing with Real Estate Plugin

   Once Phase 2 is complete:
   - Install real-estate plugin
   - Create property data
   - Verify CRDT sync
   - Uninstall and verify complete cleanup

6. Known Issues / TODOs
   - [ ] Add UI for plugin management (install/uninstall buttons)
   - [ ] Add confirmation dialogs for uninstall
   - [ ] Show plugin migration progress
   - [ ] Handle migration errors with user-friendly messages
   - [ ] Add plugin data export before uninstall
   - [ ] Test multi-device sync of plugin installations
   - [ ] Test plugin updates (version migration)

7. Files Modified/Created in Phase 1
   Core Infrastructure:
   - packages/types/src/crdt-schema.ts (added plugin collections)
   - apps/client/src/core/sync/crdt.ts (added plugin methods)
   - packages/migrations/src/plugin-runner.ts (NEW - migration runner)
   - apps/client/src/core/storage/client.ts (added getMigrationRunner)
   - apps/client/src/core/storage/index.ts (NEW - exports)
   
   Plugin System:
   - apps/client/src/features/plugins/types.ts (added migrations, hooks)
   - apps/client/src/features/plugins/store.ts (added install/uninstall)
   
   Test Plugin:
   - apps/client/src/features/plugins/test-plugin/index.ts (NEW)
   - apps/client/src/features/plugins/test-plugin/pages/test-page.tsx (NEW)
