import{ApiError}from"./api.js";import{ensureAuthSchema,requireSession}from"./auth.js";
export const REQUEST_STATUSES=["new","contacted","qualified","approved","rejected","closed"],CONTACT_STATUSES=["new","in_progress","closed"];
export function validAdminStatus(type,status){const list=type==="request"?REQUEST_STATUSES:type==="contact"?CONTACT_STATUSES:[];return list.includes(status);}
export async function requireAdmin(db,request){
 await ensureAuthSchema(db);const user=await requireSession(db,request);
 if(user.role!=="admin")throw new ApiError(403,"admin_required","Für diesen Bereich ist eine Administrator-Berechtigung erforderlich.");
 return user;
}
