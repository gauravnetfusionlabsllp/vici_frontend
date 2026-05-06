import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

export function UtilizationChart() {
  const data = [
    { name: 'Active', value: 70 },
    { name: 'Ringing', value: 30 },
    { name: 'Paused / Dispo', value: 15 },
  ];

  return (
    <div className=" w-full h-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1e293b" />
          <XAxis type="number" stroke="#64748b" fontSize={11} />
          <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={85} />
          <Bar dataKey="value" fill="#3b82f6" radius={[0, 3, 3, 0]} barSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
