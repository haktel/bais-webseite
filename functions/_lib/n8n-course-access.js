export const N8N_COURSE_SLUG="n8n-bootcamp";
export const N8N_MODULE_COUNT=12;

export const moduleSlugFor=number=>"modul-"+String(number).padStart(2,"0");

export function moduleNumberFromSlug(moduleSlug){
  const match=String(moduleSlug||"").match(/^modul-(0[1-9]|1[0-2])$/);
  return match?Number(match[1]):0;
}

export async function findN8nEnrollment(db,userId){
  return db.prepare(
    "SELECT c.id AS course_id,e.status FROM enrollments e JOIN course_runs r ON r.id=e.course_run_id JOIN courses c ON c.id=r.course_id WHERE e.user_id=? AND c.slug=? AND e.status IN('active','completed') LIMIT 1"
  ).bind(userId,N8N_COURSE_SLUG).first();
}

async function modulePercent(db,userId,courseId,moduleSlug){
  const row=await db.prepare(
    "SELECT module_percent FROM academy_module_progress WHERE user_id=? AND course_id=? AND module_slug=? LIMIT 1"
  ).bind(userId,courseId,moduleSlug).first();
  return Number(row?.module_percent||0);
}

export async function firstIncompletePriorN8nModule(db,userId,courseId,moduleSlug){
  const requested=moduleNumberFromSlug(moduleSlug);
  if(requested<=1)return null;
  for(let number=1;number<requested;number++){
    const slug=moduleSlugFor(number);
    if(await modulePercent(db,userId,courseId,slug)<100)return slug;
  }
  return null;
}

export async function firstIncompleteN8nModule(db,userId,courseId){
  for(let number=1;number<=N8N_MODULE_COUNT;number++){
    const slug=moduleSlugFor(number);
    if(await modulePercent(db,userId,courseId,slug)<100)return slug;
  }
  return null;
}
