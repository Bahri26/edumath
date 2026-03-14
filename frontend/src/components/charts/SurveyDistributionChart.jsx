import React from 'react';

function polarToCartesian(cx, cy, r, angleInDegrees) {
    var angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
        x: cx + r * Math.cos(angleInRadians),
        y: cy + r * Math.sin(angleInRadians),
    };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
    var start = polarToCartesian(cx, cy, r, endAngle);
    var end = polarToCartesian(cx, cy, r, startAngle);
    var largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    var d = ['M', start.x, start.y, 'A', r, r, 0, largeArcFlag, 0, end.x, end.y, 'L', cx, cy, 'Z'].join(' ');
    return d;
}

const SurveyDistributionChart = ({ chartData = [], colors = ['#60A5FA', '#34D399', '#F97316', '#EF4444'] }) => {
    const total = chartData.reduce((s, c) => s + (c.value || 0), 0) || 1;
    let angle = 0;
    const size = 240;
    const cx = size / 2;
    const cy = size / 2;
    const outerR = size / 2 - 10;
    const innerR = outerR * 0.6;

    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-700 mb-6">Memnuniyet Dağılımı</h3>
            <div className="h-64 w-full flex items-center justify-center">
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    {chartData.map((slice, idx) => {
                        const value = slice.value || 0;
                        const start = angle;
                        const portion = (value / total) * 360;
                        angle += portion;
                        const d = describeArc(cx, cy, outerR, start, start + portion);
                        return <path key={idx} d={d} fill={colors[idx % colors.length]} stroke="#fff" strokeWidth={2} />;
                    })}
                    <circle cx={cx} cy={cy} r={innerR} fill="#fff" />
                </svg>
            </div>
        </div>
    );
};

export default SurveyDistributionChart;