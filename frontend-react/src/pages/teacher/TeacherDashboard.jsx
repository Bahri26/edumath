import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../../services/teacherService';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/ui/common/PageHeader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSchool, 
  faUserGraduate, 
  faBook,
  faChartLine,
  faPlus,
  faGraduationCap,
  faTasks,
  faClipboardList,
  faTrophy,
  faClock,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import './TeacherDashboard.css';

function TeacherDashboard() {
	const [dashboardData, setDashboardData] = useState({
		questionCount: 0,
		classCount: 0,
		studentCount: 0,
		examCount: 0,
		activeExams: 0,
		completedExams: 0,
		avgScore: 0,
		recentActivity: []
	});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [greeting, setGreeting] = useState('');

	useEffect(() => {
		// Karşılama mesajı
		const hour = new Date().getHours();
		if (hour < 12) setGreeting('🌅 Günaydın');
		else if (hour < 18) setGreeting('☀️ İyi Günler');
		else setGreeting('🌙 İyi Akşamlar');

		const fetchDashboardData = async () => {
			setLoading(true);
			setError(null);

			try {
				// Gerçek backend'den dashboard istatistiklerini çek
				const stats = await getDashboardStats();

				// Icon'ları ekle
				const recentActivityWithIcons = (stats.recentActivity || []).map(activity => {
					let icon = faBook;
					let color = '#667eea';

					if (activity.type === 'exam') {
						icon = faClipboardList;
						color = '#f093fb';
					} else if (activity.type === 'student') {
						icon = faUserGraduate;
						color = '#4facfe';
					}

					return {
						...activity,
						icon,
						color
					};
				});

				setDashboardData({
					questionCount: stats.questionCount || 0,
					classCount: stats.classCount || 0,
					studentCount: stats.studentCount || 0,
					examCount: stats.examCount || 0,
					activeExams: stats.activeExams || 0,
					completedExams: stats.completedExams || 0,
					avgScore: stats.avgScore || 0,
					recentActivity: recentActivityWithIcons,
					upcomingExams: stats.upcomingExams || []
				});
			} catch (err) {
				setError('Dashboard verisi yüklenirken bir hata oluştu.');
				console.error('Dashboard veri hatası:', err);
			} finally {
				setLoading(false);
			}
		};

		fetchDashboardData();
	}, []);

	if (loading) {
		return (
			<div className="container pt-2">
				<PageHeader title="Öğretmen Paneli" />
				<div className="kids-grid-4 mb-2">
					{[1,2,3,4].map(i => (
						<div key={i} className="kids-card">
							<div className="skeleton text mb-1" style={{ width: '40%' }}></div>
							<div className="skeleton text mb-1" style={{ width: '20%' }}></div>
						</div>
					))}
				</div>
				<div className="kids-card">
					<div className="skeleton text mb-1" style={{ width: '30%' }}></div>
					{[1,2].map(i => (<div key={i} className="skeleton text mb-1"></div>))}
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="container pt-2">
				<PageHeader title="Öğretmen Paneli" />
				<div className="kids-error">{error}</div>
			</div>
		);
	}

	return (
		<div className="teacher-dashboard-container">
			<PageHeader title="Öğretmen Paneli">
				<div className="greeting-message">{greeting}</div>
			</PageHeader>

			{/* İstatistik Kartları - Modern Design */}
			<div className="dashboard-stats-grid">
				<div className="stat-card stat-card-purple">
					<div className="stat-icon-wrapper">
						<FontAwesomeIcon icon={faBook} className="stat-icon" />
					</div>
					<div className="stat-content">
						<div className="stat-label">Toplam Soru</div>
						<div className="stat-value">{dashboardData.questionCount}</div>
						<div className="stat-badge">Soru Havuzu</div>
					</div>
					<div className="stat-progress">
						<div className="stat-progress-bar" style={{ width: '75%' }}></div>
					</div>
				</div>

				<div className="stat-card stat-card-blue">
					<div className="stat-icon-wrapper">
						<FontAwesomeIcon icon={faSchool} className="stat-icon" />
					</div>
					<div className="stat-content">
						<div className="stat-label">Aktif Sınıf</div>
						<div className="stat-value">{dashboardData.classCount}</div>
						<div className="stat-badge">Sınıflar</div>
					</div>
					<div className="stat-progress">
						<div className="stat-progress-bar" style={{ width: '60%' }}></div>
					</div>
				</div>

				<div className="stat-card stat-card-pink">
					<div className="stat-icon-wrapper">
						<FontAwesomeIcon icon={faUserGraduate} className="stat-icon" />
					</div>
					<div className="stat-content">
						<div className="stat-label">Toplam Öğrenci</div>
						<div className="stat-value">{dashboardData.studentCount}</div>
						<div className="stat-badge">Öğrenciler</div>
					</div>
					<div className="stat-progress">
						<div className="stat-progress-bar" style={{ width: '85%' }}></div>
					</div>
				</div>

				<div className="stat-card stat-card-orange">
					<div className="stat-icon-wrapper">
						<FontAwesomeIcon icon={faTasks} className="stat-icon" />
					</div>
					<div className="stat-content">
						<div className="stat-label">Toplam Sınav</div>
						<div className="stat-value">{dashboardData.examCount}</div>
						<div className="stat-badge">{dashboardData.activeExams} Aktif</div>
					</div>
					<div className="stat-progress">
						<div className="stat-progress-bar" style={{ width: '90%' }}></div>
					</div>
				</div>
			</div>

			{/* Orta Kısım - İki Kolon */}
			<div className="dashboard-middle-section">

				{/* Sol Kolon - Hızlı İşlemler */}
				<div className="dashboard-left-column">
					<div className="quick-actions-card">
						<h3 className="section-title">
							<FontAwesomeIcon icon={faPlus} />
							Hızlı İşlemler
						</h3>
						<div className="quick-actions-grid">
							<Link to="/teacher/question-pool/add" className="quick-action-item">
								<div className="quick-action-icon purple">
									<FontAwesomeIcon icon={faPlus} />
								</div>
								<div className="quick-action-content">
									<h4>Yeni Soru Ekle</h4>
									<p>Soru havuzuna ekle</p>
								</div>
							</Link>

							<Link to="/teacher/exams/create" className="quick-action-item">
								<div className="quick-action-icon blue">
									<FontAwesomeIcon icon={faClipboardList} />
								</div>
								<div className="quick-action-content">
									<h4>Sınav Oluştur</h4>
									<p>Yeni sınav hazırla</p>
								</div>
							</Link>

							<Link to="/teacher/classes" className="quick-action-item">
								<div className="quick-action-icon green">
									<FontAwesomeIcon icon={faSchool} />
								</div>
								<div className="quick-action-content">
									<h4>Sınıf Yönet</h4>
									<p>Sınıfları düzenle</p>
								</div>
							</Link>

							<Link to="/teacher/students" className="quick-action-item">
								<div className="quick-action-icon pink">
									<FontAwesomeIcon icon={faUserGraduate} />
								</div>
								<div className="quick-action-content">
									<h4>Öğrenciler</h4>
									<p>Öğrenci yönetimi</p>
								</div>
							</Link>
						</div>
					</div>

					{/* Performans Özeti */}
					<div className="performance-card">
						<h3 className="section-title">
							<FontAwesomeIcon icon={faChartLine} />
							Performans Özeti
						</h3>
						<div className="performance-stats">
							<div className="performance-item">
								<div className="performance-label">
									<FontAwesomeIcon icon={faTrophy} />
									<span>Ortalama Başarı</span>
								</div>
								<div className="performance-value">{dashboardData.avgScore}%</div>
								<div className="performance-bar">
									<div className="performance-fill" style={{ width: `${dashboardData.avgScore}%` }}></div>
								</div>
							</div>

							<div className="performance-item">
								<div className="performance-label">
									<FontAwesomeIcon icon={faCheckCircle} />
									<span>Tamamlanan</span>
								</div>
								<div className="performance-value">{dashboardData.completedExams}</div>
								<div className="performance-bar">
									<div className="performance-fill success" style={{ width: '65%' }}></div>
								</div>
							</div>

							<div className="performance-item">
								<div className="performance-label">
									<FontAwesomeIcon icon={faClock} />
									<span>Aktif Sınavlar</span>
								</div>
								<div className="performance-value">{dashboardData.activeExams}</div>
								<div className="performance-bar">
									<div className="performance-fill warning" style={{ width: '45%' }}></div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Sağ Kolon - Son Aktiviteler */}
				<div className="dashboard-right-column">
					<div className="recent-activity-card">
						<h3 className="section-title">
							<FontAwesomeIcon icon={faClock} />
							Son Aktiviteler
						</h3>
						<div className="activity-list">
							{dashboardData.recentActivity.map(activity => (
								<div key={activity.id} className="activity-item">
									<div className="activity-icon" style={{ background: activity.color }}>
										<FontAwesomeIcon icon={activity.icon} />
									</div>
									<div className="activity-content">
										<div className="activity-text">{activity.text}</div>
										<div className="activity-time">{activity.time}</div>
									</div>
								</div>
							))}
						</div>
						<Link to="/teacher/activity" className="view-all-link">
							Tüm Aktiviteleri Gör →
						</Link>
					</div>

					{/* Yaklaşan Sınavlar */}
					<div className="upcoming-exams-card">
						<h3 className="section-title">
							<FontAwesomeIcon icon={faGraduationCap} />
							Yaklaşan Sınavlar
						</h3>
						<div className="upcoming-exams-list">
							<div className="upcoming-exam-item">
								<div className="exam-date">
									<span className="exam-day">15</span>
									<span className="exam-month">Kas</span>
								</div>
								<div className="exam-details">
									<h4>Matematik Sınavı</h4>
									<p>9-A Sınıfı • 40 dk</p>
								</div>
							</div>
							<div className="upcoming-exam-item">
								<div className="exam-date">
									<span className="exam-day">18</span>
									<span className="exam-month">Kas</span>
								</div>
								<div className="exam-details">
									<h4>Geometri Testi</h4>
									<p>10-B Sınıfı • 30 dk</p>
								</div>
							</div>
						</div>
						<Link to="/teacher/exams" className="view-all-link">
							Tüm Sınavları Gör →
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}

export default TeacherDashboard;
