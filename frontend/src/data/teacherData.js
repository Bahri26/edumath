import { Users, BookOpen, Clock, Trophy } from 'lucide-react';

export const statsData = [
  { title: "Toplam Öğrenci", value: "124", change: "+12%", trend: "up", icon: Users, color: "indigo" },
  { title: "Aktif Sınavlar", value: "3", change: null, trend: "neutral", icon: BookOpen, color: "blue" },
  { title: "Bekleyen Ödevler", value: "18", change: "-5%", trend: "down", icon: Clock, color: "orange" },
  { title: "Sınıf Ortalaması", value: "78.4", change: "+2.1", trend: "up", icon: Trophy, color: "green" },
];

export const performanceData = [
  { day: "Pzt", score: 65 },
  { day: "Sal", score: 75 },
  { day: "Çar", score: 85 },
  { day: "Per", score: 60 },
  { day: "Cum", score: 90 },
  { day: "Cmt", score: 70 },
  { day: "Paz", score: 80 },
];

export const recentActivities = [
  { id: 1, student: "Ahmet Yılmaz", action: "Matrisler sınavını tamamladı", score: 85, time: "2s önce" },
  { id: 2, student: "Ayşe Demir", action: "Trigonometri quizini bitirdi", score: 92, time: "5s önce" },
  { id: 3, student: "Mehmet Kaya", action: "Fonksiyonlar ödevini gönderdi", score: 78, time: "15d önce" },
  { id: 4, student: "Zeynep Çelik", action: "Limit testini tamamladı", score: 45, time: "1s önce" },
];