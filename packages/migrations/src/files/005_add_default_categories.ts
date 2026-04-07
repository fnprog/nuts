import type { Migration } from "../types";

export const migration005: Migration = {
  version: 5,
  name: "add_default_categories",

  async up(execute) {
    const timestamp = Date.now();
    const createdBy = "system";

    await execute(
      `INSERT OR IGNORE INTO users (id, email, first_name, last_name, password, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ["system", "system@nuts.local", "System", "User", "", timestamp, timestamp]
    );

    const parentCategories = [
      { name: "Food & Beverage", type: "expense", color: "#FF7043", icon: "Pizza" },
      { name: "Shopping", type: "expense", color: "#AB47BC", icon: "ShoppingBag" },
      { name: "Housing", type: "expense", color: "#29B6F6", icon: "Home" },
      { name: "Transportation", type: "expense", color: "#42A5F5", icon: "Bus" },
      { name: "Vehicle", type: "expense", color: "#8D6E63", icon: "Car" },
      { name: "Life & Entertainment", type: "expense", color: "#66BB6A", icon: "Music" },
      { name: "Communication & PC", type: "expense", color: "#26A69A", icon: "Smartphone" },
      { name: "Financial Expenses", type: "expense", color: "#EC407A", icon: "Credit-card" },
      { name: "Investments", type: "expense", color: "#7E57C2", icon: "BarChart2" },
      { name: "Income", type: "income", color: "#26C6DA", icon: "DollarSign" },
      { name: "Others", type: "expense", color: "#78909C", icon: "Circle" },
      { name: "Transfers", type: "expense", color: "#FFA726", icon: "Repeat" },
    ];

    const subcategories: Record<string, string[]> = {
      "Food & Beverage": ["Bar & Cafe", "Groceries", "Restaurant & Fast Food"],
      Shopping: ["Clothing & Shoes", "Electronics", "Health & Beauty", "Home & Garden", "Gifts", "Sports Equipment"],
      Housing: ["Rent", "Mortgage", "Utilities", "Maintenance & Repairs", "Property Tax"],
      Transportation: ["Public Transport", "Taxi & Ride Share", "Parking", "Travel"],
      Vehicle: ["Fuel", "Service & Maintenance", "Insurance", "Registration & Tax"],
      "Life & Entertainment": ["Entertainment", "Health & Fitness", "Hobbies", "Education", "Pets", "Subscriptions"],
      "Communication & PC": ["Phone", "Internet", "Software & Apps", "Hardware & Devices"],
      "Financial Expenses": ["Bank Fees", "Interest", "Taxes", "Insurance"],
      Investments: ["Stocks", "Crypto", "Real Estate", "Retirement", "Savings"],
      Income: ["Salary", "Business", "Dividends", "Interest", "Rental", "Sale", "Gifts Received"],
    };

    for (const parent of parentCategories) {
      const parentId = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await execute(
        `INSERT INTO categories (id, name, type, color, icon, is_default, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [parentId, parent.name, parent.type, parent.color, parent.icon, 1, createdBy, timestamp, timestamp]
      );

      const subs = subcategories[parent.name];
      if (subs) {
        for (const subName of subs) {
          const subId = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await execute(
            `INSERT INTO categories (id, name, parent_id, type, color, icon, is_default, created_by, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [subId, subName, parentId, parent.type, parent.color, parent.icon, 1, createdBy, timestamp, timestamp]
          );
        }
      }
    }
  },

  async down(execute) {
    await execute(`DELETE FROM categories WHERE created_by = 'system' AND is_default = 1`);
    await execute(`DELETE FROM users WHERE id = 'system'`);
  },
};
