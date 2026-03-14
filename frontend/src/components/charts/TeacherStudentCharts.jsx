import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    CartesianGrid,
    Cell
} from 'recharts';

const TeacherStudentCharts = ({ history = [], topics = [] }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-white to-indigo-50 border-2 border-indigo-100 rounded-3xl p-6 shadow-lg">
                <h3 className="font-black text-gray-800 mb-6 flex items-center gap-3 text-lg">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                        📈
                    </div>
                    Sınav Başarı Grafiği
                </h3>
                <div className="h-72">
                    {history.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={history}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 600 }}
                                    axisLine={false}
                                    tickLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    domain={[0, 100]}
                                    tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 600 }}
                                    axisLine={false}
                                    tickLine={false}
                                    dx={-10}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '16px',
                                        border: 'none',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                                        padding: '12px 16px'
                                    }}
                                    labelStyle={{ fontWeight: 'bold', color: '#4f46e5' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#4f46e5"
                                    strokeWidth={4}
                                    dot={{ r: 7, fill: '#4f46e5', strokeWidth: 3, stroke: '#fff' }}
                                    activeDot={{ r: 9, strokeWidth: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <div className="text-6xl mb-3">📊</div>
                            <div className="font-semibold">Henüz sınav verisi yok</div>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-gradient-to-br from-white to-pink-50 border-2 border-pink-100 rounded-3xl p-6 shadow-lg">
                <h3 className="font-black text-gray-800 mb-6 flex items-center gap-3 text-lg">
                    <div className="w-10 h-10 bg-pink-600 rounded-xl flex items-center justify-center text-white">
                        🎯
                    </div>
                    Konu Hakimiyeti
                </h3>
                <div className="h-72">
                    {topics.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topics.slice(0, 6)} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#fce7f3" />
                                <XAxis type="number" domain={[0, 100]} hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={120}
                                    tick={{ fontSize: 12, fill: '#374151', fontWeight: 600 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{
                                        borderRadius: '16px',
                                        border: 'none',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                                        padding: '12px 16px'
                                    }}
                                />
                                <Bar dataKey="score" radius={[0, 12, 12, 0]} barSize={24}>
                                    {topics.slice(0, 6).map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.score >= 70 ? '#10b981' : entry.score >= 50 ? '#f59e0b' : '#ef4444'}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <div className="text-6xl mb-3">🎯</div>
                            <div className="font-semibold">Henüz konu verisi yok</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeacherStudentCharts;