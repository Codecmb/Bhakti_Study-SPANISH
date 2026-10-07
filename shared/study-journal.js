(function(global){
  'use strict';

  const TYPE='study-journal';

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
  }[c]));

  const uid=()=>`journal-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const now=()=>new Date().toISOString();

  function normalize(entry={}){
    return {
      id:entry.id||uid(),
      title:entry.title||'',
      program:entry.program||'',
      unit:entry.unit||'',
      book:entry.book||'',
      bookTitle:entry.bookTitle||'',
      section:entry.section||'',
      canonical:entry.canonical||'',
      notes:entry.notes||'',
      tags:Array.isArray(entry.tags)
        ? [...new Set(entry.tags.map(tag=>String(tag).trim()).filter(Boolean))]
        : [],
      questions:Array.isArray(entry.questions)
        ? entry.questions.map(q=>({
            id:q.id||uid(),
            text:q.text||'',
            answer:q.answer||''
          }))
        : [],
      createdAt:entry.createdAt||now(),
      updatedAt:entry.updatedAt||now()
    };
  }

  function save(entry){
    const rec=normalize(entry);
    rec.updatedAt=now();

    if(!global.StudentStore)
      throw new Error('StudentStore is unavailable.');

    StudentStore.setJSON(TYPE,rec.id,rec);
    return rec;
  }

  function get(id){
    if(!global.StudentStore||!id)return null;
    const rec=StudentStore.getJSON(TYPE,id,null);
    return rec?normalize(rec):null;
  }

  function list(){
    if(!global.StudentStore)return [];

    return StudentStore.entries(TYPE)
      .map(item=>{
        try{
          if(item && typeof item==='object' && 'value' in item){
            const value=item.value;
            return normalize(
              typeof value==='string'
                ? JSON.parse(value)
                : value
            );
          }

          return null;
        }catch{
          return null;
        }
      })
      .filter(Boolean)
      .sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
  }

  function remove(id){
    if(global.StudentStore&&id)
      StudentStore.remove(TYPE,id);
  }

  function addQuestion(entry,text=''){
    const rec=normalize(entry);

    rec.questions.push({
      id:uid(),
      text,
      answer:''
    });

    return rec;
  }

  function cleanName(s){
    return String(s||'Journal')
      .replace(/[^\w.-]+/g,'_')
      .replace(/^_+|_+$/g,'')
      .slice(0,80)||'Journal';
  }

  function download(filename,type,text){
    const blob=new Blob([text],{type});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');

    a.href=url;
    a.download=filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  function rtfEsc(value){
    return String(value??'')
      .replace(/\\/g,'\\\\')
      .replace(/{/g,'\\{')
      .replace(/}/g,'\\}')
      .replace(/[^\x00-\x7F]/g,ch=>{
        let n=ch.charCodeAt(0);
        if(n>32767)n-=65536;
        return `\\u${n}?`;
      })
      .replace(/\r?\n/g,'\\par\n');
  }

  function displayTitle(e){
    return e.title||e.canonical||e.section||e.bookTitle||'Diario de Estudio';
  }

  function exportRTF(entry){
    const e=normalize(entry);

    let body='{\\rtf1\\ansi\\deff0\n';
    body+='{\\fonttbl{\\f0 Arial;}}\n';
    body+='\\fs24\n';

    const heading=t=>{
      body+=`\\par\\b\\fs28 ${rtfEsc(t)}\\b0\\fs24\\par\n`;
    };

    const field=(label,value)=>{
      if(value)
        body+=`\\b ${rtfEsc(label)}:\\b0\\~${rtfEsc(value)}\\par\n`;
    };

    body+=`\\b\\fs36 ${rtfEsc('Academia Master Siddhānta Gauḍīya')}\\b0\\fs24\\par\n`;
    body+='Diario de Estudio\\par\\par\n';

    field('Título',displayTitle(e));
    field('Libro',e.bookTitle||e.book);

    const exportSection=String(e.section||'')
      .replace(/^(Chapter\\s+\\d+):\\s+\\1:\\s*/i,'$1: ');

    field('Sección',exportSection);
    field('Referencia',e.canonical);
    field('Área de Estudio',e.program);
    field('Etiquetas',(e.tags||[]).join(', '));

    heading('Mis Notas');
    body+=(e.notes?rtfEsc(e.notes):'')+'\\par\n';

    heading('Mis Preguntas');

    if(!e.questions.length){
      body+='No hay preguntas registradas.\\par\n';
    }else{
      e.questions.forEach((q,i)=>{
        body+=`\\par\\b Pregunta ${i+1}:\\b0 ${rtfEsc(q.text)}\\par\n`;
        body+=`\\b Mi Respuesta / Notas de Trabajo:\\b0 ${rtfEsc(q.answer)}\\par\n`;
      });
    }

    heading('Instrucciones para Revisión con IA');
    body+=rtfEsc(
      'Revisa mis notas de estudio y mis preguntas. Distingue claramente entre lo que escribí, lo que respalda la fuente citada y cualquier explicación adicional que proporciones. Identifica malentendidos o puntos que necesiten aclaración.'
    );

    body+='}';

    const base=cleanName(displayTitle(e));

    download(
      `Academia_Study_Journal_${base}_${new Date().toISOString().slice(0,10)}.rtf`,
      'application/rtf',
      body
    );
  }

  global.StudyJournal={
    TYPE,
    esc,
    normalize,
    save,
    get,
    list,
    remove,
    addQuestion,
    exportRTF
  };
})(window);
