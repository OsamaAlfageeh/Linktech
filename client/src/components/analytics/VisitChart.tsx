import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface DailyVisitData {
  date: string;
  visits: number;
  uniqueVisitors: number;
}

interface VisitChartProps {
  data: DailyVisitData[];
}

export const VisitChart = ({ data }: VisitChartProps) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">الزيارات اليومية</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              labelFormatter={formatDate}
              formatter={(value, name) => [
                value, 
                name === 'visits' ? 'إجمالي الزيارات' : 'الزوار الفريدون'
              ]}
            />
            <Line 
              type="monotone" 
              dataKey="visits" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="uniqueVisitors" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

interface TopPagesData {
  url: string;
  views: number;
}

interface TopPagesChartProps {
  data: TopPagesData[];
}

export const TopPagesChart = ({ data }: TopPagesChartProps) => {
  const formatUrl = (url: string) => {
    if (url === '/') return 'الصفحة الرئيسية';
    if (url === '/projects') return 'المشاريع';
    if (url === '/projects/trending') return 'المشاريع الرائجة';
    if (url === '/for-companies') return 'للشركات';
    if (url === '/about') return 'من نحن';
    if (url === '/contact') return 'اتصل بنا';
    return url.replace('/', '');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">أكثر الصفحات زيارة</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis 
              type="category" 
              dataKey="url" 
              tick={{ fontSize: 12 }}
              tickFormatter={formatUrl}
              width={120}
            />
            <Tooltip 
              formatter={(value) => [value, 'مشاهدات']}
              labelFormatter={formatUrl}
            />
            <Bar dataKey="views" fill="#8b5cf6" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

interface DeviceStatsData {
  desktop: number;
  mobile: number;
  tablet: number;
}

interface DeviceStatsChartProps {
  data: DeviceStatsData;
}

export const DeviceStatsChart = ({ data }: DeviceStatsChartProps) => {
  const chartData = [
    { name: 'سطح المكتب', value: data.desktop || 0, color: '#3b82f6' },
    { name: 'الهاتف', value: data.mobile || 0, color: '#10b981' },
    { name: 'الجهاز اللوحي', value: data.tablet || 0, color: '#f59e0b' }
  ].filter(item => item.value > 0);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">توزيع الأجهزة</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [value, 'زيارات']} />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full ml-2"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-600">{item.name}</span>
              </div>
              <div className="text-sm font-medium">
                {item.value} ({Math.round((item.value / total) * 100)}%)
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

interface BrowserStatsData {
  [key: string]: number;
}

interface BrowserStatsChartProps {
  data: BrowserStatsData;
}

export const BrowserStatsChart = ({ data }: BrowserStatsChartProps) => {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  
  const chartData = Object.entries(data)
    .map(([name, value], index) => ({
      name: name === 'unknown' ? 'غير معروف' : name,
      value,
      color: colors[index % colors.length]
    }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">المتصفحات الأكثر استخداماً</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => [value, 'زيارات']} />
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full ml-2"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-600">{item.name}</span>
              </div>
              <div className="text-sm font-medium">
                {item.value} ({Math.round((item.value / total) * 100)}%)
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};