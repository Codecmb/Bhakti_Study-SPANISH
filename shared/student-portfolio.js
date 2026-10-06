(function(global){
  const S=global.StudentStore;
  const WORK_TYPES={understanding:'Mi Comprensión',reflection:'Comprensión Revisada',notes:'Notas',answer:'Respuesta','question-answer':'Respuesta a la Pregunta','question-revision':'Respuesta Revisada a la Pregunta','my-question':'Mi Pregunta',assessment:'Evaluación'};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const PROGRAMS=[
    'bhakti-sastri',
    'bhakti-vaibhava',
    'bhakti-vedanta',
    'bhakti-sarvabhauma'
  ];

  function programParts(id){
    const program=PROGRAMS.find(p=>id.startsWith(p+'.'));
    if(!program)return null;
    return {program,rest:id.slice(program.length+1)};
  }

  async function questionContext(record,parts){
    const meta=S.getJSON('question-meta',record.id,{})||{};
    const unit=meta.unit||'';
    const canonical=meta.canonical_ref||'';
    const qid=parts.rest;

    if(!unit && !canonical)return null;

    try{
      const response=await fetch('../data/question-sheet-registry.json');
      if(!response.ok)return null;

      const registry=await response.json();
      const candidates=(registry.sheets||[]).filter(sheet=>
        sheet.program===parts.program &&
        (!unit || sheet.scope===unit)
      );

      for(const sheet of candidates){
        const dataResponse=await fetch('../'+sheet.data);
        if(!dataResponse.ok)continue;

        const data=await dataResponse.json();

        if(sheet.adapter==='flat-canonical'){
          const question=(data.questions||[]).find(q=>
            (q.source_question_id||'')===qid
          );

          if(!question)continue;

          const ref=question.canonical_ref||sheet.scope||canonical||'General';
          const kind=question.kind||'study-question';

          const q=new URLSearchParams({
            sheet:sheet.id,
            ref,
            kind,
            question:qid
          });

          return {
            program:parts.program,
            unit,
            canonical:question.canonical_ref||canonical,
            questionId:qid,
            href:`../question-bank/questions.html?${q}`,
            label:'Abrir Pregunta'
          };
        }
      }
    }catch(_){}

    return null;
  }

  function context(record){
    const parts=programParts(record.id);
    if(!parts)return null;

    const {program}=parts;
    let unit='',canonical='',mode='';

    if(record.type==='question-answer' || record.type==='question-revision'){
      return null;
    }

    if(record.type==='understanding' || record.type==='reflection'){
      mode='understanding';
      const suffix='.'+record.type;
      if(!parts.rest.endsWith(suffix))return null;
      const scope=parts.rest.slice(0,-suffix.length);
      if(!scope)return null;

      if(/^[A-Z]+\.U\d+$/i.test(scope))unit=scope;
      else canonical=scope;
    }else if(record.type==='notes'){
      const scope=parts.rest;
      if(!scope)return null;

      if(/^[A-Z]+\.U\d+$/i.test(scope))unit=scope;
      else canonical=scope;

      mode='notes';
    }else{
      return null;
    }

    const q=new URLSearchParams();
    if(unit)q.set('unit',unit);
    q.set('mode',mode);
    if(canonical)q.set('ref',canonical);

    return {
      program,unit,canonical,mode,
      href:`../programs/${program}/tools.html?${q}`,
      label:'Abrir Estudio'
    };
  }

  async function resolveRecords(){
    const rows=records();

    await Promise.all(rows.map(async r=>{
      if(r.type!=='question-answer' && r.type!=='question-revision')return;

      const parts=programParts(r.id);
      if(!parts)return;

      r.context=await questionContext(r,parts);
    }));

    return rows;
  }

  function records(){
    if(!S)return[];
    return S.allEntries().filter(r=>WORK_TYPES[r.type]&&String(r.value??'').trim()).map(r=>({
      ...r,label:WORK_TYPES[r.type],ref:r.id,updated:null
    })).map(r=>({...r,context:context(r)}))
      .sort((a,b)=>a.ref.localeCompare(b.ref)||a.label.localeCompare(b.label));
  }
  function download(name,type,text){
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));
    a.download=name;document.body.appendChild(a);a.click();
    setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);
  }
  function backup(){
    download(`Bhakti_Study_Student_Backup_${new Date().toISOString().slice(0,10)}.json`,'application/json;charset=utf-8',JSON.stringify(S.exportBackup(),null,2));
  }
  async function restore(file,replace=false){
    const data=JSON.parse(await file.text());return S.importBackup(data,{replace});
  }
  const rtfEsc=s=>String(s??'').replace(/\\/g,'\\\\').replace(/{/g,'\\{').replace(/}/g,'\\}').replace(/\r?\n/g,'\\par\n').replace(/[^\x20-\x7E]/g,ch=>'\\u'+ch.charCodeAt(0)+'?');
  function exportRTF(selected=records(),title='Bhakti Study — Portafolio del Estudiante'){
    let body=`{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}\\fs24\\b ${rtfEsc(title)}\\b0\\par\\par`;
    for(const r of selected){
      body+=`\\b ${rtfEsc(r.ref)} — ${rtfEsc(r.label)}\\b0\\par ${rtfEsc(r.value)}\\par\\par`;
    }
    body+='}';
    download(`Bhakti_Study_Student_Portfolio_${new Date().toISOString().slice(0,10)}.rtf`,'application/rtf',body);
  }
  global.StudentPortfolio={records,resolveRecords,context,questionContext,backup,restore,exportRTF,esc};
})(window);
