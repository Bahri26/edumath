// backend-express/routes/surveyRoutes.js
const express = require('express');
const router = express.Router();
const { protect, teacherCheck, studentCheck } = require('../middleware/authMiddleware');
const {
  listSurveys,
  createSurvey,
  getSurvey,
  updateSurvey,
  deleteSurvey,
  getSurveyResults,
  listAvailableSurveys,
  getSurveyPublic,
  submitSurveyAnswer
} = require('../controllers/surveyController');

// ÖNEMLI: Spesifik route'lar parametreli route'lardan ÖNCE gelmeli
// Student accessible endpoints - önce bunlar
router.get('/available', protect, studentCheck, listAvailableSurveys);

// Teacher endpoints
router.route('/')
  .get(protect, teacherCheck, listSurveys)
  .post(protect, teacherCheck, createSurvey);

// Parametreli route'lar en sona
router.get('/:id/public', protect, studentCheck, getSurveyPublic);
router.post('/:id/answer', protect, studentCheck, submitSurveyAnswer);

router.route('/:id/results')
  .get(protect, teacherCheck, getSurveyResults);

router.route('/:id')
  .get(protect, teacherCheck, getSurvey)
  .put(protect, teacherCheck, updateSurvey)
  .delete(protect, teacherCheck, deleteSurvey);

module.exports = router;
