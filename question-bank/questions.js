(async()=>{
  const host=document.getElementById('questionWorkspace');
  const params=new URLSearchParams(location.search);

  const sheetId=params.get('sheet');
  const importId=params.get('import');
  const importProgram=params.get('program');
  const groupId=params.get('group');
  const sectionParam=params.get('section');
  const ref=params.get('ref');
  const kind=params.get('kind');

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));

  const PROGRAM_LABELS={
    'bhakti-sastri':'Bhakti Śāstrī',
    'bhakti-vaibhava':'Bhakti Vaibhava',
    'bhakti-vedanta':'Bhakti Vedānta',
    'bhakti-sarvabhauma':'Bhakti Sārvabhauma'
  };

  const BOOK_LABELS={
    bg:'Bhagavad-gītā',
    sb1:'Śrīmad-Bhāgavatam · Canto 1',
    sb2:'Śrīmad-Bhāgavatam · Canto 2',
    sb3:'Śrīmad-Bhāgavatam · Canto 3',
    sb4:'Śrīmad-Bhāgavatam · Canto 4',
    sb5:'Śrīmad-Bhāgavatam · Canto 5',
    sb6:'Śrīmad-Bhāgavatam · Canto 6'
  };

  const KIND_LABELS={
    'closed-book-short':'Libro Cerrado — Respuesta Corta',
    'closed-book':'Preguntas a Libro Cerrado',
    'open-book-essay':'Ensayos a Libro Abierto',
    'open-book':'Preguntas a Libro Abierto',
    'study-question':'Preguntas de Estudio'
  };

  function loadImported(){
    if(!importId || !importProgram || !window.QuestionSheetImporter){
      return null;
    }

    const batch=QuestionSheetImporter
      .batches(importProgram)
      .find(x=>x.id===importId);

    if(!batch)return null;

    return {
      record:{
        id:batch.id,
        program:importProgram,
        imported:true
      },
      data:{
        title:batch.title||'Hoja de preguntas importada',
        provider:batch.author||'Imported',
        source_file:batch.source_file||'',
        questions:batch.questions||[]
      }
    };
  }

  async function loadSheet(){
    const registryResponse=await fetch('../data/question-sheet-registry.json');
    if(!registryResponse.ok){
      throw new Error(`Registry HTTP ${registryResponse.status}`);
    }

    const registry=await registryResponse.json();
    const record=(registry.sheets||[]).find(x=>x.id===sheetId);

    if(!record)throw new Error('No se encontró la hoja de preguntas.');

    const dataResponse=await fetch('../'+record.data);
    if(!dataResponse.ok){
      throw new Error(`Hoja de preguntas HTTP ${dataResponse.status}`);
    }

    return {record,data:await dataResponse.json()};
  }

  function structured(record,data){
    const sectionIndex=Number(sectionParam);

    if(!groupId || sectionParam===null || !Number.isInteger(sectionIndex)){
      return null;
    }

    const group=data.groups?.find(g=>String(g.chapter)===groupId);
    const section=group?.sections?.[sectionIndex];

    if(!group || !section)return null;

    const scope=`${sheetId}.${groupId}.${sectionIndex}`;

    const questions=section.questions.map((q,i)=>{
      const canonical=q.refs?.[0]||'';

      return QuestionEngine.normalizeRecord({
        id:`${sheetId}.${groupId}.${sectionIndex}.${i+1}`,
        provider:'boex',
        source_question_id:`${groupId}-${sectionIndex+1}-${i+1}`,
        question:q.q,
        canonical_ref:canonical,
        canonical_sources:q.refs||[],
        kind:section.type,
        provenance:{
          title:data.title,
          author:data.provider
        }
      });
    });

    const groupLabel=groupId==='1-6'
      ? 'Bhagavad-gītā 1–6 · Preguntas Temáticas'
      : `Bhagavad-gītā · Capítulo ${groupId}`;

    return {
      scope,
      questions,
      heading:groupLabel,
      type:section.type
    };
  }

  function importedBatch(record,data){
    const source=data.questions||[];
    if(!source.length)return null;

    const questions=source.map((q,i)=>
      QuestionEngine.normalizeRecord({
        ...q,
        id:q.id || q.source_question_id ||
          `${record.id}.${i+1}`,
        provider:q.provider || 'student-import',
        source_question_id:q.source_question_id ||
          q.id || `${i+1}`,
        question:q.question || q.q || '',
        canonical_ref:q.canonical_ref || '',
        canonical_sources:q.canonical_sources ||
          (q.canonical_ref ? [q.canonical_ref] : []),
        kind:q.kind || 'study-question',
        provenance:q.provenance || {
          title:data.title || 'Hoja de preguntas importada',
          author:data.provider || ''
        }
      })
    ).filter(q=>q.question);

    if(!questions.length)return null;

    return {
      scope:`import.${record.id}`,
      questions,
      heading:data.title || 'Hoja de preguntas importada',
      type:'Preguntas Importadas'
    };
  }

  function flatCanonical(record,data){
    if(!ref || !kind)return null;

    const selected=(data.questions||[]).filter(q=>
      (q.canonical_ref||record.scope||'General')===ref &&
      (q.kind||'study-question')===kind
    );

    if(!selected.length)return null;

    const scope=`${sheetId}.${ref}.${kind}`;

    const questions=selected.map((q,i)=>
      QuestionEngine.normalizeRecord({
        id:q.source_question_id || `${sheetId}.${ref}.${kind}.${i+1}`,
        provider:q.provider || data.provider || 'boex',
        source_question_id:q.source_question_id || `${i+1}`,
        question:q.question,
        canonical_ref:q.canonical_ref || '',
        canonical_sources:q.canonical_sources ||
          (q.canonical_ref && /^SB\.\d+\.\d+/.test(q.canonical_ref)
            ? [q.canonical_ref]
            : []),
        kind:q.kind || kind,
        provenance:q.provenance || {
          title:data.source_title || data.title || sheetId,
          author:data.provider || ''
        }
      })
    );

    const chapterMatch=String(ref).match(/^SB\.(\d+)\.(\d+)$/);

    const heading=chapterMatch
      ? `Śrīmad-Bhāgavatam Canto ${chapterMatch[1]} · Capítulo ${chapterMatch[2]}`
      : ref===record.scope
        ? 'Introducción / General'
        : ref;

    return {
      scope,
      questions,
      heading,
      type:KIND_LABELS[kind]||kind
    };
  }

  try{
    if(!sheetId && !(importId && importProgram)){
      host.innerHTML='<div class="card missing">No se encontró la sección de preguntas.</div>';
      return;
    }

    const imported=loadImported();
    const {record,data}=imported || await loadSheet();

    const section=record.imported
      ? importedBatch(record,data)
      : record.adapter==='flat-canonical'
        ? flatCanonical(record,data)
        : structured(record,data);

    if(!section){
      host.innerHTML='<div class="card missing">No se encontró la sección de preguntas.</div>';
      return;
    }

    const title=data.title||data.source_title||record.id;
    const programLabel=PROGRAM_LABELS[record.program]||record.program;
    const bookLabel=BOOK_LABELS[record.book]||record.book||'Importado / General';
    const provenance=data.provider||'Banco de Preguntas';

    const sheetHref=record.imported
      ? 'index.html'
      : `sheet.html?sheet=${encodeURIComponent(sheetId)}${ref
          ? `&ref=${encodeURIComponent(ref)}`
          : ''}`;

    host.innerHTML=`
      <div class="reader-actions" style="margin:0 0 18px">
        <a class="button secondary" href="${sheetHref}">
          ← ${record.imported?'Banco de Preguntas':'Hoja de Preguntas'}
        </a>
        ${record.imported?'':`<a class="button secondary" href="index.html">Banco de Preguntas</a>`}
        <a class="button secondary" href="../index.html">Inicio de la Academia</a>
      </div>

      <section class="card">
        <div class="eyebrow">
          ${esc(programLabel)} · ${esc(bookLabel)}
        </div>

        <h1>${esc(section.heading)}</h1>
        <h2>${esc(section.type)}</h2>

        <p class="small">
          ${section.questions.length}
          question${section.questions.length===1?'':'s'}
          · ${esc(provenance)}
        </p>

        <div id="questionList"></div>
        <p id="msg" class="small"></p>
      </section>
    `;

    const list=document.getElementById('questionList');

    QuestionManagementUI.render(list,{
      program:record.program,
      unit:record.scope||'',
      scope:section.scope,
      questions:section.questions,
      bank:{
        id:record.id,
        label:section.type,
        provenance_label:provenance
      }
    });

    const save=list.querySelector('#saveQuestions');

    if(save){
      save.onclick=()=>{
        list.querySelectorAll('.qanswer').forEach(el=>{
          const question=section.questions.find(
            q=>q.id===el.dataset.qid
          );

          QuestionEngine.save(
            record.program,
            section.scope,
            el.dataset.qid,
            el.value,
            {
              unit:record.scope||'',
              canonical_ref:question?.canonical_ref||'',
              canonical_sources:question?.canonical_sources||[]
            }
          );
        });

        QuestionManagementUI.clearAnswerDrafts?.(
          list,
          {program:record.program,scope:section.scope}
        );

        document.getElementById('msg').textContent=
          'Respuestas guardadas en este navegador.';
      };
    }

  }catch(error){
    host.innerHTML=
      `<div class="card missing">No se pudieron cargar las preguntas: ${esc(error.message)}</div>`;
  }
})();
