import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faLayerGroup, 
  faSchool, 
  faUserGraduate, 
  faBook,
  faChalkboardTeacher,
  faChartLine,
  faPlus,
  faArrowRight,
  faGraduationCap,
  faTasks
} from '@fortawesome/free-solid-svg-icons';
import '../../assets/styles/TeacherPages.css';
import '../../assets/styles/Dashboard.css';

function TeacherDashboard() {
	const [dashboardData, setDashboardData] = useState({
		questionCount: 0,
		classCount: 0,
		studentCount: 0,
	});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchDashboardData = async () => {
			setLoading(true);
			setError(null);

			const token = localStorage.getItem('token');
			const config = { headers: { Authorization: `Bearer ${token}` } };

			try {
				// Use safer calls and tolerate partial failures. The backend currently does not expose
				// /count endpoints for classes/students, so request the endpoints that exist and
				// derive counts where possible.
				const [questionsRes, examsRes] = await Promise.allSettled([
					axios.get('http://localhost:8000/api/questions', config),
					axios.get('http://localhost:8000/api/exams', config),
				]);

				const questionCount = questionsRes.status === 'fulfilled' && Array.isArray(questionsRes.value.data)
					? questionsRes.value.data.length
					: 0;

				const examCount = examsRes.status === 'fulfilled' && Array.isArray(examsRes.value.data)
					? examsRes.value.data.length
					: 0;

				// classes and students endpoints for simple counts are not implemented in the backend yet.
				// We'll leave them as 0 until backend provides reliable count endpoints.
				setDashboardData({
					questionCount,
					classCount: 0,
					studentCount: 0,
					examCount,
				});
			} catch (err) {
				// This block is a last-resort; most per-request failures are handled above.
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
			<div className="teacher-page-container">
				<PageHeader title="Öğretmen Paneli" />
				<div className="loading-spinner">Yükleniyor...</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="teacher-page-container">
				<PageHeader title="Öğretmen Paneli" />
				<div className="alert alert-danger">{error}</div>
			</div>
		);
	}

	const dashboardCards = [
		{
			icon: 'layer-group',
			title: 'Soru Havuzu',
			count: dashboardData.questionCount,
			countLabel: 'Soru',
			buttonText: 'Soru Ekle',
			buttonIcon: 'plus',
			linkTo: '/teacher/question-pool',
			variant: 'primary'
		},
		{
			icon: 'school',
			title: 'Sınıflar',
			count: dashboardData.classCount,
			countLabel: 'Sınıf',
			buttonText: 'Sınıfları Yönet',
			buttonIcon: 'edit',
			linkTo: '/teacher/classes',
			variant: 'success'
		},
		{
			icon: 'user-graduate',
			title: 'Öğrenciler',
			count: dashboardData.studentCount,
			countLabel: 'Öğrenci',
			buttonText: 'Öğrencilerim',
			buttonIcon: 'users',
			linkTo: '/teacher/students',
			variant: 'info'
		}
	];

	return (
		<div className="dashboard-container">
			<PageHeader title="Öğretmen Paneli" />
			
			<div className="dashboard-stats">
				<div className="stat-card">
					<div className="stat-info">
						<h3>Toplam Soru</h3>
						<p className="count">{dashboardData.questionCount}</p>
					</div>
					<div className="stat-icon primary">
						<FontAwesomeIcon icon={faBook} />
					</div>
				</div>
				
				<div className="stat-card">
					<div className="stat-info">
						<h3>Aktif Sınıf</h3>
						<p className="count">{dashboardData.classCount}</p>
					</div>
					<div className="stat-icon success">
						<FontAwesomeIcon icon={faSchool} />
					</div>
				</div>
				
				<div className="stat-card">
					<div className="stat-info">
						<h3>Toplam Öğrenci</h3>
						<p className="count">{dashboardData.studentCount}</p>
					</div>
					<div className="stat-icon info">
						<FontAwesomeIcon icon={faUserGraduate} />
					</div>
				</div>
				
				<div className="stat-card">
					<div className="stat-info">
						<h3>Aktif Sınav</h3>
						<p className="count">{dashboardData.examCount || 0}</p>
					</div>
					<div className="stat-icon warning">
						<FontAwesomeIcon icon={faTasks} />
					</div>
				</div>
			</div>
			
			<div className="dashboard-sections">
				<div className="section-card">
					<div className="section-header">
						<h2>Hızlı İşlemler</h2>
					</div>
					<div className="quick-actions">
						<Link to="/teacher/question-pool/add" className="action-button">
							<div className="icon">
								<FontAwesomeIcon icon={faPlus} />
							</div>
							<div className="text">
								<h4>Yeni Soru Ekle</h4>
								<p>Soru havuzuna yeni soru ekleyin</p>
							</div>
							<FontAwesomeIcon icon={faArrowRight} className="arrow" />
						</Link>
						
						<Link to="/teacher/classes" className="action-button">
							<div className="icon">
								<FontAwesomeIcon icon={faSchool} />
							</div>
							<div className="text">
								<h4>Sınıfları Yönet</h4>
								<p>Sınıflarınızı görüntüleyin ve yönetin</p>
							</div>
							<FontAwesomeIcon icon={faArrowRight} className="arrow" />
						</Link>
						
						<Link to="/teacher/students" className="action-button">
							<div className="icon">
								<FontAwesomeIcon icon={faUserGraduate} />
							</div>
							<div className="text">
								<h4>Öğrencilerim</h4>
								<p>Öğrenci listesi ve yönetimi</p>
							</div>
							<FontAwesomeIcon icon={faArrowRight} className="arrow" />
						</Link>
						
						<Link to="/teacher/exams" className="action-button">
							<div className="icon">
								<FontAwesomeIcon icon={faGraduationCap} />
							</div>
							<div className="text">
								<h4>Sınavlar</h4>
								<p>Sınav oluşturun ve yönetin</p>
							</div>
							<FontAwesomeIcon icon={faArrowRight} className="arrow" />
						</Link>
					</div>
				</div>
				
				<div className="section-card">
					<div className="section-header">
						<h2>Genel İstatistikler</h2>
					</div>
					<div className="stats-preview">
						{/* Buraya grafik bileşenleri eklenecek */}
						<p className="text-center text-muted">
							<FontAwesomeIcon icon={faChartLine} className="me-2" />
							Detaylı istatistikler yakında eklenecek
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

export default TeacherDashboard;