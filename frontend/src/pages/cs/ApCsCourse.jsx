import React from 'react';
import { useNavigate } from 'react-router-dom';

const units = [
    { id: 1, title: "Primitive Types", desc: "int, double, boolean değişkenler ve casting.", progress: 100 },
    { id: 2, title: "Using Objects", desc: "String metodları, Math sınıfı ve nesneler.", progress: 40 },
    { id: 3, title: "Boolean & If", desc: "Mantıksal operatörler ve karar yapıları.", progress: 0 },
    { id: 4, title: "Iteration", desc: "For ve While döngüleri.", progress: 0 },
    { id: 5, title: "Writing Classes", desc: "Constructor, Accessor ve Mutator metodlar.", progress: 0 },
    { id: 6, title: "Array", desc: "Diziler, dizi işlemleri ve traversal.", progress: 0 },
    { id: 7, title: "ArrayList", desc: "Dinamik diziler ve koleksiyon metodları.", progress: 0 },
    { id: 8, title: "2D Array", desc: "İki boyutlu diziler ve matris işlemleri.", progress: 0 },
    { id: 9, title: "Inheritance", desc: "Kalıtım, super, override kavramları.", progress: 0 },
    { id: 10, title: "Recursion", desc: "Özyineli metodlar ve problem çözme.", progress: 0 }
];

const ApCsCourse = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8">
            <div className="max-w-5xl mx-auto">
                <header className="mb-12 text-center">
                    <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                        AP Computer Science A
                    </h1>
                    <p className="text-slate-400">Java programlamayı sıfırdan zirveye, sınav odaklı öğren.</p>
                </header>

                <div className="grid md:grid-cols-2 gap-6">
                    {units.map((unit) => (
                        <div 
                            key={unit.id}
                            onClick={() => navigate(`/cs/unit/${unit.id}`)}
                            className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-cyan-500 cursor-pointer transition-all group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 bg-cyan-900/50 text-cyan-400 rounded-lg flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
                                    {unit.id}
                                </div>
                                <span className="text-xs font-mono text-slate-500">UNIT {unit.id}</span>
                            </div>
                            <h3 className="text-xl font-bold mb-2 group-hover:text-cyan-400 transition-colors">{unit.title}</h3>
                            <p className="text-slate-400 text-sm mb-6">{unit.desc}</p>
                            
                            {/* Progress Bar */}
                            <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                                <div 
                                    className="bg-cyan-500 h-full transition-all duration-1000" 
                                    style={{ width: `${unit.progress}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ApCsCourse;
