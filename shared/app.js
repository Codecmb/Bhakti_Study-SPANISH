function appRoot(){
  const p=location.pathname.replace(/\\/g,'/');
  if(p.includes('/programs/sat-sandarbhas/') && /\/programs\/sat-sandarbhas\/[^/]+\//.test(p)) return '../../../';
  if(p.includes('/programs/')) return '../../';
  if(p.includes('/library/books/')) return '../../';
  if(p.includes('/library/')) return '../';
  if(p.includes('/student/')||p.includes('/admin/')||p.includes('/certificates/')||p.includes('/slokas/')||p.includes('/references/')||p.includes('/question-bank/')||p.includes('/study/')) return '../';
  return './';
}
const ROOT=appRoot();
async function json(p){
  const local=location.hostname==='localhost'||location.hostname==='127.0.0.1';
  let r=await fetch(p,local?{cache:'no-store'}:undefined);
  if(!r.ok)throw Error(p);
  return r.json()
}
function sidebar(a='home',rootOverride=null){
 const R=rootOverride||ROOT;
 const link=i=>`<a class="${i[0]===a?'active':''}" href="${i[2]}">${i[1]}</a>`;
 const home=['home','Inicio de la Academia',R+'index.html'];
 const groups=[
   ['Estudio',[
     ['bhakti-sastri','Bhakti Śāstrī',R+'programs/bhakti-sastri/index.html'],
     ['bhakti-vaibhava','Bhakti Vaibhava',R+'programs/bhakti-vaibhava/index.html'],
     ['bhakti-vedanta','Bhakti Vedānta',R+'programs/bhakti-vedanta/index.html'],
     ['bhakti-sarvabhauma','Bhakti Sārvabhauma',R+'programs/bhakti-sarvabhauma/index.html'],
     ['sat-sandarbhas','Ṣaṭ Sandarbhas',R+'programs/sat-sandarbhas/index.html']
   ]],
   ['Mi Estudio',[
     ['study','Estudiar',R+'study/index.html'],
     ['portfolio','Mi Trabajo',R+'student/portfolio.html'],
     ['question-bank','Banco de Preguntas',R+'question-bank/index.html'],
     ['progress','Mi Progreso',R+'student/progress.html'],
     ['certificates','Certificados',R+'certificates/index.html']
   ]],
   ['Recursos',[
     ['library','Libros y Biblioteca',R+'library/index.html'],
     ['references','Referencias y Estudio Adicional',R+'references/index.html'],
     ['slokas','Śloka Lab',R+'slokas/index.html']
   ]],
   ['Academia',[
     ['manage','Administrar Academia',R+'admin/index.html']
   ]]
 ];
 const grouped=groups.map(([label,items])=>`<div class="nav-group"><div class="nav-label">${label}</div>${items.map(link).join('')}</div>`).join('');
 document.querySelector('.sidebar').innerHTML=`<div class="brand"><img src="${R}assets/bhakti-study-logo.png" alt="Bhakti Study Academy" style="display:block;width:118px;height:118px;object-fit:contain;margin:0 auto 10px"><div>Bhakti Study</div></div><nav class="nav">${link(home)}${grouped}</nav>`;

 const main=document.querySelector('.main');
 if(main && !main.querySelector('.academy-creator-credit')){
   const credit=document.createElement('div');
   credit.className='academy-creator-credit';
   credit.innerHTML='<strong>Madhuha Dasa A. (HDG)</strong><span>Academia Master Siddhānta Gauḍīya</span>';
   main.prepend(credit);
 }
}
async function renderProgram(id){
 sidebar(id);let [ps,bs]=await Promise.all([json('../../data/programs.json'),json('../../data/books.json')]),p=ps.find(x=>x.id===id),m=Object.fromEntries(bs.map(b=>[b.id,b]));
 title.textContent=p.title;subtitle.textContent=p.subtitle;
 books.innerHTML=p.books.map(id=>{let b=m[id]||{id,title:id.toUpperCase(),status:'no registrado'};let ready=b.status==='imported';return `<article class="card"><span class="tag">${b.status}</span><h3>${b.title}</h3><p class="small">${b.source||'Listo para registro modular.'}</p>${ready?`<a class="button secondary" href="../../library/reader.html?book=${encodeURIComponent(b.id)}">Abrir Libro</a>`:'<button class="button secondary" disabled>Fuente Necesaria</button>'}</article>`}).join('')
}

// Universal escape navigation: additive only; does not replace page-specific navigation.
(function installQuickNav(){
  function add(){
    if(document.querySelector('.academy-quick-nav')) return;

    const box=document.createElement('div');
    box.className='academy-quick-nav';
    box.style.cssText='position:fixed;right:14px;bottom:14px;z-index:9999;display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end;background:rgba(255,255,255,.96);padding:8px;border:1px solid #ddd3c2;border-radius:12px;box-shadow:0 5px 18px rgba(0,0,0,.12)';

    const path=location.pathname.replace(/\\/g,'/');
    const match=path.match(/\/programs\/([^/]+)\//);

    if(match){
      const program=document.createElement('a');
      program.className='button secondary';
      program.href=ROOT+'programs/'+encodeURIComponent(match[1])+'/index.html';
      program.textContent='↑ Inicio del Área';
      box.appendChild(program);
    }

    const home=document.createElement('a');
    home.className='button secondary';
    home.href=ROOT+'index.html';
    home.textContent='🏠 Inicio de la Academia';
    box.appendChild(home);

    document.body.appendChild(box);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',add);
  }else{
    add();
  }
})();
