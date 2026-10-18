const { getSchedulePhase } = require('./examSchedule');

function buildOverview(students, exams, { classLevel = '', days = 0, now = new Date() } = {}) {
  const classes = [...new Set([...students.map(s=>s.grade), ...exams.map(e=>e.classLevel)].filter(Boolean))];
  const roster = students.filter(s=>!classLevel || s.grade === classLevel);
  const scopedExams = exams.filter(e=>!classLevel || e.classLevel === classLevel);
  const cutoff = days ? now.getTime() - days * 86400000 : null;
  const scores = new Map();
  for (const exam of scopedExams) for (const r of exam.results || []) {
    if (cutoff && (!r.submittedAt || new Date(r.submittedAt).getTime() < cutoff)) continue;
    if (r.score == null || !Number.isFinite(Number(r.score))) continue;
    const uid = String(r.studentId);
    const bucket = scores.get(uid) || [];
    bucket.push(Number(r.score)); scores.set(uid, bucket);
  }
  const rows = roster.map(s=> {
    const user = s.userId || {};
    const values = scores.get(String(user._id || user)) || [];
    return { _id:s._id, userId:user._id || user, name:user.name || '', grade:s.grade, resultCount:values.length,
      averageScore:values.length ? Math.round(values.reduce((a,b)=>a+b,0)/values.length) : null };
  });
  const measured = rows.filter(s=>s.resultCount>0);
  const examRows = scopedExams.map(e=> {
    const eligible = roster.filter(s=>s.grade===e.classLevel);
    const eligibleIds = new Set(eligible.map(s=>String(s.userId?._id || s.userId)));
    const participants = new Set((e.results || []).map(r=>String(r.studentId)).filter(id=>eligibleIds.has(id)));
    const phase = e.status === 'completed' ? 'ended' : getSchedulePhase(e,now);
    return {_id:e._id,title:e.title,classLevel:e.classLevel,phase,startAt:e.startAt,endAt:e.endAt,
      participantCount:participants.size,eligibleCount:eligible.length,missingCount:eligible.length-participants.size};
  }).sort((a,b)=>(a.phase==='live'?0:1)-(b.phase==='live'?0:1) || new Date(a.endAt || a.startAt || 8640000000000000)-new Date(b.endAt || b.startAt || 8640000000000000));
  return {classes,students:rows,exams:examRows.filter(e=>e.phase==='live'||e.phase==='scheduled').slice(0,6),
    stats:{totalStudents:rows.length,measuredStudents:measured.length,unmeasuredStudents:rows.length-measured.length,
      classAverage:measured.length ? Number((measured.reduce((a,s)=>a+s.averageScore,0)/measured.length).toFixed(1)) : null,
      activeExams:examRows.filter(e=>e.phase==='live').length,scheduledExams:examRows.filter(e=>e.phase==='scheduled').length},
    generatedAt:now};
}
module.exports={buildOverview};
