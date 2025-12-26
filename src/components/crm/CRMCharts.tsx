import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';

interface ChartData {
  leadsByType: { name: string; value: number; color: string }[];
  leadsByLocation: { name: string; count: number }[];
  leadsByDate: { date: string; count: number }[];
  leadsByStatus: { name: string; value: number; color: string }[];
}

interface CRMChartsProps {
  data: ChartData;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover text-popover-foreground rounded-lg shadow-lg border border-border p-3">
        <p className="text-sm font-medium">{label || payload[0].name}</p>
        <p className="text-lg font-bold text-primary">{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

const CRMCharts: React.FC<CRMChartsProps> = ({ data }) => {
  const statusColorMap: Record<string, string> = {
    'New': '#10b981',
    'In-Review': '#3b82f6',
    'In Progress': '#f59e0b',
    'Completed': '#8b5cf6',
  };

  const enhancedStatusData = data.leadsByStatus.map(item => ({
    ...item,
    name: item.name === 'Contacted' ? 'In-Review' : item.name === 'Closed' ? 'Completed' : item.name,
    color: statusColorMap[item.name === 'Contacted' ? 'In-Review' : item.name === 'Closed' ? 'Completed' : item.name] || item.color,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Applications by Status - Donut Chart */}
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <span className="w-1 h-5 bg-primary rounded-full" />
            Applications by Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] flex items-center">
            <ResponsiveContainer width="60%" height="100%">
              <PieChart>
                <Pie
                  data={enhancedStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {enhancedStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {enhancedStatusData.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{item.name}</p>
                    <p className="text-lg font-bold">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications by Form Type - Donut Chart */}
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <span className="w-1 h-5 bg-accent rounded-full" />
            Applications by Form Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] flex items-center">
            <ResponsiveContainer width="60%" height="100%">
              <PieChart>
                <Pie
                  data={data.leadsByType}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {data.leadsByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {data.leadsByType.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{item.name}</p>
                    <p className="text-lg font-bold">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications Over Time - Area Chart */}
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <span className="w-1 h-5 bg-emerald-500 rounded-full" />
            Submission Trends (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.leadsByDate}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(222, 47%, 15%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(222, 47%, 15%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(222, 47%, 15%)" 
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Applications by Location - Horizontal Bar Chart */}
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <span className="w-1 h-5 bg-blue-500 rounded-full" />
            Top Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.leadsByLocation.slice(0, 6)} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={100} 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} 
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="count" 
                  fill="hsl(217, 91%, 60%)" 
                  radius={[0, 6, 6, 0]}
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CRMCharts;