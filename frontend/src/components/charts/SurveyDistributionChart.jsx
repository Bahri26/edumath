import React, { useEffect, useState } from 'react';
import loadRecharts from '../../utils/loadRecharts';

const SurveyDistributionChart = ({ chartData = [], colors = [] }) => {
    const [R, setR] = useState(null);

    useEffect(() => {
        let mounted = true;
        loadRecharts().then((mod) => {
            if (mounted) setR(mod);
        }).catch(() => {
            /* ignore CDN failure; keep R null to show fallback */
        });
        return () => {
            mounted = false;
        };
    }, []);

    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-700 mb-6">Memnuniyet Dağılımı</h3>
            <div className="h-64 w-full">
                {R ? (
                    <R.ResponsiveContainer width="100%" height="100%">
                        <R.PieChart>
                            <R.Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <R.Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                ))}
                            </R.Pie>
                            <R.Tooltip />
                            <R.Legend />
                        </R.PieChart>
                    </R.ResponsiveContainer>
                ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-400">Yükleniyor...</div>
                )}
            </div>
        </div>
    );
};

export default SurveyDistributionChart;