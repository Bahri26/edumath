// Kids Temalı HomePage - Rol tabanlı, modüler

import React from 'react';
import { useAuth } from '../hooks/useAuth';
import HeroPublic from '../components/home/HeroPublic';
import StatsStrip from '../components/home/StatsStrip';
import FeatureGrid from '../components/home/FeatureGrid';
import WelcomeTeacher from '../components/home/WelcomeTeacher';
import WelcomeStudent from '../components/home/WelcomeStudent';
import QuickActionsTeacher from '../components/home/QuickActionsTeacher';
import UpcomingExams from '../components/home/UpcomingExams';
import SurveysPreview from '../components/home/SurveysPreview';
import DailyChallengePreview from '../components/home/DailyChallengePreview';
import LeaderboardMini from '../components/home/LeaderboardMini';
import TeacherAnalyticsMini from '../components/home/TeacherAnalyticsMini';

const HomePage = () => {
  const { user } = useAuth();
  // Backend'den roles nested objesi geliyor: user.roles.isTeacher
  const isTeacher = user?.roles?.isTeacher || user?.isTeacher || user?.role === 'teacher';
  const isStudent = user?.roles?.isStudent || user?.isStudent || user?.role === 'student';

  return (
    <div className="teacher-page-container">
      {!user && (
        <>
          <HeroPublic />
          <StatsStrip />
          <FeatureGrid />
          <div className="kids-card text-center">
            <h2 style={{ fontWeight:800 }}>🚀 Maceraya Hazır mısın?</h2>
            <p className="muted">Hemen katıl, öğrenmeye başla!</p>
          </div>
        </>
      )}

      {isTeacher && (
        <>
          <WelcomeTeacher user={user} />
          <TeacherAnalyticsMini />
          <QuickActionsTeacher />
          <UpcomingExams mode="teacher" />
          <SurveysPreview mode="teacher" />
          <LeaderboardMini />
        </>
      )}

      {isStudent && (
        <>
          <WelcomeStudent user={user} />
          <DailyChallengePreview />
          <UpcomingExams mode="student" />
          <SurveysPreview mode="student" />
          <LeaderboardMini />
        </>
      )}

      {/* Fallback: Kullanıcı var ama rol belirsizse */}
      {user && !isTeacher && !isStudent && (
        <div className="kids-card text-center">
          <h2>👋 Hoşgeldiniz!</h2>
          <p className="muted">Hesabınız için rol ataması yapılmamış. Lütfen yönetici ile iletişime geçin.</p>
        </div>
      )}
    </div>
  );
};

export default HomePage;
