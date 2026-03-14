import React, { useEffect, useState } from 'react';
import loadRecharts from '../../utils/loadRecharts';

const StudentResultDistributionChart = ({ chartData = [], correctCount = 0, wrongCount = 0 }) => {
    const [R, setR] = useState(null);

    useEffect(() => {
        let mounted = true;
        loadRecharts().then((mod) => {
            if (mounted) setR(mod);
        }).catch(() => {});
        return () => {
            mounted = false;
        };
    }, []);

    return (
        <div className="bg-white rounded-3xl shadow-lg p-8 flex flex-col items-center justify-center border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Başarı Dağılımı</h3>
            <div className="w-full h-72">
                {R ? (
                    <R.ResponsiveContainer width="100%" height="100%">
                        <R.PieChart>
                            <R.Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <R.Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </R.Pie>
                            <R.Tooltip formatter={(value) => value} />
                            <R.Legend />
                        </R.PieChart>
                    </R.ResponsiveContainer>
                ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-400">Yükleniyor...</div>
                )}
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