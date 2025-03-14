import { useState, useEffect } from "react";
import axios from "axios";
import StatCard from "../components/StatCard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ChefHat, DollarSign, Package, TrendingUp, Clock } from "lucide-react";

// กำหนด interfaces สำหรับข้อมูลที่จะดึงมาจาก API
interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  category: string;
}

interface Recipe {
  id: number;
  name: string;
  instructions: string | null;
  ingredients: any[];
  selling_price: number;
}

interface Transaction {
  id: number;
  date: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  category: string;
}

const Dashboard = () => {
  // State สำหรับเก็บข้อมูลที่ดึงจาก API
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // State สำหรับเก็บเวลาปัจจุบัน
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // ดึงข้อมูลเมื่อ component โหลด
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // ดึงข้อมูลจาก API แบบ parallel
        const [inventoryRes, recipesRes, transactionsRes] = await Promise.all([
          axios.get('http://localhost:3000/inventory/'),
          axios.get('http://localhost:3000/recipes/'),
          axios.get('http://localhost:3000/finance')
        ]);
        
        setInventory(inventoryRes.data);
        setRecipes(recipesRes.data);
        setTransactions(transactionsRes.data);
        setError("");
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
    
    // ตั้งค่าตัวนับเวลาเพื่ออัพเดทเวลาปัจจุบันทุกวินาที
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    // Cleanup function
    return () => {
      clearInterval(timer);
    };
  }, []);
  
  // ฟอร์แมตวันที่และเวลาในรูปแบบของไทย
  const formattedDate = new Intl.DateTimeFormat('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(currentTime);
  
  const formattedTime = new Intl.DateTimeFormat('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(currentTime);

  // คำนวณข้อมูลสำหรับ dashboard
  const totalInventoryValue = inventory
    .reduce((sum, item) => sum + item.price * item.quantity, 0)
    .toFixed(2);
    
  const totalRecipes = recipes.length;

  const incomeTotal = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expenseTotal = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const profit = (incomeTotal - expenseTotal).toFixed(2);
  const profitMargin =
    incomeTotal > 0
      ? (((incomeTotal - expenseTotal) / incomeTotal) * 100).toFixed(1)
      : "0";

  // จัดเตรียมข้อมูลสำหรับกราฟแยกตามหมวดหมู่สินค้าคงคลัง
  const inventoryByCategory = inventory.reduce(
    (acc, item) => {
      const existingCategory = acc.find((cat) => cat.name === item.category);
      if (existingCategory) {
        existingCategory.value += item.quantity;
      } else if (item.category) { // เพิ่มการตรวจสอบเพื่อป้องกันหมวดหมู่ว่าง
        acc.push({ name: item.category, value: item.quantity });
      }
      return acc;
    },
    [] as { name: string; value: number }[],
  );

  // จัดเตรียมข้อมูลสำหรับกราฟแท่งแสดงธุรกรรม 7 รายการล่าสุด
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const transactionData = last7Days.map(date => {
    const dayTransactions = transactions.filter(t => t.date.startsWith(date));
    const income = dayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = dayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      income,
      expense
    };
  });

  const COLORS = ["#6366F1", "#EC4899", "#14B8A6", "#F59E0B", "#8B5CF6"];

  // แสดงข้อความ loading หากกำลังโหลดข้อมูล
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-3 text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // แสดงข้อความ error หากมีข้อผิดพลาด
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-red-500">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-3 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <div className="flex items-center mt-1 text-sm text-gray-500">
            <Clock size={14} className="mr-1" />
            <span>{formattedDate} เวลา {formattedTime} น.</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="มูลค่าสินค้าคงคลัง"
          value={`${totalInventoryValue} บาท`}
          icon={<Package size={20} className="text-blue-700" />}
          color="border-blue-600"
        />

        <StatCard
          title="สูตรอาหารทั้งหมด"
          value={totalRecipes}
          icon={<ChefHat size={20} className="text-pink-700" />}
          color="border-pink-600"
        />

        <StatCard
          title="กำไรสุทธิ"
          value={`${profit} บาท`}
          icon={<DollarSign size={20} className="text-teal-700" />}
          positive={parseFloat(profit) >= 0}
          color="border-teal-600"
        />

        <StatCard
          title="อัตรากำไร"
          value={`${profitMargin}%`}
          icon={<TrendingUp size={20} className="text-amber-700" />}
          positive={parseFloat(profitMargin) >= 0}
          color="border-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">ภาพรวมทางการเงิน (7 วันล่าสุด)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={transactionData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `${value} บาท`} />
                <Bar dataKey="income" name="รายรับ" fill="#6366F1" />
                <Bar dataKey="expense" name="รายจ่าย" fill="#F87171" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4">สินค้าคงคลังตามหมวดหมู่</h2>
          {inventoryByCategory.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={inventoryByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {inventoryByCategory.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} หน่วย`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              ไม่มีข้อมูลหมวดหมู่สินค้าคงคลัง
            </div>
          )}
        </div>
      </div>
      
      {/* เพิ่มส่วนแสดงรายละเอียด inventory */}
      <div className="mt-8 bg-white p-5 rounded-xl shadow-sm">
        <h2 className="text-lg font-semibold mb-4">รายการสินค้าคงคลังทั้งหมด</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อสินค้า</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">จำนวน</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">หน่วย</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ราคาต่อหน่วย</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">มูลค่ารวม</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventory.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.unit}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.price.toFixed(2)} บาท</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">{(item.price * item.quantity).toFixed(2)} บาท</td>
                </tr>
              ))}
              <tr className="bg-gray-50">
                <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">มูลค่ารวมทั้งหมด:</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">{totalInventoryValue} บาท</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;