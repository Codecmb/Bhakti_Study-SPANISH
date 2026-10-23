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
 const link=i=>{
  if(i[2]==='#') return `<span class="nav-placeholder" style="display:block;padding:10px 12px;opacity:.65;cursor:default">${i[1]}</span>`;
  if(i[0]==='journal'){
    return `<a class="${i[0]===a?'active':''}" href="${i[2]}">${i[1]} ↗</a>`;
  }
  return `<a class="${i[0]===a?'active':''}" href="${i[2]}">${i[1]}</a>`;
 };
 const home=['home','Inicio de la Academia',R+'index.html'];
 const groups=[
   ['Programas Académicos',[
     ['bhakti-sastri','Bhakti Śāstrī',R+'programs/bhakti-sastri/index.html'],
     ['bhakti-vaibhava','Bhakti Vaibhava',R+'programs/bhakti-vaibhava/index.html'],
     ['bhakti-vedanta','Bhakti Vedānta',R+'programs/bhakti-vedanta/index.html'],
     ['bhakti-sarvabhauma','Bhakti Sārvabhauma',R+'programs/bhakti-sarvabhauma/index.html'],
     ['sat-sandarbhas','Ṣaṭ Sandarbhas',R+'programs/sat-sandarbhas/index.html']
   ]],
   ['Mi Estudio',[
     ['classroom','Aula de Estudio',R+'student/aula-estudio.html'],
     ['book-study','Estudio de Libros',R+'student/book-study.html'],
     
     ['portfolio','Mi Trabajo',R+'student/portfolio.html'],
     ['journal','Diario de Estudio',R+'student/journal.html'],
     ['question-bank','Banco de Preguntas',R+'question-bank/index.html'],
     ['progress','Mi Progreso',R+'student/progress.html'],
     ['certificates','Certificados',R+'certificates/index.html']
   ]],
   ['Recursos',[
     ['versos-mas-mencionados','Versos Más Mencionados',R+'versos-mas-mencionados/index.html'],
     ['library','Libros y Biblioteca',R+'library/index.html'],
     ['references','Referencias y Estudio Adicional',R+'references/index.html']
   ]],
   ['Academia',[
     ['manage','Administrar Academia',R+'admin/index.html']
   ]]
 ];
  const grouped=groups.map(([label,items])=>{
    if(label==='Programas Académicos'){
      const expanded=items.some(item=>item[0]===a);
      return `<div class="nav-group"><details class="academic-programs-menu" ${expanded?'open':''}>
        <summary style="cursor:pointer;padding:12px 10px;font-weight:700;list-style-position:inside">Programas Académicos</summary>
        <div style="padding-left:12px">${items.map(link).join('')}</div>
      </details></div>`;
    }
    return `<div class="nav-group"><div class="nav-label">${label}</div>${items.map(link).join('')}</div>`;
  }).join('');
 document.querySelector('.sidebar').innerHTML=`<div class="brand"><img src="${R}assets/bhakti-study-logo.png" alt="Estudio del Bhakti En Español" style="display:block;width:118px;height:118px;object-fit:contain;margin:0 auto 10px"><div>Estudio del Bhakti En Español</div></div><nav class="nav">${link(home)}
<details id="bhakti-tools-menu" style="margin:10px 0">
  <summary style="cursor:pointer;display:block;padding:12px 10px;background:rgba(255,255,255,.15);border-radius:8px;font-size:15px;font-weight:700;color:white">
    🛠 HERRAMIENTAS ▾
  </summary>
  <div style="display:flex;flex-direction:column;gap:12px;padding:14px 10px">
    <a href="${R}admin/books.html">Biblioteca y Traducciones</a>
    <a href="${R}admin/sandarbhas-editor.html">Editor de Ṣaṭ Sandarbhas</a>
    <a href="${R}admin/questions.html">Administrar Preguntas</a>
    <a href="${R}admin/references.html">Administrar Referencias</a>
    <a href="${R}admin/study-guides.html">Administrar Guías de Estudio</a>
    <a href="${R}student/bg-es-editor.html">Editor de Bhagavad-gītā</a>
  </div>
</details><a class="nav-link" href="${R}student/search.html">🔎 Búsqueda Global</a><a class="nav-link" href="${R}index.html?descargar-biblioteca=1" id="download-library-link">⬇ Descargar biblioteca completa</a>${grouped}

<div id="bhakti-update-sidebar-slot"
  style="margin:18px 8px 12px"></div>
</nav>`;

 const journalSidebarLink=document.querySelector('.sidebar a[href*="student/journal.html"]');
 if(journalSidebarLink){
   journalSidebarLink.addEventListener('click',function(event){
     event.preventDefault();

     const url=new URL(R+'student/journal.html',location.href);
     const params=new URLSearchParams(location.search);
     const ref=params.get('ref')||'';
     const parts=ref.split('.');
     const path=location.pathname;
     let context=null;

     if(path.endsWith('/bhakti-sastri/bg-1-6.html')
        && /^BG\.\d+\.\d+$/i.test(ref)){
       context={
         program:'Bhakti Śāstrī',
         unit:'bg-'+parts[1],
         book:'bg-es',
         bookTitle:'Bhagavad-gītā Tal Como Es',
         section:'Capítulo '+parts[1]
       };
     }else if(path.endsWith('/bhakti-vaibhava/sb.html')
        && /^SB\.\d+\.\d+\.\d+$/i.test(ref)){
       context={
         program:'Bhakti Vaibhava',
         unit:params.get('unit')||'',
         book:'sb-canto-'+parts[1],
         bookTitle:'Śrīmad-Bhāgavatam',
         section:'Canto '+parts[1]+', Capítulo '+parts[2]
       };
     }else if(path.endsWith('/bhakti-vedanta/sb.html')
        && /^SB\.\d+\.\d+\.\d+$/i.test(ref)){
       context={
         program:'Bhakti Vedānta',
         unit:params.get('unit')||'',
         book:'sb-canto-'+parts[1],
         bookTitle:'Śrīmad-Bhāgavatam',
         section:'Canto '+parts[1]+', Capítulo '+parts[2]
       };
     }else if(path.endsWith('/bhakti-sarvabhauma/cc.html')
        && /^CC\.[A-Za-z]+\.\d+\.\d+$/i.test(ref)){
       context={
         program:'Bhakti Sārvabhauma',
         unit:params.get('unit')||'',
         book:'cc-'+parts[1].toLowerCase(),
         bookTitle:'Śrī Caitanya-caritāmṛta',
         section:parts[1].toUpperCase()+', Capítulo '+parts[2]
       };
     }

     if(!context){
       const sandarbha=path.match(/\/programs\/sat-sandarbhas\/(tattva|bhagavat|paramatma|krsna|bhakti|priti)\/index\.html$/);
       const prefixes={tattva:'TS',bhagavat:'BGS',paramatma:'PAS',krsna:'KS',bhakti:'BHS',priti:'PS'};

       if(sandarbha){
         const work=sandarbha[1];
         const n=Math.max(1,parseInt(params.get('n'),10)||1);
         const canonical=prefixes[work]+'.'+n;
         const titles={
           tattva:'Tattva Sandarbha',
           bhagavat:'Bhagavat Sandarbha',
           paramatma:'Paramātma Sandarbha',
           krsna:'Kṛṣṇa Sandarbha',
           bhakti:'Bhakti Sandarbha',
           priti:'Prīti Sandarbha'
         };
         context={
           program:'sat-sandarbhas',
           unit:work,
           book:work,
           bookTitle:titles[work],
           section:canonical
         };
         url.searchParams.set('ref',canonical);
       }else if(path.endsWith('/library/reader.html')){
         const book=params.get('book')||'';
         if(book){
           context={
             program:params.get('program')||'',
             unit:params.get('unit')||'',
             book,
             bookTitle:document.getElementById('bookTitle')?.textContent||book,
             section:document.getElementById('sectionHeader')?.querySelector('h2')?.textContent||''
           };
         }
       }
     }

     if(context){
       Object.entries({...context,ref: url.searchParams.get('ref')||ref}).forEach(([key,value])=>{
         url.searchParams.set(key,value);
       });
     }

     journalSidebarLink.href=url.href;
     const popup=window.open(
       url.href,
       '_blank',
       'popup=yes,width=760,height=900,left=20,top=20,resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no,status=no'
     );
     if(popup)popup.focus();
   });
 }

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


