export const onRequest=({request})=>Response.redirect(new URL("/admin/",request.url),302);
