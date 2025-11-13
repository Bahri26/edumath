// backend-express/controllers/gamificationController.js (clean)
const { AchievementDefinition, UserAchievement } = require('../models/Achievement');
const Progress = require('../models/gamification/Progress');
const User = require('../models/User');

function calcLevel(xp) { return Math.floor(xp / 100) + 1; }

// Hearts
exports.useHeart = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    if (user.gamification.hearts.unlimited) return res.json({ message: 'Unlimited hearts aktif', hearts: user.gamification.hearts });
    if (user.gamification.hearts.current <= 0) return res.status(400).json({ message: 'Kalbiniz kalmadı', hearts: user.gamification.hearts });
    user.gamification.hearts.current -= 1; await user.save();
    await Progress.create({ userId: user._id, activity: 'heart_lost', xpEarned: 0, details: { heartsRemaining: user.gamification.hearts.current } });
    res.json({ message: 'Kalp kullanıldı', hearts: user.gamification.hearts });
  } catch (e) { res.status(500).json({ message: 'Sunucu hatası', error: e.message }); }
};

exports.refillHearts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id); if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    if (user.gamification.hearts.unlimited) return res.json({ message: 'Unlimited hearts aktif', hearts: user.gamification.hearts });
    const now = new Date(); const last = user.gamification.hearts.lastRefillTime || now; const minutes = (now - last) / 60000; const add = Math.floor(minutes / 5);
    if (add <= 0) return res.json({ message: 'Henüz kalp doldurma zamanı gelmedi', hearts: user.gamification.hearts, nextRefillIn: Math.ceil(5 - (minutes % 5)) });
    user.gamification.hearts.current = Math.min(5, user.gamification.hearts.current + add); user.gamification.hearts.lastRefillTime = now; await user.save();
    await Progress.create({ userId: user._id, activity: 'heart_refilled', xpEarned: 0, details: { heartsAdded: add } });
    res.json({ message: `${add} kalp eklendi`, hearts: user.gamification.hearts });
  } catch (e) { res.status(500).json({ message: 'Sunucu hatası', error: e.message }); }
};

exports.buyHearts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id); if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    const cost = 10; if (user.gamification.gems < cost) return res.status(400).json({ message: 'Yeterli gem yok', required: cost, current: user.gamification.gems });
    user.gamification.gems -= cost; user.gamification.hearts.current = 5; user.gamification.hearts.lastRefillTime = new Date(); await user.save();
    res.json({ message: 'Kalpler dolduruldu!', hearts: user.gamification.hearts, gems: user.gamification.gems });
  } catch (e) { res.status(500).json({ message: 'Sunucu hatası', error: e.message }); }
};

// Streak
exports.updateStreak = async (req, res) => {
  try {
    const user = await User.findById(req.user._id); if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    const today = new Date(); today.setHours(0,0,0,0); const last = user.gamification.streak.lastActivity ? new Date(user.gamification.streak.lastActivity) : null; if (last) last.setHours(0,0,0,0);
    if (last) { const diff = Math.floor((today - last)/86400000); if (diff===0) return res.json({ message:'Streak zaten güncel', streak:user.gamification.streak });
      if (diff===1) { user.gamification.streak.current +=1; if (user.gamification.streak.current > user.gamification.streak.longest) user.gamification.streak.longest = user.gamification.streak.current; }
      else if (diff>1) { if (user.gamification.streak.freezes>0 && diff<=2) user.gamification.streak.freezes -=1; else user.gamification.streak.current = 1; }
    } else { user.gamification.streak.current = 1; }
    user.gamification.streak.lastActivity = new Date(); user.gamification.xp += 5; await user.save();
    await Progress.create({ userId: user._id, activity:'streak_maintained', xpEarned:5, details:{ streakDays: user.gamification.streak.current } });
    res.json({ message:'Streak güncellendi!', streak:user.gamification.streak, bonus:5 });
  } catch (e) { res.status(500).json({ message:'Sunucu hatası', error:e.message }); }
};

