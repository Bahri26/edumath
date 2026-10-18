// Read-only audit. Never logs connection credentials, users, or student answers.
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), quiet: true });
const mongoose = require('mongoose');
const Question = require('../../models/Question');
const Exam = require('../../models/Exam');
const { mcAnswersMatch } = require('../../utils/questionGrading');

const normalize = value => String(value || '').normalize('NFKC').toLocaleLowerCase('tr')
  .replace(/^\s*\d+[.)]\s*/, '').replace(/\s+/g, ' ').trim();
const textOf = o => typeof o === 'string' ? o : o?.text || '';
async function main() {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI,
    { dbName: process.env.MONGODB_DB || process.env.MONGO_DB || 'Edumath', serverSelectionTimeoutMS:10000 });
  const [questions, exams] = await Promise.all([
    Question.find({}).select('text options correctAnswer image classLevel subject topic difficulty type assessmentMeta').lean(),
    Exam.find({}).select('questions classLevel subject duration examType status startAt endAt').lean(),
  ]);
  const exact = new Map();
  const source = new Map();
  const questionIssues = [];
  const byId = new Map(questions.map(q => [String(q._id), q]));
  for (const q of questions) {
    const id = String(q._id), issues = [];
    const options = q.options || [];
    if (!q.text?.trim()) issues.push('empty-text');
    if (!q.correctAnswer?.trim()) issues.push('missing-answer');
    if (q.type === 'multiple-choice' && (options.length < 2 || !options.some((o,i) => mcAnswersMatch(q,String.fromCharCode(65+i),q.correctAnswer)))) issues.push('invalid-multiple-choice-answer');
    if (q.assessmentMeta?.needsReview) issues.push('needs-review');
    if (q.assessmentMeta?.hasVisualPending) issues.push('missing-visual');
    const key = JSON.stringify([q.classLevel,q.type,normalize(q.text),options.map(o => [normalize(textOf(o)),o.image||'']),q.image||'']);
    if (!exact.has(key)) exact.set(key,[]);
    exact.get(key).push(id);
    if (q.assessmentMeta?.importSource) {
      const meta=q.assessmentMeta;
      const key=JSON.stringify([q.classLevel,meta.importSource,meta.pageNumber,meta.questionNumber]);
      if (!source.has(key)) source.set(key,[]);
      source.get(key).push(id);
    }
    if (issues.length) questionIssues.push({ id, classLevel:q.classLevel, issues });
  }
  const examIssues = [];
  for (const exam of exams) {
    const ids=exam.questions.map(String), issues=[];
    const qs=ids.map(id=>byId.get(id)).filter(Boolean);
    if (new Set(ids).size !== ids.length) issues.push('duplicate-question-id');
    if (qs.length !== ids.length) issues.push('deleted-question-reference');
    if (qs.some(q=>q.classLevel!==exam.classLevel)) issues.push('class-mismatch');
    if (qs.some(q=>q.subject!==exam.subject)) issues.push('subject-mismatch');
    if (!(exam.duration>0)) issues.push('invalid-duration');
    if (exam.startAt&&exam.endAt&&new Date(exam.endAt)<=new Date(exam.startAt)) issues.push('invalid-schedule');
    if (qs.some(q=>q.assessmentMeta?.needsReview||q.assessmentMeta?.hasVisualPending)) issues.push('unreviewed-question');
    if (issues.length) examIssues.push({id:String(exam._id),classLevel:exam.classLevel,count:ids.length,issues});
  }
  const pdfDifferences=[];
  for (const grade of [5,6,7,9]) {
    const data=JSON.parse(fs.readFileSync(path.resolve(__dirname,`../../data/pattern-pdf-import/${grade}-sinif-extracted.json`),'utf8'));
    for (const q of data.questions) {
      const live=questions.filter(d=>d.classLevel===data.source.classLevel && d.assessmentMeta?.importSource==='pattern-pdf-extracted-2026-08' && d.assessmentMeta?.questionNumber===q.questionNumber && (grade===9||d.assessmentMeta?.pageNumber===q.page));
      if (live.length!==1) pdfDifferences.push({grade,page:q.page,question:q.questionNumber,issue:'missing-or-duplicate-source',matches:live.length});
      else {
        const d=live[0],issues=[];
        const liveIndex=(d.options||[]).findIndex((o,i)=>mcAnswersMatch(d,String.fromCharCode(65+i),d.correctAnswer));
        if (liveIndex!==q.options.indexOf(q.correctAnswer)) issues.push('answer-differs-from-corrected-pack');
        if (JSON.stringify((d.options||[]).map(textOf))!==JSON.stringify(q.options)) issues.push('option-text-differs');
        if (d.assessmentMeta.pageNumber!==q.page) issues.push('wrong-source-page');
        if (d.assessmentMeta.needsReview) issues.push('needs-review');
        if (!d.image||d.assessmentMeta.hasVisualPending) issues.push('source-image-not-yet-imported');
        if (issues.length) pdfDifferences.push({grade,page:q.page,question:q.questionNumber,id:String(d._id),issues});
      }
    }
  }
  const duplicates=[...exact.values()].filter(ids=>ids.length>1);
  const duplicateSources=[...source.values()].filter(ids=>ids.length>1);
  const byGrade={};
  for (const q of questions) {
    const row=byGrade[q.classLevel] ||= {total:0,Kolay:0,Orta:0,Zor:0};
    row.total++; if(q.difficulty in row) row[q.difficulty]++;
  }
  const report={auditedAt:new Date().toISOString(),questionCount:questions.length,examCount:exams.length,
    byGrade,duplicates,duplicateSources,questionIssues,examIssues,pdfDifferences};
  const target=path.resolve(__dirname,'../../../docs/question-exam-audit.json');
  fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({questionCount:questions.length,examCount:exams.length,duplicates:duplicates.length,duplicateSources:duplicateSources.length,questionIssues:questionIssues.length,examIssues:examIssues.length,pdfDifferences:pdfDifferences.length,byGrade,report:target},null,2));
}
main().catch(err=>{console.error(err.message);process.exitCode=1;}).finally(()=>mongoose.disconnect());
