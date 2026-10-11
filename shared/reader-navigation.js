(function(){
 const KEY='bhakti-study:reader-nav-collapsed';
 function init(){
  const grid=document.querySelector('.bg-grid,.sb-grid,.cc-grid'); if(!grid)return;
  const nav=grid.querySelector(':scope > section:first-child'); if(!nav)return;
  nav.classList.add('reader-passage-nav');
  const btn=document.createElement('button'); btn.type='button'; btn.className='reader-nav-toggle button secondary';
  nav.insertBefore(btn,nav.firstChild);
  const set=v=>{grid.classList.toggle('reader-nav-collapsed',v);btn.textContent=v?'C ›':'‹ Capítulos y versos';btn.title=v?'Expandir la navegación de capítulos y versos':'Contraer la navegación de capítulos y versos';btn.setAttribute('aria-label',v?'Expandir la navegación de capítulos y versos':'Contraer la navegación de capítulos y versos');btn.setAttribute('aria-expanded',String(!v));try{localStorage.setItem(KEY,v?'1':'0')}catch{}};
  let v=false;try{v=localStorage.getItem(KEY)==='1'}catch{} set(v);
  btn.addEventListener('click',()=>set(!grid.classList.contains('reader-nav-collapsed')));
 }
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();