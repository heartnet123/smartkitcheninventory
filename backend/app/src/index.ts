import { Elysia, t } from "elysia";
import { Database } from "bun:sqlite";
import { swagger } from "@elysiajs/swagger";

// Initialize SQLite database
const db = new Database("personal_app.sqlite", { create: true });

// Create tables if not exists
db.exec(`
  -- Inventory Items
  CREATE TABLE IF NOT EXISTS inventory_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    price REAL NOT NULL,
    low_stock_threshold INTEGER DEFAULT 5,
    description TEXT,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Inventory Stock History
  CREATE TABLE IF NOT EXISTS inventory_stock_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inventory_item_id INTEGER NOT NULL,
    quantity_change REAL NOT NULL,
    reason TEXT,
    recipe_id INTEGER,
    change_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE SET NULL
  );

  -- Recipe Categories
  CREATE TABLE IF NOT EXISTS recipe_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT
  );

  -- Recipes
  CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    instructions TEXT,
    selling_price REAL NOT NULL DEFAULT 0,
    image_url TEXT,
    category_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES recipe_categories(id) ON DELETE SET NULL
  );

  -- Recipe Ingredients
  CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER NOT NULL,
    inventory_item_id INTEGER NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    unit_conversion_factor REAL DEFAULT 1,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT
  );

  -- Finance
  CREATE TABLE IF NOT EXISTS finance (
    record_id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    amount REAL NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    category TEXT
  );

  -- Finance Recipe Sales
  CREATE TABLE IF NOT EXISTS finance_recipe_sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    finance_id INTEGER NOT NULL,
    recipe_id INTEGER NOT NULL,
    quantity_sold INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (finance_id) REFERENCES finance(record_id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE RESTRICT
  );

  -- Profit Analytics
  CREATE TABLE IF NOT EXISTS profit_analytics (
    analytics_id INTEGER PRIMARY KEY AUTOINCREMENT,
    month TEXT NOT NULL UNIQUE,
    total_income REAL DEFAULT 0,
    total_expense REAL DEFAULT 0,
    net_profit REAL DEFAULT 0,
    recipe_sales_count INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// --- Helper Functions --- //

// Inventory Handlers
function getInventoryItems({ db }: any) {
  return db.query("SELECT * FROM inventory_items").all();
}

function createInventoryItem({ db, body }: any) {
  const { name, quantity, unit, price } = body;
  const stmt = db.prepare(
    "INSERT INTO inventory_items (name, quantity, unit, price) VALUES (?, ?, ?, ?)"
  );
  const result = stmt.run(name, quantity, unit, price);
  return { item_id: result.lastInsertRowid, name, quantity, unit, price };
}

function updateInventoryItem({ db, params, body }: any) {
  const { name, quantity, unit, price } = body;
  const stmt = db.prepare(
    "UPDATE inventory_items SET name = ?, quantity = ?, unit = ?, price = ? WHERE id = ?"
  );
  stmt.run(name, quantity, unit, price, params.id);
  return { success: true };
}

function deleteInventoryItem({ db, params }: any) {
  const stmt = db.prepare("DELETE FROM inventory_items WHERE id = ?");
  stmt.run(params.id);
  return { success: true };
}

// Recipe Handlers
function getRecipes({ db }: any) {
  return db.query("SELECT * FROM recipes").all();
}

function getRecipeById({ db, params }: any) {
  const recipe = db.query("SELECT * FROM recipes WHERE id = ?").get(params.id);
  if (!recipe) {
    return new Response("Recipe not found", { status: 404 });
  }
  const ingredients = db.query(`
    SELECT ri.*, i.name as ingredient_name, i.price 
    FROM recipe_ingredients ri
    JOIN inventory_items i ON ri.inventory_item_id = i.id
    WHERE ri.recipe_id = ?
  `).all(params.id);
  return { ...recipe, ingredients };
}

function createRecipe({ db, body }: any) {
  const { name, instructions, ingredients, selling_price } = body;
  const stmt = db.prepare(
    "INSERT INTO recipes (name, instructions, selling_price) VALUES (?, ?, ?)"
  );
  const result = stmt.run(name, instructions ?? null, selling_price);
  const recipeId = result.lastInsertRowid;

  if (Array.isArray(ingredients)) {
    const ingredientStmt = db.prepare(
      "INSERT INTO recipe_ingredients (recipe_id, inventory_item_id, quantity, unit, unit_conversion_factor) VALUES (?, ?, ?, ?, ?)"
    );
    for (const ingredient of ingredients) {
      const { inventory_item_id, quantity, unit, unit_conversion_factor } = ingredient;
      ingredientStmt.run(
        recipeId,
        inventory_item_id,
        quantity,
        unit,
        unit_conversion_factor ?? 1
      );
    }
  }
  return { recipe_id: recipeId, name, instructions, ingredients, selling_price };
}

function deleteRecipe({ db, params }: any) {
  const stmt = db.prepare("DELETE FROM recipes WHERE id = ?");
  stmt.run(params.id);
  return { success: true };
}

// Finance Handlers
function getFinanceRecords({ db }: any) {
  return db.query("SELECT * FROM finance").all();
}

function createFinanceRecord({ db, body }: any) {
  const { description, amount, type, category } = body;
  const stmt = db.prepare(
    "INSERT INTO finance (description, amount, type, category) VALUES (?, ?, ?, ?)"
  );
  const result = stmt.run(description ?? null, amount, type, category ?? null);
  return { record_id: result.lastInsertRowid, description, amount, type, category };
}

// Analytics Handler
function calculateAnalytics({ db, body }: any) {
  const { month } = body;
  const income =
    ((db.query(
      "SELECT SUM(amount) as total FROM finance WHERE type = 'income' AND strftime('%Y-%m', date) = ?"
    ).get(month) as { total: number | null })?.total || 0);
  const expense =
    ((db.query(
      "SELECT SUM(amount) as total FROM finance WHERE type = 'expense' AND strftime('%Y-%m', date) = ?"
    ).get(month) as { total: number | null })?.total || 0);
  const net_profit = income - expense;
  const stmt = db.prepare(
    "INSERT INTO profit_analytics (month, total_income, total_expense, net_profit) VALUES (?, ?, ?, ?)"
  );
  const result = stmt.run(month, income, expense, net_profit);
  return {
    analytics_id: result.lastInsertRowid,
    month,
    total_income: income,
    total_expense: expense,
    net_profit,
  };
}

// --- Elysia App Instance --- //

const app = new Elysia()
  .use(swagger())
  .decorate("db", db)
  .group("/inventory", (app: any) =>
    app
      .get("/", ({ db }: any) => getInventoryItems({ db }))
      .post(
        "/",
        ({ db, body }: any) => createInventoryItem({ db, body }),
        {
          body: t.Object({
            name: t.String(),
            quantity: t.Number(),
            unit: t.String(),
            price: t.Number(),
          }),
        }
      )
      .put(
        "/:id",
        ({ db, params, body }: any) => updateInventoryItem({ db, params, body }),
        {
          params: t.Object({ id: t.String() }),
          body: t.Object({
            name: t.String(),
            quantity: t.Number(),
            unit: t.String(),
            price: t.Number(),
          }),
        }
      )
      .delete(
        "/:id",
        ({ db, params }: any) => deleteInventoryItem({ db, params }),
        { params: t.Object({ id: t.String() }) }
      )
  )
  .group("/recipes", (app: any) =>
    app
      .get("/", ({ db }: any) => getRecipes({ db }))
      .get(
        "/:id",
        ({ db, params }: any) => getRecipeById({ db, params }),
        { params: t.Object({ id: t.String() }) }
      )
      .post(
        "/",
        ({ db, body }: any) => createRecipe({ db, body }),
        {
          body: t.Object({
            name: t.String(),
            instructions: t.Optional(t.String()),
            selling_price: t.Number(),
            ingredients: t.Optional(
              t.Array(
                t.Object({
                  inventory_item_id: t.Number(),
                  quantity: t.Number(),
                  unit: t.String(),
                  unit_conversion_factor: t.Optional(t.Number()),
                })
              )
            ),
          }),
        }
      )
     .delete(
        "/:id",
        ({ db, params }: any) => deleteRecipe({ db, params }),
        { params: t.Object({ id: t.String() }) })
  )
  .group("/finance", (app: any) =>
    app
      .get("/", ({ db }: any) => getFinanceRecords({ db }))
      .post(
        "/",
        ({ db, body }: any) => createFinanceRecord({ db, body }),
        {
          body: t.Object({
            description: t.Optional(t.String()),
            amount: t.Number(),
            type: t.String({ enum: ["income", "expense"] }),
            category: t.Optional(t.String()),
          }),
        }
      )
  )
  .group("/analytics", (app: any) =>
    app
      .get("/", ({ db }: any) =>
        db.query("SELECT * FROM profit_analytics").all()
      )
      .post(
        "/calculate",
        ({ db, body }: any) => calculateAnalytics({ db, body }),
        {
          body: t.Object({
            month: t.String(),
          }),
        }
      )
  )
  .listen(3000);

console.log(`Server running at http://${app.server?.hostname}:${app.server?.port}`);
