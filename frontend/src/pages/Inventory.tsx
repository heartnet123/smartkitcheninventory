import { useState, useEffect } from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";

interface InventoryItem {
  id?: number;  // Changed from item_id to id to match backend
  name: string;
  category?: string;
  quantity: number;
  unit: string;
  price: number;
  date_added?: string;
}

const Inventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentItem, setCurrentItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    quantity: 0,
    price: 0,
    unit: "units", // Default unit value
    expiryDate: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:3000/inventory");
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      const data = await res.json();
      // Map backend fields to frontend fields if needed
      setInventory(data.map((item: any) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        price: item.price,
        // Map other fields as needed
      })));
    } catch (error) {
      console.error("Failed to load inventory data", error);
      setError("Failed to load inventory data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (item?: InventoryItem) => {
    if (item) {
      setCurrentItem(item);
      setFormData({
        name: item.name,
        category: item.category || "",
        quantity: item.quantity,
        price: item.price,
        unit: item.unit || "units",
        expiryDate: "", // No expiryDate in backend
      });
    } else {
      setCurrentItem(null);
      setFormData({
        name: "",
        category: "",
        quantity: 0,
        price: 0,
        unit: "units",
        expiryDate: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === "number" ? parseFloat(value) : value,
    });
  };

  const addInventoryItem = async (itemData: Omit<InventoryItem, "item_id">) => {
    setIsLoading(true);
    setError(null);
    try {
      // Include all required fields that backend expects
      const payload = {
        name: itemData.name,
        quantity: itemData.quantity,
        unit: itemData.unit || "units", // Ensure unit is included
        price: itemData.price,
      };
      
      const res = await fetch("http://localhost:3000/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      
      const newItem = await res.json();
      setInventory([...inventory, newItem]);
      return true;
    } catch (error) {
      console.error("Failed to add item", error);
      setError("Failed to add item. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateInventoryItem = async (
    id: number,
    itemData: Omit<InventoryItem, "item_id">,
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      // Include all required fields that backend expects
      const payload = {
        name: itemData.name,
        quantity: itemData.quantity,
        unit: itemData.unit || "units", // Ensure unit is included
        price: itemData.price,
      };
      
      const res = await fetch(`http://localhost:3000/inventory/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      
      const updated = inventory.map((item) =>
        item.id === id ? { ...item, ...itemData } : item
      );
      setInventory(updated);
      return true;
    } catch (error) {
      console.error("Failed to update item", error);
      setError("Failed to update item. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteInventoryItem = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`http://localhost:3000/inventory/${id}`, {
          method: "DELETE",
        });
        
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        
        setInventory(inventory.filter((item) => item.id !== id));
      } catch (error) {
        console.error("Failed to delete item", error);
        setError("Failed to delete item. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let success = false;
    
    if (currentItem && currentItem.id) {
      success = await updateInventoryItem(currentItem.id, {
        name: formData.name,
        category: formData.category,
        quantity: formData.quantity,
        unit: formData.unit,
        price: formData.price,
      });
    } else {
      success = await addInventoryItem({
        name: formData.name,
        category: formData.category,
        quantity: formData.quantity,
        unit: formData.unit,
        price: formData.price,
      });
    }
    
    if (success) {
      handleCloseModal();
      loadInventory(); // Refresh the inventory list
    }
  };

  const filteredInventory = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.category &&
        item.category.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          จัดการคลังสินค้า
        </h1>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center hover:bg-indigo-700 transition-colors"
          disabled={isLoading}
        >
          <Plus size={16} className="mr-1" />
          Add Item
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="mb-6 w-full max-w-md">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />

          <input
            type="text"
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading && !isModalOpen ? (
          <div className="p-8 text-center text-gray-500">Loading inventory...</div>
        ) : filteredInventory.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm ? "No matching items found" : "No inventory items found. Add some items to get started."}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ชื่อ
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  จำนวน
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  หน่วย
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ราคา/หน่วย
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  รวม
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.price} บาท
                  </td>
                  <td>
                    {item.price*item.quantity} บาท
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleOpenModal(item)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                      disabled={isLoading}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => deleteInventoryItem(item.id!)}
                      className="text-red-600 hover:text-red-900"
                      disabled={isLoading}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-5 border-b">
              <h3 className="text-lg font-medium">
                {currentItem ? "Edit Item" : "Add New Item"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Dairy, Produce, Meat"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit
                    </label>
                    <input
                      type="text"
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., kg, liters, units"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price per Unit
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date (optional - frontend only)
                  </label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : currentItem ? "Update" : "Add"} Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;