import React from "react";
import { BookOpen, Zap, Puzzle, Layers, Play, Brain } from "lucide-react";

const studyTypes = [
  {
    icon: <BookOpen size={32} className="text-indigo-600" />, // Quiz
    title: "Quiz Çöz",
    desc: "Sınıf seviyene uygun, otomatik veya öğretmenin hazırladığı testleri çöz.",
    action: { label: "Quizlere Git", to: "/student/quizzes" },
  },
  {
    icon: <Layers size={32} className="text-emerald-600" />, // Flashcard
    title: "Flashcard Çalış",
    desc: "Kavramları ve formülleri hızlıca tekrar etmek için kartlarla çalış.",
    action: { label: "Flashcard Modülü (Yakında)", to: "#" },
  },
  {
    icon: <Puzzle size={32} className="text-amber-500" />, // Oyun
    title: "Eğitsel Oyunlar",
    desc: "Sınıfına uygun eğlenceli oyunlarla bilgini pekiştir.",
    action: { label: "Oyunlar (Yakında)", to: "#" },
  },
  {
    icon: <Brain size={32} className="text-purple-600" />, // AI
    title: "AI ile Kişisel Çalışma",
    desc: "Eksik konularına göre AI destekli kişisel çalışma önerileri al.",
    action: { label: "AI Çalışma (Yakında)", to: "#" },
  },
];

export default function StudentStudyHub() {
  return (
    <div className="max-w-3xl mx-auto p-8 space-y-8 animate-fade-in">
      <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-4">Çalışma Merkezi</h1>
      <p className="text-slate-500 mb-8">Sınıf seviyene uygun farklı çalışma türleriyle kendini geliştir!</p>
      <div className="grid md:grid-cols-2 gap-8">
        {studyTypes.map((type, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-start gap-4">
            {type.icon}
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{type.title}</h2>
            <p className="text-slate-500 dark:text-slate-300 flex-1">{type.desc}</p>
            <a href={type.action.to} className={`mt-2 px-5 py-2 rounded-lg font-bold ${type.action.to === "#" ? "bg-slate-200 text-slate-500 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}>{type.action.label}</a>
          </div>
        ))}
      </div>
    </div>
  );
}
