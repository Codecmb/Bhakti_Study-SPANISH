(function(global){
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const BOOK_ALIAS={'sb-1':'sb1','sb-2':'sb2','sb-3':'sb3','sb-4':'sb4','sb-5':'sb5','sb-6':'sb6','sb-7':'sb7','sb-8':'sb8','sb-9':'sb9','sb-10':'sb10','sb-11':'sb11','sb-12':'sb12'};
  function sourceBookHref(unit,canonical,lesson){
    if(canonical)return null;
    const book=lesson?.book||BOOK_ALIAS[unit.book]||unit.book||(unit.books||[])[0];
    if(!book)return null;
    const q=new URLSearchParams({book}); if(lesson?.firstRef)q.set('ref',lesson.firstRef);
    return `../../library/reader.html?${q}`;
  }
  async function init(opts){
    const {programId,dataBase='data/',programHref='index.html'}=opts;
    const q=new URLSearchParams(location.search),mode=q.get('mode')||'understanding',ref=q.get('ref')||'';
    const course=await BhaktiProgramData.loadCourse(dataBase),units=course.units||[];
    const uid=q.get('unit')||units[0]?.id||'',unit=units.find(x=>x.id===uid)||units[0];
    if(!unit)throw new Error('This program has no configured study units.');
    const lesson=(course.lessons?.lessons||course.lessons||[]).find(x=>x.unitId===unit.id);
    const canonical=ref&&(SourceResolver?.canon?.(ref)||ref);
    if(!StudyWorkflow.hasMode(course,mode)){
      const fallback=StudyWorkflow.tools(course).find(t=>t.mode)?.mode||'understanding';
      location.replace(`tools.html?unit=${encodeURIComponent(unit.id)}&mode=${encodeURIComponent(fallback)}${canonical?'&ref='+encodeURIComponent(canonical):''}`);return;
    }
    const ctx={program:programId,unit:unit.id,canonical,mode};
    const sourceTarget=canonical?await SourceResolver.resolve(canonical):null;
    const internalBook=sourceBookHref(unit,canonical,lesson);
    const sourceHref=sourceTarget?.href?(sourceTarget.href+(sourceTarget.kind==='internal'?`&program=${encodeURIComponent(programId)}&unit=${encodeURIComponent(unit.id)}`:'')):(internalBook?`${internalBook}&program=${encodeURIComponent(programId)}&unit=${encodeURIComponent(unit.id)}`:'');
    document.querySelector('#heading').textContent=unit.title;
    document.querySelector('#sub').textContent=`${course.title||programId} · ${unit.id}${canonical?' · '+canonical:''}`;
    document.querySelector('#workflowTabs').innerHTML=StudyWorkflow.tabs(course,ctx);
    const ix=units.findIndex(x=>x.id===unit.id),prev=units[ix-1],next=units[ix+1];
    document.querySelector('#unitNav').innerHTML=`${prev?`<a class="button secondary" href="tools.html?unit=${encodeURIComponent(prev.id)}&mode=${encodeURIComponent(mode)}">← Atrás</a>`:'<span></span>'}<a class="button secondary" href="${programHref}">↑ Área de Estudio</a>${next?`<a class="button secondary" href="tools.html?unit=${encodeURIComponent(next.id)}&mode=${encodeURIComponent(mode)}">Siguiente →</a>`:'<span></span>'}`;
    const content=document.querySelector('#content'),scope=canonical||unit.id,studentId=`${programId}.${scope}.${mode}`;
    const returnSource=sourceHref?`<a class="button secondary" href="${esc(sourceHref)}"${sourceTarget?.kind==='external'?' target="_blank" rel="noopener"':''}>Estudiar las Fuentes</a>`:'';
    if(mode==='read'){
      content.innerHTML=`<h2>Leer Fuente</h2><p><strong>${esc(unit.range||unit.title)}</strong></p><p>La Academia abre primero su fuente interna. Vedabase externo se utiliza únicamente cuando el pasaje canónico solicitado no está disponible internamente.</p>${sourceHref?`<a class="button" href="${esc(sourceHref)}"${sourceTarget?.kind==='external'?' target="_blank" rel="noopener"':''}>${sourceTarget?.kind==='external'?'Abrir fuente externa ↗':'Abrir fuente interna'}</a>`:'<p class="small">Aún no hay una ruta de fuente interna configurada para esta unidad.</p>'}`;
    }else if(mode==='understanding'){
      const old=`bhakti-study.${programId}.${scope}.${mode}`;StudentStore.migrate(old,mode,studentId);
      content.innerHTML=`<h2>Mi Comprensión</h2><p>Escribe primero, luego vuelve a la fuente primaria y revisa tu comprensión.</p><textarea id="entry" class="field" placeholder="¿Qué comprendo de esta unidad de estudio${canonical?' / '+esc(canonical):''}?"></textarea><button id="save" class="button lotus">Guardar Comprensión</button> <button id="clearWork" class="button secondary">Borrar</button> ${returnSource}<p id="msg" class="small"></p>`;
      entry.value=StudentStore.get(mode,studentId,'');
      const understandingDraft=global.StudentWorkDraft?.attach?.({
        id:studentId,
        field:entry,
        status:msg,
        onSave:value=>StudentStore.set(mode,studentId,value)
      });
      save.onclick=()=>understandingDraft
        ? understandingDraft.save()
        : (StudentStore.set(mode,studentId,entry.value),msg.textContent='Guardado en este navegador.');
      clearWork.onclick=()=>{
        if(global.StudentWorkDraft?.clearWork){
          StudentWorkDraft.clearWork({
            id:studentId,
            field:entry,
            status:msg,
            onClear:()=>StudentStore.remove(mode,studentId),
            message:'¿Borrar Mi Comprensión? Esta acción no se puede deshacer.'
          });
        }
      };
    }else if(mode==='notes'){
      content.innerHTML=`<h2>Notas</h2><p>Las notas permanecen independientes de los archivos de los libros y están vinculadas a ${canonical?'el pasaje canónico':'esta unidad de estudio'}.</p><textarea id="entry" class="field" placeholder="Notas de estudio"></textarea><button id="save" class="button">Guardar Notas</button> <button id="clearWork" class="button secondary">Borrar</button> ${returnSource}<p id="msg" class="small"></p>`;
      const notesId=`${programId}.${scope}`;
      entry.value=StudentStore.get('notes',notesId,'');
      const notesDraft=global.StudentWorkDraft?.attach?.({
        id:`notes.${notesId}`,
        field:entry,
        status:msg,
        onSave:value=>StudentStore.set('notes',notesId,value)
      });
      save.onclick=()=>notesDraft
        ? notesDraft.save()
        : (StudentStore.set('notes',notesId,entry.value),msg.textContent='Guardado en este navegador.');
      clearWork.onclick=()=>{
        if(global.StudentWorkDraft?.clearWork){
          StudentWorkDraft.clearWork({
            id:`notes.${notesId}`,
            field:entry,
            status:msg,
            onClear:()=>StudentStore.remove('notes',notesId),
            message:'¿Borrar estas notas? Esta acción no se puede deshacer.'
          });
        }
      };
    }else if(mode==='assessment'){
      const rules=course['completion-rules']?.academyUnitCompletion;
      if(!rules?.enabled){content.innerHTML=`<h2>Evaluación</h2><div class="notice">Los requisitos de finalización de la Academia para esta área de estudio aún no han sido configurados. La información del marco oficial permanece separada y no se convierte automáticamente en requisitos de la Academia.</div>${returnSource}`}
      else content.innerHTML=`<h2>Evaluación</h2><p>Los requisitos de evaluación están configurados por el módulo de reglas de finalización de esta área de estudio.</p>${returnSource}`;
    }
    if(canonical)StudyContext?.set?.({program:programId,unit:unit.id,canonical,mode});
    SourceResolver.linkify(content);
  }
  global.ProgramWorkspace={init};
})(window);
