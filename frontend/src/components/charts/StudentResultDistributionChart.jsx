import React, { useState, useRef } from 'react';

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
    const [tip, setTip] = useState(null);
    const ref = useRef(null);

    const showTip = (e, slice) => {
        const rect = ref.current?.getBoundingClientRect();
        setTip({ x: (e.clientX - (rect?.left || 0)) + 8, y: (e.clientY - (rect?.top || 0)) + 8, label: slice.label || slice.name || 'Parça', value: slice.value || 0 });
    };
    const hideTip = () => setTip(null);

    return (
        <div ref={ref} className="relative bg-white rounded-3xl shadow-lg p-8 flex flex-col items-center justify-center border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Başarı Dağılımı</h3>
            <div className="w-full h-72 flex items-center justify-center">
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    {chartData.map((slice, idx) => {
                        const value = slice.value || 0;
                        const start = angle;
                        const portion = (value / total) * 360;
                        angle += portion;
                        const d = describeArc(cx, cy, outerR, start, start + portion);
                        return (
                            <path
                                key={idx}
                                d={d}
                                fill={slice.color || (['#10B981', '#F59E0B', '#EF4444'][idx % 3])}
                                stroke="#fff"
                                strokeWidth={2}
                                onMouseMove={(ev) => showTip(ev, slice)}
                                onMouseLeave={hideTip}
                            />
                        );
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

            <div className="mt-4 flex gap-3 flex-wrap">
                {chartData.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <span style={{ width: 12, height: 12, background: s.color || (['#10B981', '#F59E0B', '#EF4444'][i % 3]), display: 'inline-block', borderRadius: 3 }} />
                        <span className="font-medium">{s.label || s.name || `#${i+1}`}</span>
                        <span className="text-gray-400">· {s.value}</span>
                    </div>
                ))}
            </div>

            {tip && (
                <div style={{ position: 'absolute', left: tip.x, top: tip.y, pointerEvents: 'none' }}>
                    <div className="bg-black text-white text-xs rounded-md px-2 py-1 shadow-lg">
                        <div className="font-semibold">{tip.label}</div>
                        <div className="text-gray-100">{tip.value}</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentResultDistributionChart;