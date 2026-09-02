export const MODULE_MILESTONE_TEMPLATES=Object.freeze({
 "MOD-01":["Kickoff & Anforderungen","Design/Wireframes freigegeben","Entwicklung abgeschlossen","Testing & QA","Go-Live"],
 "MOD-02":["Project Portal Setup","Portal-Freigabe durch Kunde","Portal Go-Live"],
 "MOD-03":["Wartung/Hosting Onboarding","Monitoring aktiv"],
 "MOD-04":["Redaktionsplan abgestimmt","Erste Content-Lieferung"]
});

export async function seedProjectMilestones(db,{projectId,organizationId,modules,actorUserId,now=new Date().toISOString()}){
 const existing=await db.prepare("SELECT 1 AS present FROM milestones WHERE project_id=? LIMIT 1").bind(projectId).first();
 if(existing)return{seeded:false,count:0};
 const titles=[];
 for(const code of Array.isArray(modules)?modules:[]){
  for(const title of MODULE_MILESTONE_TEMPLATES[code]||[])if(!titles.includes(title))titles.push(title);
 }
 if(!titles.length)return{seeded:false,count:0};
 const statements=titles.map((title,index)=>db.prepare("INSERT INTO milestones(id,project_id,title,status,due_at,position) VALUES(?,?,?,?,?,?)").bind(crypto.randomUUID(),projectId,title,"open",null,index));
 statements.push(db.prepare("INSERT INTO audit_events(id,actor_user_id,organization_id,event_type,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?,?)")
  .bind(crypto.randomUUID(),actorUserId||null,organizationId||null,"project.milestones.seeded","project",projectId,JSON.stringify({count:titles.length,titles}),now));
 await db.batch(statements);
 return{seeded:true,count:titles.length};
}
