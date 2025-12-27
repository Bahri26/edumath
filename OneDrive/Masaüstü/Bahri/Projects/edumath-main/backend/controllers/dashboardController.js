const User = require('../models/User');
const UserProgress = require('../models/UserProgress');
const { Course, Unit, Lesson } = require('../models/Course');

// Haftalık aktivite mocku
const getWeeklyActivityMock = () => [
  { day: 'Pzt', minutes: 30 },
  { day: 'Sal', minutes: 45 },
  { day: 'Çar', minutes: 20 },
  { day: 'Per', minutes: 60 },
  { day: 'Cum', minutes: 35 },
  { day: 'Cmt', minutes: 50 },
  { day: 'Paz', minutes: 40 },
];

exports.getStudentDashboardData = async (req, res) => {
  try {
    const userId = req.user._id; // Auth middleware ile gelmeli
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // userStats
    const userStats = {
      xp: user.xp,
      streak: user.streak,
      level: user.level,
      diamonds: user.diamonds
    };

    // En son aktif course/lesson
    const lastProgress = await UserProgress.find({ user: userId, status: { $ne: 'locked' } })
      .sort({ updatedAt: -1 })
      .limit(1)
      .populate({
        path: 'course',
        select: 'title',
      })
      .populate({
        path: 'unit',
        select: 'title',
      })
      .populate({
        path: 'lesson',
        select: 'title type',
      });

    let activeCourse = null;
    if (lastProgress.length > 0) {
      const p = lastProgress[0];
      activeCourse = {
        course: { id: p.course._id, title: p.course.title },
        unit: p.unit ? { id: p.unit._id, title: p.unit.title } : null,
        lesson: p.lesson ? { id: p.lesson._id, title: p.lesson.title, type: p.lesson.type } : null,
        completionPercentage: p.completionPercentage,
        lastPosition: p.lastPosition,
        status: p.status
      };
    }

    // Progress summary (haftalık aktivite)
    const progressSummary = getWeeklyActivityMock();

    res.json({ userStats, activeCourse, progressSummary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
