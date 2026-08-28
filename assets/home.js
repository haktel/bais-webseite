document.documentElement.classList.add('js');
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const reveals=document.querySelectorAll('.reveal');
if(reduceMotion||!('IntersectionObserver'in window)){reveals.forEach(el=>el.classList.add('inView'));}else{const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('inView');observer.unobserve(entry.target);}});},{threshold:.12,rootMargin:'0px 0px -40px'});reveals.forEach(el=>observer.observe(el));}
