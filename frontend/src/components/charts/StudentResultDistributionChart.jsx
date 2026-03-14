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

const StudentResultDistributionChart = ({ chartData = [], correctCount = 0, wrongCount = 0 }) => {
    const total = chartData.reduce((s, c) => s + (c.value || 0), 0) || 1;
    let angle = 0;
    const size = 260;
    const cx = size / 2;
    const cy = size / 2;
    const outerR = size / 2 - 8;
    const innerR = outerR * 0.6;

    return (
        <div className="bg-white rounded-3xl shadow-lg p-8 flex flex-col items-center justify-center border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Başarı Dağılımı</h3>
            <div className="w-full h-72 flex items-center justify-center">
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    {chartData.map((slice, idx) => {
                        const value = slice.value || 0;
                        const start = angle;
                        const portion = (value / total) * 360;
                        angle += portion;
                        const d = describeArc(cx, cy, outerR, start, start + portion);
                        return <path key={idx} d={d} fill={slice.color || (['#10B981', '#F59E0B', '#EF4444'][idx % 3])} stroke="#fff" strokeWidth={2} />;
                    })}
                    <circle cx={cx} cy={cy} r={innerR} fill="#fff" />
                </svg>
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