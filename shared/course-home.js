(function(global){
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const params=o=>{const p=new URLSearchParams();Object.entries(o).forEach(([k,v])=>{if(v)p.set(k,v)});return p.toString()};

  function readerHref(program,{book,ref,unit}={}){
    const canonical=String(ref||'');
    const b=String(book||'').toLowerCase();

    if(program==='bhakti-sastri' && (b==='bg'||/^BG[. ]/i.test(canonical))){
      return `bg-1-6.html?ref=${encodeURIComponent(canonical)}`;
    }

    if((program==='bhakti-vaibhava'||program==='bhakti-vedanta') &&
       (b.startsWith('sb')||/^SB[. ]/i.test(canonical))){
      return `sb.html?ref=${encodeURIComponent(canonical)}${unit?`&unit=${encodeURIComponent(unit)}`:''}`;
    }

    if(program==='bhakti-sarvabhauma' &&
       (b.startsWith('cc')||/^CC[. ]/i.test(canonical))){
      return `cc.html?ref=${encodeURIComponent(canonical)}${unit?`&unit=${encodeURIComponent(unit)}`:''}`;
    }

    return `../../library/reader.html?${params({book,ref:canonical,program,unit})}`;
  }

  function lessonCard(program,course,l){
    const read=readerHref(program,{
      book:l.book,
      ref:l.firstRef,
      unit:l.unitId
    });
    return `<article class="lesson-card"><div class="lesson-number">Lección ${l.order}</div><h4>${esc(l.title)}</h4><p class="small"><strong>${esc(l.firstRef)}</strong>${l.lastRef&&l.lastRef!==l.firstRef?' → '+esc(l.lastRef):''} · ${l.recordCount} pasaje${l.recordCount===1?'':'s'}</p><div class="lesson-actions"><a class="button" href="${read}">Abrir Lección</a></div></article>`;
  }
  async function init({programId,dataBase='data/'}){
    sidebar(programId);
    const course=await BhaktiProgramData.loadCourse(dataBase), units=course.units||[], lessons=course.lessons?.lessons||course.lessons||[];
    document.querySelector('#courseTitle').textContent=course.title||programId;


    const meta=document.querySelector('#courseMeta');
    meta.textContent=`${units.length} unidades de estudio · ${lessons.length} lecciones`;
    const host=document.querySelector('#lessonOutline');
    host.innerHTML=units.map((u,ui)=>{
      const ls=lessons.filter(l=>l.unitId===u.id);
      const first=ls[0];
      const continueHref=first
        ? readerHref(programId,{book:first.book,ref:first.firstRef,unit:u.id})
        : `tools.html?${params({unit:u.id,mode:'read'})}`;
      const groups=[];
      const multiBook=Array.isArray(u.books) && u.books.length>1;
      const bookLabels={
        iso:'Śrī Īśopaniṣad',
        noi:'El Néctar de la Instrucción'
      };
      ls.forEach(l=>{
        const ref=String(l.firstRef||'');
        const bg=ref.match(/^BG[. ](\d+)/i);
        const sb=ref.match(/^SB[. ]\d+[. ](\d+)/i);
        const cc=ref.match(/^CC[. ](?:ADI|MADHYA|ANTYA)[. ](\d+)/i);
        const nod=ref.match(/^NOD[. ](\d+)/i);
        const chapter=bg?bg[1]:sb?sb[1]:cc?cc[1]:nod?nod[1]:'Otro';
        const book=String(l.book||'').toLowerCase();
        const key=multiBook?book:chapter;
        const label=multiBook?(bookLabels[book]||book.toUpperCase()):`Capítulo ${chapter}`;
        let g=groups.find(x=>x.key===key);
        if(!g){g={key,label,lessons:[]};groups.push(g)}
        g.lessons.push(l);
      });

      // Preserve the shared Academy hierarchy for every standard course:
      // Unit → Chapter/Book → Lessons. Multi-book units group by book.
      const useChapterGroups=groups.length>0;
      const chapterContent=useChapterGroups
        ? `<div class="chapter-groups">${groups.map(g=>`
            <section class="chapter-group">
              <button class="chapter-toggle" type="button" aria-expanded="false">
                <span><strong>${esc(g.label)}</strong><small>${g.lessons.length} lección${g.lessons.length===1?'':'es'}</small></span>
                <span class="chapter-chevron">⌄</span>
              </button>
              <div class="chapter-lessons" hidden>
                <div class="lesson-grid">${g.lessons.map(l=>lessonCard(programId,course,l)).join('')}</div>
              </div>
            </section>`).join('')}</div>`
        : `<div class="lesson-grid">${ls.map(l=>lessonCard(programId,course,l)).join('')||'<div class="notice">El esquema de lecciones aún no está configurado para esta unidad.</div>'}</div>`;

      return `<section class="course-unit" id="${esc(u.id)}"><button class="unit-toggle" type="button" aria-expanded="false"><span><span class="eyebrow">${esc(u.id)}</span><strong>${esc(u.title)}</strong><small>${esc(u.range||'')} · ${ls.length} lecciones</small></span><span class="unit-chevron">⌄</span></button><div class="unit-lessons" hidden><div class="unit-intro"><p>Sigue las lecciones en orden o abre cualquier lección directamente. Cada lección te conecta con su lectura primaria asignada.</p><a class="button saffron" href="${continueHref}">Comenzar Unidad</a> ${StudyWorkflow.buttons(course,{program:programId,unit:u.id})}</div>${chapterContent}</div></section>`;
    }).join('');
    host.addEventListener('click',e=>{
      const chapter=e.target.closest('.chapter-toggle');
      if(chapter){
        const panel=chapter.nextElementSibling;
        const open=panel.hidden;
        chapter.closest('.chapter-groups').querySelectorAll('.chapter-toggle').forEach(b=>{
          b.setAttribute('aria-expanded','false');
          b.nextElementSibling.hidden=true;
        });
        if(open){
          panel.hidden=false;
          chapter.setAttribute('aria-expanded','true');
        }
        return;
      }

      const b=e.target.closest('.unit-toggle');
      if(!b)return;
      const panel=b.nextElementSibling;
      const open=panel.hidden;

      host.querySelectorAll('.unit-toggle').forEach(x=>{
        x.setAttribute('aria-expanded','false');
        x.nextElementSibling.hidden=true;
      });

      if(open){
        panel.hidden=false;
        b.setAttribute('aria-expanded','true');
      }
    });
    const referencesHost=document.querySelector('#courseReferences');
    if(referencesHost && global.ReferenceRegistry){
      const resources=await global.ReferenceRegistry.official(programId);

      if(resources.length){
        referencesHost.innerHTML=`<div class="card"><div class="eyebrow">Recursos Oficiales</div><h2>Referencias y Recursos</h2><p class="small">Los recursos suplementarios y oficiales permanecen separados de las escrituras canónicas de la Academia, las preguntas de estudio, el progreso y los requisitos de finalización de la Academia.</p>${resources.map(r=>`<p><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer"><strong>${esc(r.title)}</strong></a>${r.purpose?`<br><span class="small">${esc(r.purpose)}</span>`:''}${r.provenance?`<br><span class="small">Fuente: ${esc(r.provenance)}</span>`:''}</p>`).join('')}</div>`;
      }else{
        referencesHost.innerHTML='';
      }
    }

    const first=lessons[0];
  const continueStudy=document.querySelector('#continueStudy');

  if(continueStudy && !document.querySelector('#studyGuidesLink')){
    const link=document.createElement('a');
    link.id='studyGuidesLink';
    link.className='button secondary';
    link.href='study-guides.html';
    link.textContent='Guías de Estudio';
    continueStudy.parentElement.appendChild(link);
  }

  const saved=global.StudyContext?.read?.(programId);

  if(continueStudy){
    if(saved?.unit && saved?.canonical && saved?.mode){
      continueStudy.href=`tools.html?${params({
        unit:saved.unit,
        mode:saved.mode,
        ref:saved.canonical
      })}`;
    }else if(saved?.unit && saved?.canonical){
      continueStudy.href=readerHref(programId,{
        book:saved.book,
        ref:saved.canonical,
        unit:saved.unit
      });
    }else if(first){
      continueStudy.href=readerHref(programId,{
        book:first.book,
        ref:first.firstRef,
        unit:first.unitId
      });
    }
  }
  }
  global.CourseHome={init};
})(window);
