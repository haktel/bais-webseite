import test from"node:test";
import assert from"node:assert/strict";
import{FINAL_EXAM_BANK,buildExam,gradeFor}from"../functions/api/academy/n8n-final-exam.js";

test("final exam bank has balanced coverage across all 12 modules",()=>{
 assert.equal(FINAL_EXAM_BANK.length,48);
 for(let module=1;module<=12;module++){
  assert.equal(FINAL_EXAM_BANK.filter(q=>q.module===module).length,4);
 }
});

test("final exam builds 24 server-side questions with two per module and no answer flags",()=>{
 const exam=buildExam();
 assert.equal(exam.questions.length,24);
 assert.equal(Object.keys(exam.answerKey).length,24);
 assert.equal(new Set(exam.questions.map(q=>q.id)).size,24);
 for(let module=1;module<=12;module++){
  assert.equal(exam.questions.filter(q=>q.module===module).length,2);
 }
 for(const question of exam.questions){
  assert.ok(Array.isArray(question.options));
  assert.equal(question.options.length,4);
  assert.equal("correct" in question,false);
  const index=exam.answerKey[question.id];
  assert.equal(Number.isInteger(index),true);
  assert.ok(index>=0&&index<question.options.length);
 }
});

test("next final exam attempt avoids every immediately previous question when fresh alternatives exist",()=>{
 const first=buildExam(),previous=first.questions.map(q=>q.id),second=buildExam(previous);
 const overlap=second.questions.filter(q=>previous.includes(q.id));
 assert.equal(overlap.length,0);
});

test("final exam grade boundaries match BAIS mastery thresholds",()=>{
 assert.equal(gradeFor(92),1);
 assert.equal(gradeFor(81),2);
 assert.equal(gradeFor(67),3);
 assert.equal(gradeFor(50),4);
 assert.equal(gradeFor(49),5);
});


test("final exam includes one dynamic production scenario per module",()=>{
 const exam=buildExam();
 const dynamic=exam.questions.filter(question=>question.id.startsWith("D"));
 assert.equal(dynamic.length,12);
 for(let module=1;module<=12;module++){
  assert.equal(dynamic.filter(question=>question.module===module).length,1);
 }
});

test("immediate retry changes every dynamic production scenario",()=>{
 const first=buildExam();
 const previous=first.questions.map(question=>question.id);
 const second=buildExam(previous);
 const firstDynamic=new Set(first.questions.filter(q=>q.id.startsWith("D")).map(q=>q.id));
 const repeated=second.questions.filter(q=>q.id.startsWith("D")&&firstDynamic.has(q.id));
 assert.equal(repeated.length,0);
});

test("dynamic scenario questions still expose exactly four options and server-side answer keys",()=>{
 const exam=buildExam();
 for(const question of exam.questions.filter(q=>q.id.startsWith("D"))){
  assert.equal(question.options.length,4);
  assert.equal(new Set(question.options).size,4);
  const answer=exam.answerKey[question.id];
  assert.ok(Number.isInteger(answer));
  assert.ok(answer>=0&&answer<4);
 }
});
