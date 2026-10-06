(function(){
  const cleanText=s=>String(s??'').replace(/\\n/g,'\n');
  const esc=s=>cleanText(s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  const work=window.SANDARBHA_WORK;
  const ROOT='../../../';
  const prefixes={tattva:'TS',bhagavat:'BGS',paramatma:'PAS',krsna:'KS',bhakti:'BHS',priti:'PS'};
  const legacyKey=id=>`bhakti:sandarbha:${work}:${id}`;
  const loadScript=(src,ready)=>new Promise((ok,fail)=>{if(ready?.())return ok();const existing=[...document.scripts].find(s=>s.src&&new URL(s.src,location.href).href===new URL(src,location.href).href);if(existing){if(ready?.())return ok();existing.addEventListener('load',ok,{once:true});existing.addEventListener('error',fail,{once:true});return}const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=fail;document.head.appendChild(s)});
  const readJSON=async url=>{const r=await fetch(url);if(!r.ok)throw new Error(`${r.status} ${url}`);return r.json()};
  function storeGet(type,id,fallback=''){
    if(window.StudentStore)return StudentStore.get(type,id,fallback);
    const v=localStorage.getItem(`bhakti-study.student.v1.${type}.${id}`);return v===null?fallback:v;
  }
  function storeSet(type,id,value){
    if(window.StudentStore)return StudentStore.set(type,id,value);
    localStorage.setItem(`bhakti-study.student.v1.${type}.${id}`,String(value??''));
  }
  function migrateLegacy(id){
    const old=localStorage.getItem(legacyKey(id));if(!old)return;
    try{const d=JSON.parse(old);if(d.initialUnderstanding&&!storeGet('understanding',id,''))storeSet('understanding',id,d.initialUnderstanding);if(d.revisedUnderstanding&&!storeGet('reflection',id,''))storeSet('reflection',id,d.revisedUnderstanding);if(d.completed)storeSet('completion',`sat-sandarbhas.${id}`,'1')}catch{}
  }
  function canonicalNumber(id){const m=String(id||'').match(/\.(\d+)$/);return m?+m[1]:0}
  async function init(){
    if(!work)throw new Error('Missing SANDARBHA_WORK');
    await Promise.all([
      loadScript(ROOT+'shared/app.js',()=>typeof window.sidebar==='function').catch(()=>{}),
      loadScript(ROOT+'shared/student-store.js',()=>!!window.StudentStore).catch(()=>{}),
      loadScript(ROOT+'shared/highlighter.js',()=>!!window.AcademyHighlighter).catch(()=>{}),
      loadScript(ROOT+'shared/data-registry.js',()=>!!window.DataRegistry),
      loadScript(ROOT+'shared/question-engine.js',()=>!!window.QuestionEngine)
    ]);
    await loadScript(ROOT+'shared/question-management-ui.js',()=>!!window.QuestionManagementUI);
    await loadScript(ROOT+'shared/vendor/jszip/jszip.min.js',()=>!!window.JSZip).catch(()=>{});
    await loadScript(ROOT+'shared/question-sheet-importer.js',()=>!!window.QuestionSheetImporter);
    await loadScript(ROOT+'shared/student-questions.js',()=>!!window.StudentQuestions);
    await loadScript(ROOT+'shared/internal-source-search.js',()=>!!window.InternalSourceSearch);
    await loadScript(ROOT+'shared/my-questions-ui.js',()=>!!window.MyQuestionsUI);
    if(!document.querySelector('.sidebar')){
      const layout=document.createElement('div');layout.className='layout';
      const side=document.createElement('aside');side.className='sidebar';
      const main=document.createElement('main');main.className='main';
      const movable=[...document.body.children].filter(el=>el.tagName!=='SCRIPT');
      movable.forEach(el=>main.appendChild(el));
      layout.append(side,main);document.body.prepend(layout);
    }
    if(typeof window.sidebar==='function')window.sidebar('sat-sandarbhas',ROOT);
    const [course,englishSource,spanishSource,registry]=await Promise.all([
      readJSON('course.json'),
      readJSON(`${ROOT}sandarbhas/sources/english-reader/${work}.json`),
      readJSON(`${ROOT}sandarbhas/sources/spanish-reader/${work}.json`).catch(()=>null),
      readJSON(`${ROOT}sandarbhas/english-source-registry.json`).catch(()=>({works:[]}))
    ]);
    const source=englishSource;
    document.documentElement.lang='es';document.title=course.title;
    const title=document.getElementById('courseTitle');if(title)title.textContent=course.displayTitle||course.title;
    const intro=document.getElementById('courseIntro');if(intro)intro.textContent=`${source.unitCount} unidades canónicas de anuccheda · estudio de la fuente · trabajo del estudiante almacenado por separado.`;
    const oldNotice=document.querySelector('.notice');if(oldNotice)oldNotice.innerHTML='<b>Método:</b> Viṣaya → Saṁśaya → Pūrvapakṣa → Siddhānta → Pramāṇa → Samanvaya → Aplicación. El texto fuente y la síntesis del estudiante permanecen visiblemente separados.';
    const app=document.getElementById('app');
    if(!document.getElementById('sandarbha-reader-layout')){const style=document.createElement('style');style.id='sandarbha-reader-layout';style.textContent=`
.sandarbha-reader-shell{display:grid;grid-template-columns:250px minmax(0,1fr);gap:1rem;align-items:start}
.sandarbha-nav-panel{position:sticky;top:1rem;min-width:0}
.sandarbha-nav-panel .unit-list{display:flex;gap:.45rem;flex-wrap:wrap;max-height:58vh;overflow:auto}
.sandarbha-nav-panel .unit-list button{border:1px solid #d8d0c2;background:#fff;border-radius:8px;padding:7px 9px;cursor:pointer}
.sandarbha-nav-panel .unit-list button.active{font-weight:700;border-color:#f59e0b}
.sandarbha-nav-toggle{display:block;margin:0 0 .7rem auto;min-width:36px;padding:5px 10px;font-size:1.2rem;line-height:1}
.sandarbha-reader-shell.nav-collapsed{grid-template-columns:52px minmax(0,1fr)}
.sandarbha-reader-shell.nav-collapsed>.sandarbha-nav-panel{padding:8px 6px;overflow:hidden}
.sandarbha-reader-shell.nav-collapsed>.sandarbha-nav-panel>*:not(.sandarbha-nav-toggle){display:none!important}
.sandarbha-reader-shell.nav-collapsed>.sandarbha-nav-panel .sandarbha-nav-toggle{margin:0 auto}
.sandarbha-source-column{min-width:0}.sandarbha-study-panel{display:none;position:fixed;z-index:10002;right:1rem;top:1rem;bottom:1rem;width:min(420px,calc(100vw - 2rem));max-height:calc(100vh - 2rem);overflow:auto;margin:0}.sandarbha-study-panel.open{display:block}
.sandarbha-study-panel textarea{width:100%;box-sizing:border-box}.sandarbha-study-fab{display:block;position:fixed;z-index:10001;right:1rem;bottom:1rem;box-shadow:0 4px 18px rgba(0,0,0,.2)}.study-close{display:block;float:right;border:0;background:transparent;font-size:2rem;line-height:1;cursor:pointer}
.sandarbha-passage-nav{display:flex;gap:.6rem;flex-wrap:wrap;align-items:center;margin-bottom:1rem}
@media(max-width:1200px){.sandarbha-reader-shell{grid-template-columns:220px minmax(0,1fr)}.sandarbha-study-panel{display:none;position:fixed;z-index:10002;inset:auto 0 0 0;top:12vh;max-height:88vh;overflow:auto;border-radius:18px 18px 0 0;margin:0}.sandarbha-study-panel.open{display:block}.sandarbha-study-fab{display:block;position:fixed;z-index:10001;right:1rem;bottom:1rem;box-shadow:0 4px 18px rgba(0,0,0,.2)}.study-close{display:block;float:right;border:0;background:transparent;font-size:2rem;line-height:1;cursor:pointer}.sandarbha-reader-shell.nav-collapsed{grid-template-columns:52px minmax(0,1fr)}}
@media(max-width:850px){.sandarbha-reader-shell,.sandarbha-reader-shell.nav-collapsed{grid-template-columns:1fr}.sandarbha-nav-panel{position:static}.sandarbha-reader-shell.nav-collapsed>.sandarbha-nav-panel{display:none}}
`;document.head.appendChild(style)}
    const sourceByNum=new Map(englishSource.records.map(r=>[r.number,r]));
    const spanishByNum=new Map((spanishSource?.records||[]).map(r=>[r.number,r]));
    const units=course.units||[];
    let selected=Math.max(1,Math.min(source.unitCount,+new URLSearchParams(location.search).get('n')||1));
    function unitFor(n){return units.find(u=>canonicalNumber(u.id)===n)||units[n-1]||{id:`${prefixes[work]}.${n}`,number:n,studyMethod:{advancedLens:[],beforeReading:['¿Qué está estableciendo Jīva Gosvāmī aquí?'],sourceStudy:['Read the source carefully and identify the claim and evidence.'],afterReading:['Expresa el siddhānta con tus propias palabras y cita la fuente que lo respalda.']}}}
    function importedFor(canonical,unit){
      if(!window.QuestionSheetImporter?.list)return [];
      return QuestionSheetImporter.list('sat-sandarbhas').filter(q=>q.canonical_ref===canonical||q.unit===unit);
    }
    function renderImportedQuestions(canonical,unit){
      const host=document.getElementById('sandarbhaImportedQuestions');if(!host)return;
      const items=importedFor(canonical,unit);
      if(!items.length){host.innerHTML='';return}
      host.innerHTML='<h4>Preguntas Importadas</h4><div id="sandarbhaImportedQuestionList"></div>';
      const list=host.querySelector('#sandarbhaImportedQuestionList');
      QuestionManagementUI.render(list,{program:'sat-sandarbhas',unit,scope:canonical,questions:items,bank:{id:'student-import',label:'Preguntas Importadas',description:'Preguntas importadas por el estudiante conservando la procedencia de la fuente.'}});
      const save=list.querySelector('#saveQuestions');
      if(save)save.onclick=()=>{list.querySelectorAll('.qanswer').forEach(el=>QuestionEngine.save('sat-sandarbhas',canonical,el.dataset.qid,el.value));QuestionManagementUI.clearAnswerDrafts?.(list,{program:'sat-sandarbhas',scope:canonical})};
    }
    function renderQuestionImporter(canonical,unit){
      const host=document.getElementById('sandarbhaQuestionImporter');if(!host||!window.QuestionSheetImporter)return;
      QuestionSheetImporter.render(host,{program:'sat-sandarbhas',unit,canonical,onImported:()=>render()});
    }
    function renderMyQuestions(canonical,unit){
      const host=document.getElementById('sandarbhaMyQuestions');if(!host||!window.MyQuestionsUI)return;
      MyQuestionsUI.render(host,{program:'sat-sandarbhas',unit,canonical,bookIds:[]});
    }
    function sourceFor(n){
      const spanishExact=spanishByNum.get(n);

      if(spanishExact?.sourceHeadingVerified&&spanishExact?.content?.trim()){
        return {
          ...spanishExact,
          sharedSource:false,
          sourceLanguage:'es'
        };
      }

      const spanishShared=(spanishSource?.sharedSegments||[]).find(s=>
        s?.sourceHeadingVerified &&
        s?.content?.trim() &&
        Array.isArray(s.canonicalNumbers) &&
        s.canonicalNumbers.includes(n)
      );

      if(spanishShared){
        return {
          ...spanishShared,
          number:n,
          canonicalId:`${prefixes[work]}.${n}`,
          sharedSource:true,
          sourceLanguage:'es'
        };
      }

      const englishExact=sourceByNum.get(n);

      if(englishExact?.sourceHeadingVerified&&englishExact?.content){
        return {
          ...englishExact,
          sharedSource:false,
          sourceLanguage:'en'
        };
      }

      const englishShared=(englishSource.sharedSegments||[]).find(s=>
        s?.sourceHeadingVerified &&
        s?.content &&
        Array.isArray(s.canonicalNumbers) &&
        s.canonicalNumbers.includes(n)
      );

      if(englishShared){
        return {
          ...englishShared,
          number:n,
          canonicalId:`${prefixes[work]}.${n}`,
          sharedSource:true,
          sourceLanguage:'en'
        };
      }

      return englishExact
        ? {...englishExact,sourceLanguage:'en'}
        : spanishExact
          ? {...spanishExact,sourceLanguage:'es'}
          : null;
    }
    function render(){
      const r=sourceFor(selected),u=unitFor(selected),id=u.id||`${prefixes[work]}.${selected}`;migrateLegacy(id);
      const verified=!!r?.sourceHeadingVerified&&!!r?.content;
      const draftKey=`bhakti-study:sandarbha-draft:${id}`;
      let draft={};try{draft=JSON.parse(sessionStorage.getItem(draftKey)||'{}')}catch{}
      const before=draft.understanding??storeGet('understanding',id,''),after=draft.reflection??storeGet('reflection',id,''),notes=draft.notes??storeGet('notes',`sat-sandarbhas.${id}`,''),done=storeGet('completion',`sat-sandarbhas.${id}`,'')==='1';
      const lens=u.studyMethod?.advancedLens||[];
      app.innerHTML=`<div class="sandarbha-reader-shell" id="sandarbhaReaderShell">
<aside class="sandarbha-nav-panel card">
<button class="button secondary sandarbha-nav-toggle" id="sandarbhaNavToggle" type="button" aria-label="Contraer navegación de unidades canónicas">‹</button>
<div class="eyebrow">${esc(course.title)} · Navegación</div>
<h2>Anucchedas</h2>
<label>Unidad canónica <select id="unitSelect">${Array.from({length:source.unitCount},(_,i)=>`<option value="${i+1}" ${i+1===selected?'selected':''}>${esc(prefixes[work])}.${i+1}</option>`).join('')}</select></label>
<div class="unit-list" id="sandarbhaUnitList">${Array.from({length:source.unitCount},(_,i)=>`<button type="button" data-unit="${i+1}" class="${i+1===selected?'active':''}">${i+1}</button>`).join('')}</div>
</aside>
<main class="sandarbha-source-column">
<section class="card">
<div class="eyebrow">${esc(course.title)} · Lector de la Fuente</div>
<div class="sandarbha-passage-nav"><button class="button secondary" id="prev" ${selected<=1?'disabled':''}>← Anterior</button><button class="button secondary" id="next" ${selected>=source.unitCount?'disabled':''}>Siguiente →</button></div>
<h2>${esc(id)} · ${esc(r?.sourceLabel||`Anuccheda ${selected}`)}</h2>
${verified?'<span class="source-state verified">Segmento de la fuente verificado</span>':'<p class="notice"><b>Identidad canónica preservada.</b> Esta edición no presenta un límite de encabezamiento verificado independientemente para esta unidad, por lo que Bhakti Study no inventa un segmento de la fuente.</p>'}
${lens.length?`<div class="lens">${lens.map(x=>`<span>${esc(x)}</span>`).join('')}</div>`:''}
</section>
${verified?`<section class="card"><div class="eyebrow">Fuente Primaria de Estudio</div><h2>Texto Fuente</h2><p class="muted">${esc(r.sourceLanguage==='es'?'Traducción española':'Fuente inglesa de respaldo')} · ${esc(id)}</p><div id="sandarbhaSourceText" style="line-height:1.65">${esc(r.content).replace(/\n/g,' ')}</div></section>`:''}
<section class="card"><div class="eyebrow">Procedencia</div><p><b>Autor:</b> Śrī Jīva Gosvāmī</p><p><b>Idioma mostrado:</b> ${r?.sourceLanguage==='es'?'Español':'Inglés (respaldo temporal)'}</p><p><b>Fuente inglesa preservada:</b> ${esc(englishSource.sourceFile||'Fuente inglesa canónica')}</p><p><b>Identidad canónica:</b> ${esc(id)}</p><p><b>Segmentación:</b> ${verified?(r?.sharedSource?'Segmento compartido de la fuente verificado; la identidad canónica del estudiante permanece separada.':'Encabezamiento/límite de la fuente detectado independientemente.'):'Solo marcador canónico; no se ha supuesto ningún límite de la fuente.'}</p><p class="muted">Las reflexiones y resúmenes de Bhakti Study son síntesis del estudiante y de aplicación; no son citas de la fuente.</p></section>
</main>
<aside class="sandarbha-study-panel card" id="studyPanel"><button class="study-close" id="studyClose" aria-label="Cerrar panel de estudio">×</button><div class="eyebrow">Espacio de Estudio</div><h2>Estudio</h2><h3>Mi Comprensión</h3><p>${esc(u.studyMethod?.beforeReading?.[0]||'¿Qué está estableciendo Jīva Gosvāmī aquí?')}</p><textarea id="understanding" rows="6" placeholder="Escribe tu comprensión antes de consultar notas adicionales…">${esc(before)}</textarea><h3>Estudio de la Fuente</h3><ul>${(u.studyMethod?.sourceStudy||['Identifica la afirmación principal, la evidencia de las escrituras y la conclusión.']).map(x=>`<li>${esc(x)}</li>`).join('')}</ul><h3>Comprensión Revisada</h3><p>${esc(u.studyMethod?.afterReading?.[0]||'Expresa el siddhānta con tus propias palabras y cita la fuente que lo respalda.')}</p><textarea id="reflection" rows="6" placeholder="Después de volver a la fuente…">${esc(after)}</textarea><h3>Notas</h3><textarea id="notes" rows="6" placeholder="Notas personales…">${esc(notes)}</textarea>
<h3>Preguntas de Estudio</h3>
<div id="sandarbhaQuestions"><p class="muted">Cargando banco de preguntas…</p></div><div id="sandarbhaMyQuestions" style="margin-top:1rem"></div><div style="display:flex;gap:.75rem;align-items:center;margin-top:1rem;flex-wrap:wrap"><button class="button" id="saveStudy" type="button">Guardar</button><span id="saveStatus" class="muted" role="status" aria-live="polite">${Object.keys(draft).length?'Borrador no guardado':'Guardado'}</span></div><label style="display:block;margin-top:1rem"><input type="checkbox" id="completed" ${done?'checked':''}> Unidad de estudio completada</label></aside>
</div><button class="button sandarbha-study-fab" id="studyOpen" aria-controls="studyPanel">Estudiar</button>`
      const highlightSource=document.getElementById('sandarbhaSourceText');
      if(highlightSource&&window.AcademyHighlighter)AcademyHighlighter.attach(highlightSource,id);
      renderMyQuestions(id,u.id);
      const questionHost=document.getElementById('sandarbhaQuestions');
      if(questionHost){
        (async()=>{
          const dataBase=`../${work}/`;
          let banks=[];
          try{
            banks=await DataRegistry.questionBanks(dataBase);
          }catch(err){
            banks=[];
          }

          if(!banks.length){
            questionHost.innerHTML='<div class="notice">No hay un banco de preguntas verificado registrado para este Sandarbha. Aun así, puedes importar abajo tu propia hoja de preguntas con atribución.</div><div id="sandarbhaImportedQuestions"></div><div id="sandarbhaQuestionImporter"></div>';
            renderImportedQuestions(id,u.id);
            renderQuestionImporter(id,u.id);
            return;
          }

          const requestedBank=new URLSearchParams(location.search).get('bank');
          const activeBank=(requestedBank&&banks.find(b=>b.id===requestedBank))||banks.find(b=>b.default)||banks[0];
          const scopes=QuestionEngine.scopes(id,u.id);
          let loaded=[];

          try{
            loaded=await DataRegistry.questionShards(dataBase,scopes,activeBank.id);
          }catch(err){
            loaded=[];
          }

          const clean=QuestionEngine.dedupe(
            QuestionEngine.relevant(loaded,id,u.id)
          ).items;

          questionHost.innerHTML=`<div style="margin:0 0 1rem">
            <label class="small" for="sandarbhaQuestionBank"><strong>Banco de Preguntas</strong></label>
            <select id="sandarbhaQuestionBank" class="field">
              ${banks.map(b=>`<option value="${esc(b.id)}"${b.id===activeBank.id?' selected':''}>${esc(b.label||b.id)}</option>`).join('')}
            </select>
            ${activeBank.description?`<p class="small">${esc(activeBank.description)}</p>`:''}
          </div><div id="sandarbhaQuestionList"></div><div id="sandarbhaImportedQuestions"></div><div id="sandarbhaQuestionImporter"></div><p id="sandarbhaQuestionMsg" class="small"></p>`;

          const list=document.getElementById('sandarbhaQuestionList');

          if(clean.length){
            QuestionManagementUI.render(list,{
              program:'sat-sandarbhas',
              unit:id,
              scope:id,
              questions:clean,
              bank:activeBank
            });

            const save=list.querySelector('#saveQuestions');
            if(save)save.onclick=()=>{
              list.querySelectorAll('.qanswer').forEach(el=>
                QuestionEngine.save('sat-sandarbhas',id,el.dataset.qid,el.value)
              );
              const msg=document.getElementById('sandarbhaQuestionMsg');
              if(msg)msg.textContent='Respuestas guardadas en este navegador.';
            };
          }else{
            list.innerHTML=`<div class="notice">Este banco de preguntas está registrado, pero aún no hay preguntas verificadas vinculadas a <strong>${esc(id)}</strong> yet.</div>`;
          }

          const selector=document.getElementById('sandarbhaQuestionBank');
          if(selector)selector.onchange=()=>{
            const next=new URL(location.href);
            next.searchParams.set('bank',selector.value);
            location.href=next.toString();
          };
          renderImportedQuestions(id,u.id);
          renderQuestionImporter(id,u.id);
        })().catch(err=>{
          questionHost.innerHTML=`<div class="notice">Módulo de preguntas no disponible: ${esc(err.message)}</div>`;
        });
      }

      const panel=document.getElementById('studyPanel');document.getElementById('studyOpen')?.addEventListener('click',()=>panel?.classList.add('open'));document.getElementById('studyClose')?.addEventListener('click',()=>panel?.classList.remove('open'));
      const fields=['understanding','reflection','notes'];
      const saveStatus=document.getElementById('saveStatus');
      const captureDraft=()=>{const d={};fields.forEach(f=>d[f]=document.getElementById(f)?.value||'');sessionStorage.setItem(draftKey,JSON.stringify(d));if(saveStatus)saveStatus.textContent='Cambios no guardados';};
      fields.forEach(f=>document.getElementById(f)?.addEventListener('input',captureDraft));
      document.getElementById('saveStudy')?.addEventListener('click',()=>{
        storeSet('understanding',id,document.getElementById('understanding')?.value||'');
        storeSet('reflection',id,document.getElementById('reflection')?.value||'');
        storeSet('notes',`sat-sandarbhas.${id}`,document.getElementById('notes')?.value||'');
        sessionStorage.removeItem(draftKey);
        if(saveStatus)saveStatus.textContent='Guardado ✓';
      });
      document.getElementById('completed')?.addEventListener('change',e=>storeSet('completion',`sat-sandarbhas.${id}`,e.target.checked?'1':'0'));
      const go=n=>{selected=n;const q=new URLSearchParams(location.search);q.set('n',n);history.replaceState(null,'','?'+q);render();scrollTo({top:0,behavior:'smooth'})};
      document.getElementById('prev')?.addEventListener('click',()=>go(selected-1));document.getElementById('next')?.addEventListener('click',()=>go(selected+1));document.getElementById('unitSelect')?.addEventListener('change',e=>go(+e.target.value));
      document.querySelectorAll('#sandarbhaUnitList [data-unit]').forEach(b=>b.addEventListener('click',()=>go(+b.dataset.unit)));
      const shell=document.getElementById('sandarbhaReaderShell'),navToggle=document.getElementById('sandarbhaNavToggle'),navKey='bhakti-study:reader-nav-collapsed';
      let navCollapsed=false;try{navCollapsed=localStorage.getItem(navKey)==='1'}catch{}
      const setNav=v=>{shell?.classList.toggle('nav-collapsed',v);if(navToggle){navToggle.textContent=v?'A ›':'‹ Anucchedas';navToggle.title=v?'Expandir Anucchedas':'Contraer Anucchedas';navToggle.setAttribute('aria-label',v?'Expandir Anucchedas':'Contraer Anucchedas');navToggle.setAttribute('aria-expanded',String(!v))}try{localStorage.setItem(navKey,v?'1':'0')}catch{}};
      setNav(navCollapsed);navToggle?.addEventListener('click',()=>setNav(!shell?.classList.contains('nav-collapsed')));
    }
    render();
    const refBox=document.getElementById('references');
    if(refBox && window.ReferenceRegistry){
      try{
        const references=await window.ReferenceRegistry.sandarbha(id);

        if(references.length){
          refBox.innerHTML=`<div class="card"><div class="eyebrow">Estudio Adicional</div><h2>Referencias y Recursos</h2>${references.map(r=>`<p>${r.url?`<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer"><strong>${esc(r.title)}</strong></a>`:`<strong>${esc(r.title)}</strong>`}${r.author?`<br><span class="small">Autor: ${esc(r.author)}</span>`:''}${r.source?`<br><span class="small">Fuente: ${esc(r.source)}</span>`:''}${r.purpose?`<br><span class="small">${esc(r.purpose)}</span>`:''}</p>`).join('')}</div>`;
        }else{
          refBox.innerHTML='';
        }
      }catch(err){
        refBox.innerHTML='';
        console.warn('Sandarbha references unavailable:',err);
      }
    }
  }
  init().catch(err=>{const app=document.getElementById('app');if(app)app.innerHTML=`<p class="notice"><b>Error del lector de Sandarbha:</b> ${esc(err.message)}</p>`;console.error(err)});
})();
