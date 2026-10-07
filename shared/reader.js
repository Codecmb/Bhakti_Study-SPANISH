sidebar('library');
const qs=new URLSearchParams(location.search), bookId=qs.get('book'), targetRef=qs.get('ref')||'', programId=qs.get('program')||'', unitId=qs.get('unit')||'';
let book,meta,sectionIndex=0,verseIndex=0;
const el={status:document.getElementById('status'),reader:document.getElementById('reader'),bookTitle:document.getElementById('bookTitle'),bookMeta:document.getElementById('bookMeta'),chapters:document.getElementById('chapters'),sectionHeader:document.getElementById('sectionHeader'),verses:document.getElementById('verses'),passage:document.getElementById('passage'),back:document.getElementById('back')};
const cleanText=s=>(s??'').toString().replace(/\\n/g,'\n');
const esc=s=>cleanText(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function canonicalOf(v){let r=String(v.reference||'');if(meta.canonicalId==='BG')return 'BG.'+r;if(meta.canonicalId?.startsWith('SB.'))return 'SB.'+r;if(meta.canonicalId?.startsWith('CC.')){let m=r.match(/(adi|madhya|antya)\.(\d+)\.(\d+(?:-\d+)?)/i);if(m)return `CC.${m[1].toUpperCase()}.${m[2]}.${m[3]}`}if(meta.canonicalId==='ISO'||meta.canonicalId==='NOI'){let m=r.match(/(\d+)/);if(m)return `${meta.canonicalId}.${m[1]}`}if(meta.canonicalId==='NOD'){if(/^NOD\.(?:Dedication|Preface|Introduction|\d+)$/i.test(v.id||''))return v.id;let m=r.match(/^\s*(\d+)/);if(m)return `NOD.${m[1]}`}return v.id||r}
async function load(){
 if(!bookId){el.status.textContent='No se ha seleccionado ningún libro.';return}
 try{
  const catalog=await json('../data/books.json'); meta=catalog.find(b=>b.id===bookId);
  if(!meta||meta.status!=='imported'){el.status.textContent='La fuente de este libro aún no ha sido registrada.';return}
  book=await json('../'+meta.dataPath); el.bookTitle.textContent=book.title; el.bookMeta.textContent=[book.creator,book.publisher,`Fuente interna: ${meta.source}`,`Formato: ${book.source_format}`].filter(Boolean).join(' · ');
  el.status.hidden=true;el.reader.hidden=false;renderSections(); if(!openTarget()) openSection(0);
 }catch(e){el.status.textContent='No se pudo cargar este libro. '+e.message}
}
function openTarget(){if(!targetRef)return false;let want=targetRef.toUpperCase().replace(/Ā/g,'A');for(let si=0;si<book.sections.length;si++){const vs=book.sections[si].verses||[];for(let vi=0;vi<vs.length;vi++){if(canonicalOf(vs[vi]).toUpperCase().replace(/Ā/g,'A')===want){openSection(si,false);openVerse(vi);return true}}}return false}
function renderSections(){el.chapters.innerHTML=book.sections.map((s,i)=>`<button class="chapter-btn" data-i="${i}">${esc(s.title||`Sección ${i+1}`)}</button>`).join('');el.chapters.onclick=e=>{let b=e.target.closest('.chapter-btn');if(b)openSection(+b.dataset.i)}}
function openSection(i,first=true){sectionIndex=i;verseIndex=0;[...el.chapters.children].forEach((b,j)=>b.classList.toggle('active',j===i));let s=book.sections[i];el.sectionHeader.innerHTML=`<h2>${esc(s.title)}</h2><p class="small muted">${esc(s.kind||'sección')} · ${s.verses?.length||0} registro(s) de estudio</p>`;el.verses.innerHTML=(s.verses||[]).map((v,j)=>`<button class="verse-btn" data-i="${j}">${esc(v.reference||v.id||`Texto ${j+1}`)}</button>`).join('');el.verses.onclick=e=>{let b=e.target.closest('.verse-btn');if(b)openVerse(+b.dataset.i)};if(first){if(s.verses?.length)openVerse(0);else el.passage.innerHTML='<p>No hay registros a nivel de verso en esta sección.</p>'}}
function neighbor(delta){let si=sectionIndex,vi=verseIndex+delta;while(si>=0&&si<book.sections.length){let vs=book.sections[si].verses||[];if(vi>=0&&vi<vs.length)return {si,vi,v:vs[vi]};if(delta>0){si++;vi=0}else{si--;if(si>=0)vi=(book.sections[si].verses||[]).length-1}}return null}
function jump(n){if(!n)return;if(n.si!==sectionIndex)openSection(n.si,false);openVerse(n.vi)}

function returnToQuestion(){
 const ctx=
   window.StudyReturnContext?.get?.(programId) ||
   window.StudyReturnContext?.latest?.();

 if(!ctx?.returnHref)return '';

 return `<a class="button lotus" href="${esc(ctx.returnHref)}">← Volver al Banco de Preguntas</a>`;
}

function journalBookTitle(title){
 const value=String(title||'').trim();

 const titles={
   'Bhagavad-gītā As It Is':'Bhagavad-gītā Tal Como Es'
 };

 return titles[value]||value;
}

function journalSectionTitle(title){
 let value=String(title||'').trim();

 value=value.replace(
   /^(Chapter\s+\d+):\s+\1:\s*/i,
   '$1: '
 );

 value=value.replace(/^Chapter\s+(\d+):/i,'Capítulo $1:');

 const titles={
   'Capítulo 1: Observing the Armies on the Battlefield of Kurukṣetra':
     'Capítulo 1: Observando los Ejércitos en el Campo de Batalla de Kurukṣetra',
   'Capítulo 2: Contents of the Gītā Summarized':
     'Capítulo 2: Resumen del Contenido del Gītā'
 };

 return titles[value]||value;
}

function renderStudyContext(canonical){
 const host=document.querySelector('#studyContext');
 if(!host)return;

 const study=programId&&unitId
   ? `<a class="button lotus" href="../programs/${encodeURIComponent(programId)}/tools.html?unit=${encodeURIComponent(unitId)}&ref=${encodeURIComponent(canonical)}&mode=understanding">Estudiar</a>`
   : '';

 const studied=window.StudentStore
   ? `<button id="markPassageStudied" class="button secondary" type="button">Marcar pasaje como estudiado</button>`
   : '';

 const currentSection=journalSectionTitle(
   book?.sections?.[sectionIndex]?.title||''
 );

 const journalParams=new URLSearchParams({
   book:bookId||'',
   bookTitle:journalBookTitle(book?.title||meta?.title||''),
   section:currentSection,
   ref:canonical
 });

 if(programId)journalParams.set('program',programId);
 if(unitId)journalParams.set('unit',unitId);

 const journal=`<button id="openStudyJournal" class="button secondary" type="button">Abrir Diario ↗</button>`;

 host.innerHTML=`<div class="reader-actions" style="margin:10px 0 18px">${study}${journal}${studied}<span id="studyProgressMessage" class="small"></span></div>`;

 const openJournal=document.getElementById('openStudyJournal');

 if(openJournal){
   openJournal.onclick=()=>{
     const journalUrl='../student/journal.html?'+journalParams.toString();

     const journalWindow=window.open(
       journalUrl,
       '_blank',
       'popup=yes,width=760,height=900,left=20,top=20,resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no,status=no'
     );

     if(journalWindow){
       journalWindow.focus();
     }
   };
 }

 const mark=document.getElementById('markPassageStudied');

 if(mark){
   const already=StudentStore.get('reading',canonical)==='1';

   if(already){
     mark.textContent='✓ Pasaje estudiado';
   }

   mark.onclick=()=>{
     StudentStore.set('reading',canonical,'1');
     mark.textContent='✓ Pasaje estudiado';

     const message=document.getElementById('studyProgressMessage');
     if(message)message.textContent='Guardado en tu progreso de lectura.';
   };
 }
}

async function openVerse(i){verseIndex=i;let s=book.sections[sectionIndex],v=s.verses[i];[...el.verses.children].forEach((b,j)=>b.classList.toggle('active',j===i));let prev=neighbor(-1),next=neighbor(1),canonical=canonicalOf(v);
 renderStudyContext(canonical);
 if(window.StudyContext)StudyContext.write({program:programId,unit:unitId,canonical,book:bookId});
 // Comunicar al Diario de Estudio abierto el pasaje actual del lector.
 try{
   const journalChannel=new BroadcastChannel('academia-study-journal');
   journalChannel.postMessage({
     type:'reader-context',
     program:programId||'',
     unit:unitId||'',
     book:bookId||'',
     bookTitle:journalBookTitle(book?.title||meta?.title||''),
     section:journalSectionTitle(s?.title||''),
     canonical:canonical||''
   });
   journalChannel.close();
 }catch(e){}
 el.passage.innerHTML=`<div class="study-nav">${returnToQuestion()}<span>${prev?'<button id="prevVerse" class="button secondary">← Verso Anterior</button>':'<button class="button secondary" disabled>← Verso Anterior</button>'}</span>${programId&&unitId?`<a class="button secondary" href="../programs/${encodeURIComponent(programId)}/index.html#${encodeURIComponent(unitId)}">Volver a la Unidad de Estudio</a>`:''}<a class="button secondary" href="../programs/${encodeURIComponent(programId||'bhakti-sastri')}/index.html">↑ Área de Estudio</a><a class="button secondary" href="../index.html">Inicio de la Academia</a>${SourceResolver.external(canonical)?`<a class="button secondary" href="${SourceResolver.external(canonical)}" target="_blank" rel="noopener">Vedabase ↗</a>`:''}${/^BG\.\d+\.\d+$/.test(canonical)?`<a class="button secondary" href="https://vanipedia.org/wiki/ES/${canonical.replaceAll('.', '_')}" target="_blank" rel="noopener">Vanipedia ↗</a>`:''}<span>${next?'<button id="nextVerse" class="button secondary">Verso Siguiente →</button>':'<button class="button secondary" disabled>Verso Siguiente →</button>'}</span></div><div class="eyebrow">Fuente Interna de la Academia</div><h2>${esc(canonical)}</h2>${v.source_text?`<h3>Texto Fuente</h3><div class="scripture source-linkable">${esc(v.source_text)}</div>`:''}${v.devanagari?`<h3>Texto</h3><div class="scripture">${esc(v.devanagari)}</div>`:''}${v.transliteration?`<h3>Transliteración</h3><div class="scripture">${esc(v.transliteration)}</div>`:''}${v.synonyms?`<h3>Palabra por Palabra</h3><div class="purport source-linkable">${esc(v.synonyms).replace(/\n/g,' ')}</div>`:''}${v.translation?`<h3>Traducción</h3><div class="purport source-linkable">${esc(v.translation)}</div>`:''}${v.purport?`<h3>${/Bhaktivedanta Swami Prabhup/i.test(book.creator||'')?"Significado de Śrīla Prabhupāda":'Significado'}</h3><div class="purport source-linkable">${esc(v.purport).replace(/\n/g,' ')}</div>`:''}${v.content?`<div class="purport source-linkable">${esc(v.content)}</div>`:''}`;
 document.querySelector('#prevVerse')?.addEventListener('click',()=>jump(prev));document.querySelector('#nextVerse')?.addEventListener('click',()=>jump(next));
 await SourceResolver.linkify(el.passage);
 if(window.AcademyHighlighter)AcademyHighlighter.attach(el.passage,canonical);
 const keep=new URLSearchParams({book:bookId,ref:canonical});if(programId)keep.set('program',programId);if(unitId)keep.set('unit',unitId);history.replaceState(null,'',`reader.html?${keep.toString()}`);
}
load();
