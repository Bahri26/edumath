const test = require('node:test');
const assert = require('node:assert/strict');
const {validateExamBasics,validateManualQuestions,selectExamQuestions} = require('../../utils/examComposition');
const pool = () => ['Kolay','Orta','Zor'].flatMap(difficulty => Array.from({length:7},(_,i)=>({
  _id:`${difficulty}-${i}`,text:`${difficulty} soru ${i}`,classLevel:'9. Sınıf',subject:'Matematik',
  difficulty,type:'multiple-choice',options:['1','2','3','4'],correctAnswer:'2',assessmentMeta:{}
})));
test('balanced valid exam is accepted',()=>assert.equal(validateManualQuestions(pool(),'9. Sınıf','Matematik'),''));
test('manual exams reject wrong class, subject, review status, answer and duplicates',()=>{
  for (const change of [q=>q.classLevel='5. Sınıf',q=>q.subject='Türkçe',q=>q.assessmentMeta.needsReview=true,q=>q.correctAnswer='missing']) {
    const qs=pool();change(qs[0]);assert.ok(validateManualQuestions(qs,'9. Sınıf','Matematik'));
  }
  const qs=pool();qs[1]={...qs[0],_id:'other'};assert.match(validateManualQuestions(qs,'9. Sınıf','Matematik'),/birden fazla/);
});
test('automatic selection excludes unreviewed and duplicate content',()=>{
  const qs=pool();qs.push({...qs[0],_id:'duplicate'});qs[14].assessmentMeta.needsReview=true;
  const result=selectExamQuestions(qs,()=>0.5);
  assert.equal(result.sufficient,false);assert.deepEqual(result.counts,{Kolay:7,Orta:7,Zor:6});
  assert.equal(result.questions.length,20);
});
test('automatic exam has 21 unique balanced questions',()=>{
  const result=selectExamQuestions(pool(),()=>0.5);assert.equal(result.sufficient,true);assert.equal(result.questions.length,21);
});
test('invalid duration and reversed schedule are rejected',()=>{
  const args={title:'Test',classLevel:'9. Sınıf',duration:25};
  assert.equal(validateExamBasics(args),'');
  assert.ok(validateExamBasics({...args,duration:0}));
  assert.ok(validateExamBasics({...args,startAt:'2026-10-12',endAt:'2026-10-11'}));
  assert.ok(validateExamBasics({...args,endAt:'2000-01-01'}));
  assert.equal(validateExamBasics({...args,startAt:'2100-01-01'}),'');
});
test('empty and duplicate options cannot enter an exam',()=>{
  for (const options of [['1','1','3','4'],['1','','3','4']]) {
    const qs=pool();qs[0].options=options;qs[0].correctAnswer='A';
    assert.ok(validateManualQuestions(qs,'9. Sınıf','Matematik'));
  }
});
