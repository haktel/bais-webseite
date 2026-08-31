const READY=new Set();
const TABLES=Object.freeze({
 contacts:{
  columns:[
   ["score","INTEGER"],
   ["route","TEXT"],
   ["n8n_execution_id","TEXT"]
  ],
  index:"CREATE INDEX IF NOT EXISTS idx_contacts_route_score ON contacts(route,score DESC)"
 },
 enrollment_requests:{
  columns:[
   ["score","INTEGER"],
   ["route","TEXT"],
   ["n8n_execution_id","TEXT"]
  ],
  index:"CREATE INDEX IF NOT EXISTS idx_enrollment_requests_route_score ON enrollment_requests(route,score DESC)"
 }
});

const duplicateColumn=error=>/duplicate column name/i.test(String(error?.message||""));

export async function ensureLeadScoringSchema(db,table){
 const config=TABLES[table];
 if(!config)throw new Error("Unsupported lead-scoring table.");
 if(READY.has(table))return;

 const info=await db.prepare("PRAGMA table_info("+table+")").all();
 const existing=new Set((info.results||[]).map(row=>String(row.name)));

 for(const[name,type]of config.columns){
  if(existing.has(name))continue;
  try{
   await db.prepare("ALTER TABLE "+table+" ADD COLUMN "+name+" "+type).run();
  }catch(error){
   if(!duplicateColumn(error))throw error;
  }
 }

 await db.prepare(config.index).run();
 READY.add(table);
}
