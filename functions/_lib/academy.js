export const ACADEMY_PROGRAMS={"ki-fuehrerschein":"KI-Führerschein Essentials","ki-leadership":"KI-Führerschein Leadership","ki-it-security":"KI-Führerschein IT & Security","data-literacy":"Datenkompetenz für AI","prompt-engineering":"Prompt Engineering Professional","secure-ai-rag":"Secure AI & RAG","ai-agents":"AI Agents & Workflow Labs","enterprise-tools":"ChatGPT, Copilot & Gemini","n8n-bootcamp":"n8n Automation Bootcamp","ai-coding":"AI-gestützte Softwareentwicklung","api-integration":"APIs, Webhooks & Systemintegration","knowledge-assistant-lab":"Knowledge Assistant Lab","ai-governance":"AI Governance Essentials","eu-ai-act":"AI Literacy & EU AI Act Awareness","caio-masterguide":"CAIO Masterguide","policy-enablement":"AI Policy Enablement","ai-for-sales":"AI for Sales & B2B Vertrieb","ai-customer-service":"AI im Kundenservice","prozessanalyse-automation":"Prozessanalyse & Automation Discovery","it-projektmanagement-ai-delivery":"IT-Projektmanagement & AI Delivery","ki-health":"KI Health"};

export function academyProgram(slug){
 return typeof slug==="string"?ACADEMY_PROGRAMS[slug]||null:null;
}

export function coursePath(slug){
 if(slug==="n8n-bootcamp")return"/academy/n8n-bootcamp/modul-01/";
 return ACADEMY_PROGRAMS[slug]?"/academy/"+slug+"/":"/academy/";
}
