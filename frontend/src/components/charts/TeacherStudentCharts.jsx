import React from 'react';

const padding = { top: 20, right: 20, bottom: 30, left: 40 };

const LineChartSimple = ({ data = [] }) => {
  if (!data.length) return <div className="h-full flex items-center justify-center text-gray-400">Henüz veri yok</div>;
  const width = 480 - padding.left - padding.right;
  const height = 220 - padding.top - padding.bottom;
  const maxY = 100;
  const stepX = width / Math.max(1, data.length - 1);
  const points = data.map((d, i) => {
    const x = padding.left + i * stepX;
    const y = padding.top + (1 - (d.score || 0) / maxY) * height;
    return { x, y };
  });
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  return (
    <svg width={480} height={260}>
      <path d={path} fill="none" stroke="#4f46e5" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={5} fill="#4f46e5" stroke="#fff" strokeWidth={2} />
      ))}
    </svg>
  );
};

const BarChartSimple = ({ data = [] }) => {
  if (!data.length) return <div className="h-full flex items-center justify-center text-gray-400">Henüz veri yok</div>;
  const width = 480 - padding.left - padding.right;
  const height = 220 - padding.top - padding.bottom;
  const barWidth = Math.max(12, width / Math.max(1, data.length) - 8);
  return (
    <svg width={480} height={260}>
      {data.slice(0, 6).map((d, i) => {
        const x = padding.left + i * (barWidth + 8);
        const h = ((d.score || 0) / 100) * height;
        const y = padding.top + (height - h);
        const fill = d.score >= 70 ? '#10B981' : d.score >= 50 ? '#F59E0B' : '#EF4444';
        return <rect key={i} x={x} y={y} width={barWidth} height={h} rx={6} fill={fill} />;
      })}
    </svg>
  );
};

const TeacherStudentCharts = ({ history = [], topics = [] }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-gradient-to-br from-white to-indigo-50 border-2 border-indigo-100 rounded-3xl p-6 shadow-lg">
        <h3 className="font-black text-gray-800 mb-6 flex items-center gap-3 text-lg">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">📈</div>
          Sınav Başarı Grafiği
        </h3>
        <div className="h-72">
          <LineChartSimple data={history} />
        </div>
      </div>

      <div className="bg-gradient-to-br from-white to-pink-50 border-2 border-pink-100 rounded-3xl p-6 shadow-lg">
        <h3 className="font-black text-gray-800 mb-6 flex items-center gap-3 text-lg">
          <div className="w-10 h-10 bg-pink-600 rounded-xl flex items-center justify-center text-white">🎯</div>
          Konu Hakimiyeti
        </h3>
        <div className="h-72">
          <BarChartSimple data={topics} />
        </div>
      </div>
    </div>
  );
};

export default TeacherStudentCharts;