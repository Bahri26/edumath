const {test}=require('node:test');
const assert=require('node:assert/strict');
const {buildOverview}=require('../../utils/teacherOverview');
const now=new Date('2026-10-11T10:00:00Z');
const students=[{_id:'s1',userId:{_id:'u1',name:'Ada'},grade:'6. Sınıf'},{_id:'s2',userId:{_id:'u2',name:'Efe'},grade:'6. Sınıf'},{_id:'s3',userId:{_id:'u3',name:'Ali'},grade:'7. Sınıf'}];
const exam={_id:'e1',title:'Sınav',classLevel:'6. Sınıf',status:'active',startAt:'2026-10-10',endAt:'2026-10-12',results:[{studentId:'u1',score:0,submittedAt:'2026-10-11'},{studentId:'other',score:100,submittedAt:'2026-10-11'}]};
test('real zero is measured; absent result is null and not included in average',()=>{
 const out=buildOverview(students,[exam],{now});
 assert.equal(out.students[0].averageScore,0);assert.equal(out.students[1].averageScore,null);
 assert.equal(out.stats.measuredStudents,1);assert.equal(out.stats.classAverage,0);
 assert.equal(out.exams[0].participantCount,1);assert.equal(out.exams[0].eligibleCount,2);
});
test('schedule excludes expired, completed and future exams from live count',()=>{
 const out=buildOverview(students,[exam,{...exam,_id:'past',endAt:'2026-10-01'}, {...exam,_id:'future',startAt:'2026-10-15',endAt:'2026-10-16'}, {...exam,_id:'done',status:'completed'}],{now});
 assert.equal(out.stats.activeExams,1);assert.equal(out.stats.scheduledExams,1);assert.equal(out.exams.length,2);
});
test('class and result-period filters keep the roster denominator honest',()=>{
 const out=buildOverview(students,[{...exam,results:[{studentId:'u1',score:80,submittedAt:'2026-09-01'}]}],{now,classLevel:'6. Sınıf',days:7});
 assert.equal(out.stats.totalStudents,2);assert.equal(out.stats.classAverage,null);assert.equal(out.stats.unmeasuredStudents,2);
 assert.ok(out.classes.includes('7. Sınıf'));
});