// XP & Level
exports.addXP = async (req, res) => {
  try { const { userId, amount=0 } = req.body; const user = await User.findById(userId); if(!user) return res.status(404).json({ message:'Kullanıcı bulunamadı' });
    const prevLevel = user.gamification.level; user.gamification.xp += amount; const newLevel = calcLevel(user.gamification.xp); let leveledUp=false;
    if (newLevel>prevLevel) { leveledUp=true; user.gamification.level=newLevel; user.gamification.gems +=10; await Progress.create({ userId, activity:'level_up', xpEarned:0, gemsEarned:10, details:{ oldLevel:prevLevel, newLevel } }); }
    await user.save(); res.json({ message: leveledUp?`Level ${newLevel}!`:'XP eklendi', xpAdded:amount, totalXP:user.gamification.xp, level:user.gamification.level, leveledUp, xpForNextLevel:(newLevel*100)-user.gamification.xp });
  } catch(e){ res.status(500).json({ message:'Sunucu hatası', error:e.message }); }
};

// Daily Goal
exports.getDailyGoal = async (req, res) => {
  try { const user = await User.findById(req.user._id); if(!user) return res.status(404).json({ message:'Kullanıcı bulunamadı' }); const now=new Date(); const last=user.gamification.dailyGoal.lastReset?new Date(user.gamification.dailyGoal.lastReset):now;
    if (now.toDateString()!==last.toDateString()) { if (user.gamification.dailyGoal.progress >= user.gamification.dailyGoal.target) user.gamification.dailyGoal.completedDays +=1; user.gamification.dailyGoal.progress=0; user.gamification.dailyGoal.lastReset=now; await user.save(); }
    const dg=user.gamification.dailyGoal; const percentage=Math.min(Math.round((dg.progress/dg.target)*100),100); res.json({ target:dg.target, progress:dg.progress, percentage, completed:dg.progress>=dg.target, completedDays:dg.completedDays });
  } catch(e){ res.status(500).json({ message:'Sunucu hatası', error:e.message }); }
};

// Achievements
exports.getAchievements = async (req,res)=>{ try { const list=await UserAchievement.find({ userId:req.user._id }).populate('achievementId').sort({ unlockedAt:-1 }); res.json(list); } catch(e){ res.status(500).json({ message:'Sunucu hatası', error:e.message }); } };
exports.getNewAchievements = async (req,res)=>{ try { const list=await UserAchievement.find({ userId:req.user._id, isNew:true, isUnlocked:true }).populate('achievementId'); res.json(list); } catch(e){ res.status(500).json({ message:'Sunucu hatası', error:e.message }); } };
exports.claimAchievementRewards = async (req,res)=>{ try { const ua=await UserAchievement.findOne({ _id:req.params.achievementId, userId:req.user._id }); if(!ua) return res.status(404).json({ message:'Başarım bulunamadı' }); const ok=await ua.claimRewards(); if(!ok) return res.status(400).json({ message:'Ödüller alınamadı' }); const user=await User.findById(req.user._id).select('gamification'); res.json({ message:'Ödüller alındı!', rewards:ua.rewards, gamification:user.gamification }); } catch(e){ res.status(500).json({ message:'Sunucu hatası', error:e.message }); } };

// Progress & Stats
exports.getRecentActivity = async (req,res)=>{ try { const days=parseInt(req.query.days||'7',10); const acts=await Progress.getRecentActivity(req.user._id, days); res.json(acts); } catch(e){ res.status(500).json({ message:'Sunucu hatası', error:e.message }); } };
exports.getDailySummary = async (req,res)=>{ try { const date=req.query.date?new Date(req.query.date):new Date(); const summary=await Progress.getDailySummary(req.user._id, date); res.json(summary); } catch(e){ res.status(500).json({ message:'Sunucu hatası', error:e.message }); } };
exports.getWeeklyXP = async (req,res)=>{ try { const data=await Progress.getWeeklyXPChart(req.user._id); res.json(data); } catch(e){ res.status(500).json({ message:'Sunucu hatası', error:e.message }); } };
exports.getDashboard = async (req,res)=>{ try { const user=await User.findById(req.user._id).select('gamification'); if(!user) return res.status(404).json({ message:'Kullanıcı bulunamadı' }); const dailySummary=await Progress.getDailySummary(req.user._id); const weeklyXP=await Progress.getWeeklyXPChart(req.user._id); const dg=user.gamification.dailyGoal; const pct=Math.min(Math.round((dg.progress/dg.target)*100),100); const newAchievements=await UserAchievement.countDocuments({ userId:req.user._id, isNew:true, isUnlocked:true }); res.json({ gamification:user.gamification, dailySummary, weeklyXP, dailyGoal:{ target:dg.target, progress:dg.progress, percentage:pct }, newAchievements }); } catch(e){ res.status(500).json({ message:'Sunucu hatası', error:e.message }); } };
