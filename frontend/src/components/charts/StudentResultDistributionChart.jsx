import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const StudentResultDistributionChart = ({ chartData = [], correctCount = 0, wrongCount = 0 }) => {
    return (
        <div className="bg-white rounded-3xl shadow-lg p-8 flex flex-col items-center justify-center border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Başarı Dağılımı</h3>
            <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value) => value} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-6 flex gap-6 text-center">
                <div>
                    <div className="text-3xl font-bold text-green-600">{correctCount}</div>
                    <div className="text-sm text-gray-500 font-medium">Doğru</div>
                </div>
                <div className="w-px bg-gray-200"></div>
                <div>
                    <div className="text-3xl font-bold text-red-600">{wrongCount}</div>
                    <div className="text-sm text-gray-500 font-medium">Yanlış</div>
                </div>
            </div>
        </div>
    );
};

export default StudentResultDistributionChart;