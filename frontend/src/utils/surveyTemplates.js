// Survey template utilities for frontend only (localStorage based)
// Template: { title, description, questions: [{ questionText, type, options }] }

const TEMPLATES_KEY = 'surveyTemplates';

export function saveSurveyTemplate(template) {
  const templates = getSurveyTemplates();
  templates.push({ ...template, id: Date.now() });
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

export function getSurveyTemplates() {
  try {
    return JSON.parse(localStorage.getItem(TEMPLATES_KEY)) || [];
  } catch {
    return [];
  }
}

export function deleteSurveyTemplate(id) {
  const templates = getSurveyTemplates().filter(t => t.id !== id);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}
