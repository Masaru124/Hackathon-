import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function TrendChart({ data, height = 200 }) {
  const chartData = data.map(item => ({
    date: new Date(item._id.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    reports: item.count,
    avgScore: Math.round(item.avgScore)
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }}
          stroke="#888"
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          stroke="#888"
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px'
          }}
        />
        <Line 
          type="monotone" 
          dataKey="reports" 
          stroke="#3b82f6" 
          strokeWidth={2}
          dot={{ fill: '#3b82f6', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
