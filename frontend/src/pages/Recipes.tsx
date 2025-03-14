import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";

// Updated interfaces to match backend
interface RecipeIngredient {
  inventory_item_id: number;
  quantity: number;
  unit: string;
  unit_conversion_factor?: number;
}

interface Recipe {
  id: number;
  name: string;
  instructions: string | null; // Allow null as per backend
  ingredients: RecipeIngredient[];
  selling_price: number; // Changed from optional to required
}

interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  price: number;
}

const Recipes: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Omit<Recipe, 'id'>>({
    name: '',
    instructions: '',
    ingredients: [],
    selling_price: 0
  });
  const [newIngredient, setNewIngredient] = useState<RecipeIngredient>({ 
    inventory_item_id: 0,
    quantity: 1, 
    unit: '' 
  });

  useEffect(() => {
    fetchRecipes();
    fetchInventory();
  }, []);

  const fetchRecipes = async () => {
    try {
      const response = await axios.get('http://localhost:3000/recipes/');
      setRecipes(response.data);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await axios.get('http://localhost:3000/inventory/');
      setInventory(response.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const handleOpenDialog = (edit: boolean = false, recipe?: Recipe) => {
    // Fetch inventory to ensure we have the latest data
    fetchInventory();
    
    if (edit && recipe) {
      setIsEditing(true);
      setFormData({
        name: recipe.name,
        instructions: recipe.instructions || '',
        ingredients: [...recipe.ingredients],
        selling_price: recipe.selling_price || 0
      });
      setSelectedRecipe(recipe);
    } else {
      setIsEditing(false);
      setFormData({
        name: '',
        instructions: '',
        ingredients: [],
        selling_price: 0
      });
      setSelectedRecipe(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewIngredient({ 
      inventory_item_id: 0,
      quantity: 1, 
      unit: '' 
    });
  };

  const handleDeleteClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setOpenDeleteDialog(true);
  };

  const handleDetailsClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setOpenDetailsDialog(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ 
      ...formData, 
      [name]: name === 'selling_price' ? parseFloat(value) || 0 : value 
    });
  };

  const handleIngredientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // If changing inventory item, set the unit from the selected item
    if (name === 'inventory_item_id') {
      const selectedItem = inventory.find(item => item.id === parseInt(value));
      setNewIngredient({
        ...newIngredient,
        inventory_item_id: parseInt(value),
        unit: selectedItem?.unit || ''
      });
    } else {
      setNewIngredient({
        ...newIngredient,
        [name]: name === 'quantity' ? parseFloat(value) || 0 : value,
      });
    }
  };

  const handleAddIngredient = () => {
    if (newIngredient.inventory_item_id && newIngredient.quantity > 0 && newIngredient.unit) {
      setFormData({
        ...formData,
        ingredients: [
          ...formData.ingredients,
          {
            ...newIngredient,
            unit_conversion_factor: 1 // Default value as per backend
          }
        ]
      });
      setNewIngredient({ 
        inventory_item_id: 0,
        quantity: 1, 
        unit: '' 
      });
    }
  };

  const handleRemoveIngredient = (index: number) => {
    const updatedIngredients = [...formData.ingredients];
    updatedIngredients.splice(index, 1);
    setFormData({ ...formData, ingredients: updatedIngredients });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && selectedRecipe) {
        await axios.put(`http://localhost:3000/recipes/${selectedRecipe.id}`, formData);
      } else {
        await axios.post('http://localhost:3000/recipes/', formData);
      }
      handleCloseDialog();
      fetchRecipes();
    } catch (error) {
      console.error('Error saving recipe:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedRecipe) return;
    try {
      await axios.delete(`http://localhost:3000/recipes/${selectedRecipe.id}`);
      setOpenDeleteDialog(false);
      fetchRecipes();
    } catch (error) {
      console.error('Error deleting recipe:', error);
    }
  };

  // Find inventory item name by ID
  const getInventoryItemName = (itemId: number) => {
    const item = inventory.find(i => i.id === itemId);
    return item ? item.name : 'Unknown Item';
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">สูตร</h1>
        <button 
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
          onClick={() => handleOpenDialog()}
        >
          <Plus size={18} /> Add Recipe
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map(recipe => (
          <div key={recipe.id} className="border rounded-lg overflow-hidden shadow-md">
            <div className="p-4">
              <h2 className="font-bold text-xl mb-2">{recipe.name}</h2>
              <p className="text-gray-700 mb-4 truncate">{recipe.instructions}</p>
              {recipe.selling_price && (
                <div className="text-sm text-gray-500">
                  <span>Price: ${recipe.selling_price.toFixed(2)}</span>
                </div>
              )}
            </div>
            <div className="bg-gray-50 px-4 py-3 border-t flex justify-end gap-2">
              <button onClick={() => handleDetailsClick(recipe)} className="text-blue-500 hover:text-blue-700">
                View Details
              </button>
              <button onClick={() => handleOpenDialog(true, recipe)} className="text-green-500 hover:text-green-700">
                <Pencil size={16} />
              </button>
              <button onClick={() => handleDeleteClick(recipe)} className="text-red-500 hover:text-red-700">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Recipe Dialog */}
      {openDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{isEditing ? 'Edit Recipe' : 'Add New Recipe'}</h2>
              <button onClick={handleCloseDialog} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Recipe Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                <textarea
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  rows={3}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price ($)</label>
                <input
                  type="number"
                  name="selling_price"
                  value={formData.selling_price}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  step="0.01"
                  min="0"
                />
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Ingredients</label>
                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    className="text-sm bg-green-100 text-green-600 px-2 py-1 rounded hover:bg-green-200"
                  >
                    + Add
                  </button>
                </div>
                
                <div className="bg-gray-50 p-3 rounded border mb-2">
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <select
                      name="inventory_item_id"
                      value={newIngredient.inventory_item_id}
                      onChange={handleIngredientChange}
                      className="col-span-2 p-2 border border-gray-300 rounded"
                    >
                      <option value="">Select an item</option>
                      {inventory.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.unit})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      name="quantity"
                      value={newIngredient.quantity}
                      onChange={handleIngredientChange}
                      placeholder="Qty"
                      className="p-2 border border-gray-300 rounded"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                
                {formData.ingredients.length > 0 ? (
                  <div className="border rounded overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase"></th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {formData.ingredients.map((ingredient, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              {getInventoryItemName(ingredient.inventory_item_id)}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              {ingredient.quantity}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              {ingredient.unit}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                type="button"
                                onClick={() => handleRemoveIngredient(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm italic">No ingredients added yet.</p>
                )}
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseDialog}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {isEditing ? 'Update' : 'Create'} Recipe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {openDeleteDialog && selectedRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">Delete Recipe</h2>
            <p className="mb-6">Are you sure you want to delete "{selectedRecipe.name}"?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setOpenDeleteDialog(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recipe Details Dialog */}
      {openDetailsDialog && selectedRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{selectedRecipe.name}</h2>
              <button onClick={() => setOpenDetailsDialog(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            
            {selectedRecipe.instructions && (
              <div className="mb-4">
                <h3 className="text-md font-medium mb-2">Instructions</h3>
                <p className="text-gray-700 whitespace-pre-line">{selectedRecipe.instructions}</p>
              </div>
            )}
            
            <div className="mb-4">
              <h3 className="text-md font-medium mb-2">Ingredients</h3>
              {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 ? (
                <ul className="list-disc list-inside">
                  {selectedRecipe.ingredients.map((ing, index) => (
                    <li key={index} className="text-gray-700">
                      {getInventoryItemName(ing.inventory_item_id)} - {ing.quantity} {ing.unit}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">No ingredients listed</p>
              )}
            </div>
            
            {selectedRecipe.selling_price && (
              <div className="mb-4">
                <h3 className="text-md font-medium mb-2">Selling Price</h3>
                <p className="text-gray-700">${selectedRecipe.selling_price.toFixed(2)}</p>
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setOpenDetailsDialog(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recipes;