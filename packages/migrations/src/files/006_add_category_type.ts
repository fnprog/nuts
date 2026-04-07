import type { Migration } from "../types";

export const migration006: Migration = {
  version: 6,
  name: "add_category_type_column",

  async up(execute) {
    try {
      await execute(`ALTER TABLE categories ADD COLUMN type TEXT`);
    } catch (error) {
      console.log("Type column may already exist, skipping ALTER TABLE");
    }

    await execute(`UPDATE categories SET type = 'expense' WHERE type IS NULL OR type = ''`);
  },

  async down(execute) {
    await execute(`ALTER TABLE categories DROP COLUMN type`);
  },
};
