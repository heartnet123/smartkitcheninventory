import { useState, useEffect } from "react";
import axios from "axios"; // เพิ่ม axios import
import { useAppContext, Transaction } from "../context/AppContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Ban,
  ChevronDown,
  ChevronUp,
  DollarSign,
  SquarePlus,
  Clock,
} from "lucide-react";

const Finance = () => {
  const { addTransaction } = useAppContext();
  const [transactions, setTransactions] = useState<Transaction[]>([]); // ปรับให้เก็บ transactions ในตัวเองแทน context
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState("all");
  const [transactionType, setTransactionType] = useState<
    "all" | "income" | "expense"
  >("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [formData, setFormData] = useState<Omit<Transaction, "id">>({
    date: new Date().toISOString().split("T")[0],
    type: "expense",
    amount: 0,
    description: "",
    category: "",
  });
  
  // เพิ่มส่วนของเวลาแบบ real-time
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // ใช้ useEffect เพื่ออัพเดตเวลาทุกวินาที
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    // ดึงข้อมูล transactions จาก API เมื่อโหลดหน้า
    fetchTransactions();
    
    // Cleanup ก่อนที่ component จะถูกทำลาย
    return () => {
      clearInterval(timer);
    };
  }, []);
  
  // เพิ่มฟังก์ชั่นสำหรับดึงข้อมูล transactions จาก API
  const fetchTransactions = async () => {
    try {
      const response = await axios.get('http://localhost:3000/finance');
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };
  
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

  // Filter transactions based on timeframe
  const filterTransactionsByDate = () => {
    const now = new Date();
    const startDate = new Date();

    switch (selectedTimeframe) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        // 'all' - no date filtering
        return transactions;
    }

    return transactions.filter((t) => new Date(t.date) >= startDate);
  };

  // Filter by transaction type
  const filteredTransactions = filterTransactionsByDate().filter((t) => {
    if (transactionType === "all") return true;
    return t.type === transactionType;
  });

  // Calculate totals
  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const netProfit = totalIncome - totalExpense;

  // Group expenses by category for pie chart
  const expensesByCategory = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce(
      (acc, t) => {
        const existingCategory = acc.find((cat) => cat.name === t.category);
        if (existingCategory) {
          existingCategory.value += t.amount;
        } else {
          acc.push({ name: t.category, value: t.amount });
        }
        return acc;
      },
      [] as { name: string; value: number }[],
    );

  // Prepare data for bar chart - last 30 days of transactions
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split("T")[0];
  });

  const barChartData = last7Days.map((date) => {
    const dayTransactions = transactions.filter((t) => t.date === date);
    const income = dayTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = dayTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      date: new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      income,
      expense,
    };
  });

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData({
      ...formData,
      [name]: type === "number" ? parseFloat(value) : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // เพิ่มการส่งข้อมูลไปยัง API
      await axios.post('http://localhost:3000/finance', formData);
      // ดึงข้อมูลใหม่หลังจากเพิ่มรายการ
      fetchTransactions();
      handleCloseModal();
      // Reset form
      setFormData({
        date: new Date().toISOString().split("T")[0],
        type: "expense",
        amount: 0,
        description: "",
        category: "",
      });
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  const COLORS = [
    "#6366F1",
    "#EC4899",
    "#14B8A6",
    "#F59E0B",
    "#8B5CF6",
    "#F43F5E",
    "#10B981",
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Financial Overview</h1>
          {/* เพิ่มการแสดงวันที่และเวลาปัจจุบัน */}
          <div className="flex items-center mt-1 text-sm text-gray-500">
            <Clock size={14} className="mr-1" />
            <span>{formattedDate} เวลา {formattedTime} น.</span>
          </div>
        </div>
        <button
          onClick={handleOpenModal}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center hover:bg-indigo-700 transition-colors"
        >
          <SquarePlus size={16} className="mr-1" />
          Add Transaction
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center px-4 py-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50"
          >
            <span className="mr-2">Filter</span>
            {isFilterOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {isFilterOpen && (
            <div className="absolute mt-2 p-4 bg-white rounded-lg shadow-lg z-10 w-64">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timeframe
                </label>
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="year">Last Year</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Type
                </label>
                <select
                  value={transactionType}
                  onChange={(e) =>
                    setTransactionType(
                      e.target.value as "all" | "income" | "expense",
                    )
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="all">All Transactions</option>
                  <option value="income">Income Only</option>
                  <option value="expense">Expenses Only</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ส่วนที่เหลือของ component (summary cards, charts, etc.) ยังคงเหมือนเดิม */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-green-600">
          <p className="text-sm text-gray-500 font-medium">รายได้ทั้งหมด</p>
          <h3 className="text-2xl font-semibold mt-1">
            {totalIncome.toFixed(2)} บาท
          </h3>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-red-600">
          <p className="text-sm text-gray-500 font-medium">รายจ่ายทั้งหมด</p>
          <h3 className="text-2xl font-semibold mt-1">
            {totalExpense.toFixed(2)} บาท
          </h3>
        </div>
        <div
          className={`bg-white p-5 rounded-xl shadow-sm border-l-4 ${netProfit >= 0 ? "border-indigo-600" : "border-orange-600"}`}
        >
          <p className="text-sm text-gray-500 font-medium">กำไรสุทธิ</p>
          <h3
            className={`text-2xl font-semibold mt-1 ${netProfit >= 0 ? "text-indigo-700" : "text-orange-700"}`}
          >
            {netProfit.toFixed(2)} บาท
          </h3>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-5 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Last 7 Days</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="income" fill="#10B981" name="Income" />

                <Bar dataKey="expense" fill="#F43F5E" name="Expense" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4">ค่าใช้จ่ายตามประเภท</h2>
          {expensesByCategory.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expensesByCategory.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `${Number(value).toFixed(2)} บาท`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center flex-col text-gray-400">
              <Ban size={48} strokeWidth={1} />
              <p className="mt-2">No expense data to display</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold">Transaction History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  วันที่
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  รายละเอียด
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ประเภท
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  จำนวน
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.length > 0 ? (
                filteredTransactions
                  .sort(
                    (a, b) =>
                      new Date(b.date).getTime() - new Date(a.date).getTime(),
                  )
                  .map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {transaction.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
                          {transaction.category}
                        </span>
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}
                      >
                        {transaction.type === "income" ? "+" : "-"} 
                        {transaction.amount.toFixed(2)} บาท
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    No transactions found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for adding transaction */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-5 border-b">
              <h3 className="text-lg font-medium">Add New Transaction</h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-500"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <div className="flex space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value="income"
                        checked={formData.type === "income"}
                        onChange={handleChange}
                        className="form-radio h-4 w-4 text-indigo-600"
                      />

                      <span className="ml-2">Income</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value="expense"
                        checked={formData.type === "expense"}
                        onChange={handleChange}
                        className="form-radio h-4 w-4 text-indigo-600"
                      />

                      <span className="ml-2">Expense</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    จำนวน
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
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
                    required
                    placeholder={
                      formData.type === "income"
                        ? "e.g., Sales, Services"
                        : "e.g., Ingredients, Equipment"
                    }
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  Add Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
