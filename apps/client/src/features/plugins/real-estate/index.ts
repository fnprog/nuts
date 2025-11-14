import { lazy } from "react";
import { Home, Building, Map as MapIcon, LineChart } from "lucide-react";
import type { PluginConfigExternal, PluginMigration } from "../types";

import { PropertyValueChart } from "./components/property-value-chart";
import { RentalIncomeChart } from "./components/rental-income-chart";
import { MortgagePaymentChart } from "./components/morgage-payment-chart";

const Overview = lazy(() => import("./pages/overview"));
const Map = lazy(() => import("./pages/map"));
const Properties = lazy(() => import("./pages/properties"));
const Analytics = lazy(() => import("./pages/analytics"));
const Settings = lazy(() => import("./pages/settings"));

const migrations: PluginMigration[] = [
  {
    version: 1,
    pluginId: "real-estate",
    name: "create_properties_table",
    up: async (execute) => {
      await execute(`
        CREATE TABLE plugin_real_estate_properties (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          address TEXT NOT NULL,
          property_type TEXT NOT NULL,
          purchase_date TEXT NOT NULL,
          purchase_price REAL NOT NULL,
          current_value REAL NOT NULL,
          bedrooms INTEGER NOT NULL,
          bathrooms INTEGER NOT NULL,
          square_feet INTEGER NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('primary', 'rental')),
          image TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `);
      await execute(`
        CREATE INDEX idx_properties_type 
          ON plugin_real_estate_properties(type);
      `);
      await execute(`
        CREATE INDEX idx_properties_created_at 
          ON plugin_real_estate_properties(created_at);
      `);
    },
    down: async (execute) => {
      await execute("DROP INDEX IF EXISTS idx_properties_created_at;");
      await execute("DROP INDEX IF EXISTS idx_properties_type;");
      await execute("DROP TABLE IF EXISTS plugin_real_estate_properties;");
    },
  },
  {
    version: 2,
    pluginId: "real-estate",
    name: "create_mortgages_table",
    up: async (execute) => {
      await execute(`
        CREATE TABLE plugin_real_estate_mortgages (
          property_id TEXT PRIMARY KEY,
          loan_amount REAL NOT NULL,
          interest_rate REAL NOT NULL,
          loan_term INTEGER NOT NULL,
          monthly_payment REAL NOT NULL,
          FOREIGN KEY (property_id) REFERENCES plugin_real_estate_properties(id) ON DELETE CASCADE
        );
      `);
    },
    down: async (execute) => {
      await execute("DROP TABLE IF EXISTS plugin_real_estate_mortgages;");
    },
  },
  {
    version: 3,
    pluginId: "real-estate",
    name: "create_rentals_table",
    up: async (execute) => {
      await execute(`
        CREATE TABLE plugin_real_estate_rentals (
          property_id TEXT PRIMARY KEY,
          monthly_rent REAL NOT NULL,
          occupancy_rate INTEGER NOT NULL,
          FOREIGN KEY (property_id) REFERENCES plugin_real_estate_properties(id) ON DELETE CASCADE
        );
      `);
    },
    down: async (execute) => {
      await execute("DROP TABLE IF EXISTS plugin_real_estate_rentals;");
    },
  },
];

export default {
  id: "real-estate",
  name: "Real Estate",
  description: "Track and manage your real estate investments",
  version: "1.0.0",
  author: "Finance Dashboard Team",
  icon: Home,
  routes: [
    {
      path: "/real-estate",
      label: "Real Estate",
      icon: Home,
      component: lazy(() => import("./pages/overview")),
      subroutes: [
        {
          path: "/real-estate/properties",
          label: "Properties",
          component: Properties,
          icon: Building,
        },
        {
          path: "/real-estate/map",
          label: "Map View",
          component: Map,
          icon: MapIcon,
        },
        {
          path: "/real-estate/analytics",
          label: "Analytics",
          component: Analytics,
          icon: LineChart,
        },
      ],
    },
  ],
  charts: [
    {
      id: "property-value",
      type: "property-value",
      title: "Property Value",
      component: PropertyValueChart,
      defaultSize: 2,
    },
    {
      id: "rental-income",
      type: "rental-income",
      title: "Rental Income",
      component: RentalIncomeChart,
      defaultSize: 1,
    },
    {
      id: "mortgage-payment",
      type: "mortgage-payment",
      title: "Mortgage Payments",
      component: MortgagePaymentChart,
      defaultSize: 1,
    },
  ],
  settings: Settings,
  migrations,
  onInstall: async (context) => {
    console.log("🏠 Real Estate Plugin: Installing...");
    
    const properties = [
      {
        id: "1",
        name: "Main Residence",
        address: "123 Main St, Anytown, USA",
        propertyType: "single-family",
        purchaseDate: "2020-05-15",
        purchasePrice: 350000,
        currentValue: 425000,
        bedrooms: 3,
        bathrooms: 2,
        squareFeet: 1800,
        type: "primary" as const,
        image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1000",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: "2",
        name: "Rental Property",
        address: "456 Oak Ave, Othertown, USA",
        propertyType: "condo",
        purchaseDate: "2021-08-10",
        purchasePrice: 220000,
        currentValue: 245000,
        bedrooms: 2,
        bathrooms: 2,
        squareFeet: 1200,
        type: "rental" as const,
        image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=1000",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const mortgages = [
      {
        propertyId: "1",
        loanAmount: 280000,
        interestRate: 3.5,
        loanTerm: 30,
        monthlyPayment: 1257.43,
      },
      {
        propertyId: "2",
        loanAmount: 176000,
        interestRate: 3.75,
        loanTerm: 30,
        monthlyPayment: 815.27,
      },
    ];

    const rentals = [
      {
        propertyId: "2",
        monthlyRent: 1800,
        occupancyRate: 95,
      },
    ];

    for (const property of properties) {
      await context.crdtService.createPluginRecord(context.pluginId, "properties", property.id, property);
    }

    for (const mortgage of mortgages) {
      await context.crdtService.createPluginRecord(context.pluginId, "mortgages", mortgage.propertyId, mortgage);
    }

    for (const rental of rentals) {
      await context.crdtService.createPluginRecord(context.pluginId, "rentals", rental.propertyId, rental);
    }

    console.log("🏠 Real Estate Plugin: Sample properties created");
  },
  onUninstall: async () => {
    console.log("🏠 Real Estate Plugin: Uninstalling...");
  },
  onEnable: async () => {
    console.log("🏠 Real Estate Plugin: Enabled");
  },
  onDisable: async () => {
    console.log("🏠 Real Estate Plugin: Disabled");
  },
} as PluginConfigExternal;

// Also export all components individually to support dynamic imports
export { Overview };
export { Properties };
export { Map };
export { Analytics };
export { Settings };
export { PropertyValueChart };
export { RentalIncomeChart };
export { MortgagePaymentChart };
