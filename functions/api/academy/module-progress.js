import{ApiError,assertDatabase,cleanText,handleError,json,readJson,requestId}from"../../_lib/api.js";
import{assertSameOrigin,ensureAuthSchema,requireSession}from"../../_lib/auth.js";

// Keyed by courseSlug -> moduleSlug, not just moduleSlug, so two different
// courses can each have their own "modul-01" without one course's lesson
// count or lab case ids leaking into the other's validation.
const LESSONS_PER_MODULE={
  "n8n-bootcamp":{"modul-01":12,"modul-02":12,"modul-03":12},
  "ki-fuehrerschein":{"modul-01":12,"modul-02":12,"modul-03":12,"modul-04":12}
};
const LAB_CASES={
  "n8n-bootcamp":{"modul-01":["qualified","standard","invalid"],"modul-02":["single","batch","invalid"],"modul-03":["get","post","invalid"]},
  "ki-fuehrerschein":{"modul-01":["gut","verbesserungswuerdig","blockiert"],"modul-02":["verlaesslich","pruefen","kritisch"],"modul-03":["vollstaendig","teilweise","unzureichend"],"modul-04":["unbedenklich","personenbezogen","besondere_kategorie"]}
};

const parseArray=value=>{
  try{
    const parsed=JSON.parse(value||"[]");
    return Array.isArray(parsed)?parsed:[];
  }catch{return[];}
};

const unique=value=>[...new Set(value.map(String))];

async function courseForUser(db,userId,slug){
  return db.prepare(
    "SELECT c.id,c.slug FROM enrollments e JOIN course_runs r ON r.id=e.course_run_id JOIN courses c ON c.id=r.course_id WHERE e.user_id=? AND c.slug=? AND e.status IN('active','completed') LIMIT 1"
  ).bind(userId,slug).first();
}

function moduleCountForCourse(courseSlug){
  return Object.keys(LESSONS_PER_MODULE[courseSlug]||{}).length||1;
}

async function recalcCourse(db,userId,courseId,courseSlug,now){
  const aggregate=await db.prepare(
    "SELECT COALESCE(SUM(module_percent),0) AS total FROM academy_module_progress WHERE user_id=? AND course_id=?"
  ).bind(userId,courseId).first();
  // Course-wide percent is the average of each of THIS course's own
  // modules, not a fixed guess at how many modules a course has - a course
  // with 3 real modules must be able to reach 100%, not cap out at 25%.
  const percent=Math.max(0,Math.min(100,Math.round(Number(aggregate?.total||0)/moduleCountForCourse(courseSlug))));
  const status=percent===100?"completed":percent>0?"in_progress":"not_started";
  await db.batch([
    db.prepare(
      "INSERT INTO course_progress(user_id,course_id,progress_percent,status,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(user_id,course_id) DO UPDATE SET progress_percent=excluded.progress_percent,status=excluded.status,updated_at=excluded.updated_at"
    ).bind(userId,courseId,percent,status,now),
    db.prepare(
      "UPDATE enrollments SET status=?,completed_at=? WHERE user_id=? AND course_run_id IN(SELECT id FROM course_runs WHERE course_id=?)"
    ).bind(percent===100?"completed":"active",percent===100?now:null,userId,courseId)
  ]);
  return{percent,status};
}

function moduleScore(courseSlug,moduleSlug,lessons,labs,best){
  const lessonTotal=LESSONS_PER_MODULE[courseSlug]?.[moduleSlug]||0;
  const labTotal=(LAB_CASES[courseSlug]?.[moduleSlug]||[]).length;
  const lessonPart=lessonTotal?Math.round(Math.min(unique(lessons).length,lessonTotal)/lessonTotal*60):0;
  const labPart=labTotal?Math.round(Math.min(unique(labs).length,labTotal)/labTotal*20):0;
  // The result screen shows the full academic Notenskala (1-5, 50%+ is a
  // technically-passing "ausreichend"), but BAIS module credit is a higher,
  // deliberate bar: our target learner demonstrates real mastery (Note 2
  // "gut" or better), not a bare pass. A Note 3/4 result is shown honestly
  // as passed academically, but does not yet unlock module credit.
  const assessmentPart=Number(best)>=81?20:0;
  return Math.min(100,lessonPart+labPart+assessmentPart);
}

