import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Users, Eye, Clock, Globe } from "lucide-react";

interface VisitStatsCardProps {
  title: string;
  value: number;
  change?: number;
  changeLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: "green" | "red" | "blue" | "purple";
}

const VisitStatsCard = ({ 
  title, 
  value, 
  change, 
  changeLabel, 
  icon: Icon, 
  color = "blue" 
}: VisitStatsCardProps) => {
  const isPositive = change !== undefined && change >= 0;
  
  const colorClasses = {
    green: "text-green-600 bg-green-50",
    red: "text-red-600 bg-red-50", 
    blue: "text-blue-600 bg-blue-50",
    purple: "text-purple-600 bg-purple-50"
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {value.toLocaleString('ar-SA')}
        </div>
        {change !== undefined && (
          <div className="flex items-center text-sm">
            {isPositive ? (
              <TrendingUp className="h-3 w-3 text-green-500 ml-1" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500 ml-1" />
            )}
            <span className={isPositive ? "text-green-600" : "text-red-600"}>
              {Math.abs(change)}%
            </span>
            {changeLabel && (
              <span className="text-gray-500 mr-1">
                {changeLabel}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface QuickStatsProps {
  stats: {
    todayVisits: number;
    yesterdayVisits: number;
    thisWeekVisits: number;
    thisMonthVisits: number;
    growthRate: number;
  };
}

export const QuickVisitStats = ({ stats }: QuickStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <VisitStatsCard
        title="زيارات اليوم"
        value={stats.todayVisits}
        change={stats.growthRate}
        changeLabel="من الأمس"
        icon={Eye}
        color="green"
      />
      <VisitStatsCard
        title="زيارات هذا الأسبوع"
        value={stats.thisWeekVisits}
        icon={Users}
        color="blue"
      />
      <VisitStatsCard
        title="زيارات هذا الشهر"
        value={stats.thisMonthVisits}
        icon={Globe}
        color="purple"
      />
      <VisitStatsCard
        title="الأمس"
        value={stats.yesterdayVisits}
        icon={Clock}
        color="red"
      />
    </div>
  );
};

export default VisitStatsCard;