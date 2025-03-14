import { NavLink } from "react-router-dom";
import {
  ChartBar,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  PackageOpen,
} from "lucide-react";
import { useState } from "react";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const navItems = [
    {
      path: "/",
      label: "Dashboard",
      icon: <LayoutDashboard size={20} />,
    },
    {
      path: "/inventory",
      label: "Inventory",
      icon: <PackageOpen size={20} />,
    },
    {
      path: "/recipes",
      label: "Recipes",
      icon: <ChefHat size={20} />,
    },
    {
      path: "/finance",
      label: "Finance",
      icon: <ChartBar size={20} />,
    },
  ];

  return (
    <div
      className={`${collapsed ? "w-16" : "w-64"} transition-all duration-300 bg-indigo-600 text-white flex flex-col`}
    >
      <div className="p-4 flex items-center justify-between">
        {!collapsed && <h1 className="text-xl font-bold">KitcManage</h1>}
        <button
          onClick={toggleSidebar}
          className="p-1 rounded-full hover:bg-indigo-500"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="flex-1 pt-4">
        <ul>
          {navItems.map((item) => (
            <li key={item.path} className="mb-2">
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center p-3 ${isActive ? "bg-indigo-700" : "hover:bg-indigo-500"} ${collapsed ? "justify-center" : "pl-4"} rounded-lg mx-2 transition-colors`
                }
              >
                <span>{item.icon}</span>
                {!collapsed && <span className="ml-3">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 text-sm">
        {!collapsed && (
          <div className="bg-indigo-700 p-3 rounded-lg">
            <p className="font-medium">KitcManage v1.0</p>
            <p className="text-indigo-200 text-xs mt-1">
              Manage your kitchen smarter
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
