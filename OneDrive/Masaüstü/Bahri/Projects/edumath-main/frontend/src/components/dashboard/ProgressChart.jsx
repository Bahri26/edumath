import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const ProgressChart = ({ data, isDarkMode }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-md">
    <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">Haftalık Aktivite</h3>
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: isDarkMode ? '#1e293b' : '#fff', color: isDarkMode ? '#fff' : '#000' }} />
          <Bar dataKey="minutes" name="Dakika" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default ProgressChart;
