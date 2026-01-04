export const studentProfile = {
  name: "Zeynep Yılmaz",
  level: 5,
  xp: 1250,
  nextLevelXp: 2000,
  streak: 12
};

export const continueLearning = {
  course: "Matematik 101",
  topic: "İkinci Dereceden Denklemler",
  progress: 65,
  timeLeft: "15 dk"
};

export const myCourses = [
  { id: 1, title: "TYT Matematik", progress: 75, totalModules: 20, completedModules: 15, color: "indigo" },
  { id: 2, title: "AYT Geometri", progress: 40, totalModules: 15, completedModules: 6, color: "emerald" },
  { id: 3, title: "Problemler Kampı", progress: 10, totalModules: 10, completedModules: 1, color: "orange" },
  { id: 4, title: "Analitik Geometri", progress: 90, totalModules: 8, completedModules: 7, color: "blue" },
];

export const upcomingAssignments = [
  { id: 1, title: "Türev Çalışma Soruları", type: "Ödev", due: "Yarın", urgent: true },
  { id: 2, title: "İntegral Quiz", type: "Sınav", due: "3 Gün Sonra", urgent: false },
  { id: 3, title: "Olasılık Projesi", type: "Proje", due: "1 Hafta Sonra", urgent: false },
];

export const leaderboard = [
  { rank: 1, name: "Ali V.", xp: 2400, active: false },
  { rank: 2, name: "Ayşe K.", xp: 2150, active: false },
  { rank: 3, name: "Mehmet T.", xp: 1980, active: false },
  { rank: 4, name: "Sen", xp: 1250, active: true }, // Kullanıcı
  { rank: 5, name: "Can B.", xp: 1100, active: false },
];