export const onRequestGet=async({request,env})=>{
  const traceId=requestId(request);
  try{
    const db=assertDatabase(env);
    await ensureAuthSchema(db);
    const user=await requireSession(db,request);
    const url=new URL(request.url),courseSlug=cleanText(url.searchParams.get("courseSlug"),120),moduleSlug=cleanText(url.searchParams.get("moduleSlug"),40);
    if(!courseSlug||!/^modul-(0[1-9]|1[0-2])$/.test(moduleSlug))throw new ApiError(422,"validation_failed","Programm und Modul sind erforderlich.");
    const course=await courseForUser(db,user.user_id,courseSlug);
    if(!course)throw new ApiError(404,"enrollment_not_found","Für dieses Programm besteht keine aktive Anmeldung.");
    const row=await db.prepare(
      "SELECT completed_lessons_json,lab_cases_json,assessment_best,module_percent,updated_at FROM academy_module_progress WHERE user_id=? AND course_id=? AND module_slug=? LIMIT 1"
    ).bind(user.user_id,course.id,moduleSlug).first();
    return json({ok:true,module:{
      moduleSlug,
      completedLessons:parseArray(row?.completed_lessons_json),
      labCases:parseArray(row?.lab_cases_json),
      assessmentBest:Number(row?.assessment_best||0),
      modulePercent:Number(row?.module_percent||0),
      updatedAt:row?.updated_at||null
    },requestId:traceId});
  }catch(error){return handleError(error,traceId);}
};

export const onRequestPost=async({request,env})=>{
  const traceId=requestId(request);
  try{
    assertSameOrigin(request);
    const db=assertDatabase(env);
    await ensureAuthSchema(db);
    const user=await requireSession(db,request);
    const body=await readJson(request,4096),
      courseSlug=cleanText(body.courseSlug,120),
      moduleSlug=cleanText(body.moduleSlug,40),
      event=cleanText(body.event,40);

    if(!courseSlug||!/^modul-(0[1-9]|1[0-2])$/.test(moduleSlug)||!["lesson_complete","lab_case","assessment_result"].includes(event))
      throw new ApiError(422,"validation_failed","Ungültiger Lernfortschritt.");

    const course=await courseForUser(db,user.user_id,courseSlug);
    if(!course)throw new ApiError(404,"enrollment_not_found","Für dieses Programm besteht keine aktive Anmeldung.");

    const current=await db.prepare(
      "SELECT completed_lessons_json,lab_cases_json,assessment_best FROM academy_module_progress WHERE user_id=? AND course_id=? AND module_slug=? LIMIT 1"
    ).bind(user.user_id,course.id,moduleSlug).first();

    let lessons=unique(parseArray(current?.completed_lessons_json)),
      labs=unique(parseArray(current?.lab_cases_json)),
      best=Number(current?.assessment_best||0);

    if(event==="lesson_complete"){
      const lessonId=cleanText(body.lessonId,8);
      const max=LESSONS_PER_MODULE[courseSlug]?.[moduleSlug]||0;
      if(!/^\d{2}$/.test(lessonId)||Number(lessonId)<1||Number(lessonId)>max)throw new ApiError(422,"lesson_invalid","Ungültige Lerneinheit.");
      lessons=unique([...lessons,lessonId]);
    }

    if(event==="lab_case"){
      const caseId=cleanText(body.caseId,40);
      if(!(LAB_CASES[courseSlug]?.[moduleSlug]||[]).includes(caseId))throw new ApiError(422,"lab_case_invalid","Ungültiger Lab-Fall.");
      labs=unique([...labs,caseId]);
    }

    if(event==="assessment_result"){
      const score=Number(body.score);
      if(!Number.isInteger(score)||score<0||score>100)throw new ApiError(422,"assessment_invalid","Ungültiges Assessment-Ergebnis.");
      best=Math.max(best,score);
    }

    const modulePercent=moduleScore(courseSlug,moduleSlug,lessons,labs,best),now=new Date().toISOString();
    await db.prepare(
      "INSERT INTO academy_module_progress(user_id,course_id,module_slug,completed_lessons_json,lab_cases_json,assessment_best,module_percent,updated_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(user_id,course_id,module_slug) DO UPDATE SET completed_lessons_json=excluded.completed_lessons_json,lab_cases_json=excluded.lab_cases_json,assessment_best=excluded.assessment_best,module_percent=excluded.module_percent,updated_at=excluded.updated_at"
    ).bind(user.user_id,course.id,moduleSlug,JSON.stringify(lessons),JSON.stringify(labs),best,modulePercent,now).run();

    const courseProgress=await recalcCourse(db,user.user_id,course.id,course.slug,now);
    await db.prepare(
      "INSERT INTO audit_events(id,actor_user_id,event_type,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)"
    ).bind(crypto.randomUUID(),user.user_id,"academy.module.progress","course",course.id,JSON.stringify({moduleSlug,event,modulePercent,coursePercent:courseProgress.percent}),now).run();

    return json({ok:true,module:{moduleSlug,completedLessons:lessons,labCases:labs,assessmentBest:best,modulePercent},course:courseProgress,requestId:traceId});
  }catch(error){return handleError(error,traceId);}
};

export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"GET, POST"});