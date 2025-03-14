import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";

// Define the shapes of our data
export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  price: number;
  expiryDate?: string;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: {
    itemId: string;
    amount: number;
  }[];
  sellingPrice: number;
  imageUrl?: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: "expense" | "income";
  amount: number;
  description: string;
  category: string;
}

interface AppContextType {
  inventory: InventoryItem[];
  recipes: Recipe[];
  transactions: Transaction[];
  addInventoryItem: (item: Omit<InventoryItem, "id">) => void;
  updateInventoryItem: (id: string, item: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  addRecipe: (recipe: Omit<Recipe, "id">) => void;
  updateRecipe: (id: string, recipe: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;
  addTransaction: (transaction: Omit<Transaction, "id">) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Mock data for initial state
const initialInventory: InventoryItem[] = [
  {
    id: "1",
    name: "Flour",
    category: "Dry Goods",
    quantity: 5,
    unit: "kg",
    price: 2.5,
  },
  {
    id: "2",
    name: "Sugar",
    category: "Dry Goods",
    quantity: 3,
    unit: "kg",
    price: 3.0,
  },
  {
    id: "3",
    name: "Butter",
    category: "Dairy",
    quantity: 10,
    unit: "packs",
    price: 4.5,
    expiryDate: "2023-12-31",
  },
  {
    id: "4",
    name: "Eggs",
    category: "Dairy",
    quantity: 24,
    unit: "units",
    price: 0.5,
  },
  {
    id: "5",
    name: "Milk",
    category: "Dairy",
    quantity: 4,
    unit: "liters",
    price: 2.0,
    expiryDate: "2023-11-15",
  },
];

const initialRecipes: Recipe[] = [
  {
    id: "1",
    name: "Chocolate Cake",
    ingredients: [
      { itemId: "1", amount: 0.5 },
      { itemId: "2", amount: 0.25 },
      { itemId: "3", amount: 0.2 },
      { itemId: "4", amount: 4 },
    ],

    sellingPrice: 25.0,
    imageUrl:
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1089&auto=format&fit=crop",
  },
  {
    id: "2",
    name: "Vanilla Cupcakes",
    ingredients: [
      { itemId: "1", amount: 0.25 },
      { itemId: "2", amount: 0.2 },
      { itemId: "3", amount: 0.1 },
      { itemId: "4", amount: 2 },
      { itemId: "5", amount: 0.1 },
    ],

    sellingPrice: 15.0,
    imageUrl:
      "https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?q=80&w=1287&auto=format&fit=crop",
  },
];

const initialTransactions: Transaction[] = [
  {
    id: "1",
    date: "2023-10-01",
    type: "expense",
    amount: 150,
    description: "Bulk flour purchase",
    category: "Ingredients",
  },
  {
    id: "2",
    date: "2023-10-02",
    type: "income",
    amount: 75,
    description: "Cake sale",
    category: "Sales",
  },
  {
    id: "3",
    date: "2023-10-03",
    type: "expense",
    amount: 50,
    description: "New baking tools",
    category: "Equipment",
  },
  {
    id: "4",
    date: "2023-10-05",
    type: "income",
    amount: 120,
    description: "Catering event",
    category: "Services",
  },
  {
    id: "5",
    date: "2023-10-10",
    type: "expense",
    amount: 30,
    description: "Packaging materials",
    category: "Supplies",
  },
];

export const AppProvider = ({ children }: { children: ReactNode }) => {
  // Initialize state from localStorage or use initial data
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem("inventory");
    return saved ? JSON.parse(saved) : initialInventory;
  });

  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const saved = localStorage.getItem("recipes");
    return saved ? JSON.parse(saved) : initialRecipes;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem("transactions");
    return saved ? JSON.parse(saved) : initialTransactions;
  });

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem("inventory", JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem("recipes", JSON.stringify(recipes));
  }, [recipes]);

  useEffect(() => {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }, [transactions]);

  // Inventory operations
  const addInventoryItem = (item: Omit<InventoryItem, "id">) => {
    const newItem = { ...item, id: Date.now().toString() };
    setInventory([...inventory, newItem]);
  };

  const updateInventoryItem = (id: string, item: Partial<InventoryItem>) => {
    setInventory(inventory.map((i) => (i.id === id ? { ...i, ...item } : i)));
  };

  const deleteInventoryItem = (id: string) => {
    setInventory(inventory.filter((i) => i.id !== id));
  };

  // Recipe operations
  const addRecipe = (recipe: Omit<Recipe, "id">) => {
    const newRecipe = { ...recipe, id: Date.now().toString() };
    setRecipes([...recipes, newRecipe]);
  };

  const updateRecipe = (id: string, recipe: Partial<Recipe>) => {
    setRecipes(recipes.map((r) => (r.id === id ? { ...r, ...recipe } : r)));
  };

  const deleteRecipe = (id: string) => {
    setRecipes(recipes.filter((r) => r.id !== id));
  };

  // Transaction operations
  const addTransaction = (transaction: Omit<Transaction, "id">) => {
    const newTransaction = { ...transaction, id: Date.now().toString() };
    setTransactions([...transactions, newTransaction]);
  };

  return (
    <AppContext.Provider
      value={{
        inventory,
        recipes,
        transactions,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        addRecipe,
        updateRecipe,
        deleteRecipe,
        addTransaction,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
