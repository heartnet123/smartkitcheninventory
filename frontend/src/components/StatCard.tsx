import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  change?: string;
  positive?: boolean;
  color: string;
}

const StatCard = ({
  title,
  value,
  icon,
  change,
  positive,
  color,
}: StatCardProps) => {
  return (
    <div className={`bg-white p-5 rounded-xl shadow-sm border-l-4 ${color}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <h3 className="text-2xl font-semibold mt-1">{value}</h3>
          {change && (
            <p
              className={`text-xs mt-2 ${positive ? "text-green-600" : "text-red-600"}`}
            >
              {positive ? "↑" : "↓"} {change} from last month
            </p>
          )}
        </div>
        <div
          className={`p-2 rounded-lg ${color.replace("border-", "bg-").replace("-600", "-100")}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
