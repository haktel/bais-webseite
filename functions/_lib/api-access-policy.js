const PUBLIC_EXACT=new Set([
 "/api/health",
 "/api/contact",
 "/api/academy/enrollments",
 "/api/academy/auth/login",
 "/api/academy/auth/register",
 "/api/customer/auth/register",
 "/api/customer/auth/verify",
 "/api/customer/auth/resend-verification",
 "/api/academy/auth/request-password-reset",
 "/api/academy/auth/reset-password",
 "/api/academy/auth/logout",
 "/api/n8n-demo",
 "/api/n8n-signature-verify"
]);
const SESSION_EXACT=new Set([
 "/api/academy/auth/me",
 "/api/academy/access-requests",
 "/api/academy/certificates",
 "/api/academy/module-progress",
 "/api/academy/n8n-final-exam",
 "/api/academy/kif-final-exam",
 "/api/academy/ki-health-final-exam",
 "/api/academy/progress",
 "/api/commercial/context",
 "/api/commercial/projects",
 "/api/commercial/sow",
 "/api/privacy/me"
]);
const normalize=path=>{const p=String(path||"").replace(/\/+$/,"");return p||"/";};
export function classifyApiPath(path){
 const p=normalize(path);
 if(PUBLIC_EXACT.has(p)||/^\/api\/certificates\/[^/]+$/.test(p))return{mode:"public"};
 if(p==="/api/admin/mfa"||p==="/api/admin/bootstrap")return{mode:"admin_session"};
 if(p.startsWith("/api/admin/"))return{mode:"admin_mfa"};
 if(p==="/api/customer/portal"||p==="/api/customer/documents/upload-url"||p==="/api/customer/documents/upload"||p==="/api/customer/documents/finalize"||p==="/api/customer/documents/download"||p==="/api/customer/documents/file"||p==="/api/customer/approvals/decide")return{mode:"customer_content",contentKey:"project_portal"};
 if(/^\/api\/n8n-module-(0[1-9]|1[0-2])$/.test(p)||p==="/api/academy/auth-lab-resource")return{mode:"course",courseSlug:"n8n-bootcamp"};
 if(/^\/api\/kif-module-0[1-6]$/.test(p))return{mode:"course",courseSlug:"ki-fuehrerschein"};
 if(SESSION_EXACT.has(p))return{mode:"session"};
 return{mode:"deny"};
}