/* BHAKTI UNIVERSAL MOBILE NAVIGATION */
(function () {
  function initializeMobileNavigation() {
    const layout = document.querySelector(".layout");
    const sidebar = layout?.querySelector(".sidebar");

    if (!layout || !sidebar) return;

    // La portada ya tiene su propio controlador.
    if (document.getElementById("bhakti-menu-button")) return;

    layout.classList.add("bhakti-mobile-layout");

    const button = document.createElement("button");
    button.id = "bhakti-universal-menu-button";
    button.type = "button";
    button.textContent = "☰";
    button.setAttribute("aria-controls", "bhakti-universal-sidebar");

    sidebar.id ||= "bhakti-universal-sidebar";

    let closed = true;

    function update() {
      layout.classList.toggle("bhakti-mobile-menu-hidden", closed);
      button.setAttribute("aria-expanded", String(!closed));
      button.setAttribute(
        "aria-label",
        closed ? "Mostrar menú lateral" : "Ocultar menú lateral"
      );
      button.title = closed ? "Mostrar menú" : "Ocultar menú";
      button.textContent = closed ? "☰" : "✕";
    }

    button.addEventListener("click", function () {
      closed = !closed;
      update();
    });

    sidebar.addEventListener("click", function (event) {
      const link = event.target.closest("a[href]");
      if (!link || !window.matchMedia("(max-width:760px)").matches) return;
      closed = true;
      update();
    });

    document.body.appendChild(button);
    update();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeMobileNavigation
    );
  } else {
    initializeMobileNavigation();
  }
})();
