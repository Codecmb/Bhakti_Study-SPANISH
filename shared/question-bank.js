(function(global){
  const PROGRAMS=[
    {
      id:'bhakti-sastri',
      label:'Bhakti Śāstrī',
      books:[
        {id:'bg',label:'Bhagavad-gītā'},
        {id:'iso',label:'Śrī Īśopaniṣad'},
        {id:'nod',label:'Nectar of Devotion'},
        {id:'noi',label:'Nectar of Instruction'}
      ]
    },
    {
      id:'bhakti-vaibhava',
      label:'Bhakti Vaibhava',
      books:[
        {id:'sb1',label:'Śrīmad-Bhāgavatam · Canto 1'},
        {id:'sb2',label:'Śrīmad-Bhāgavatam · Canto 2'},
        {id:'sb3',label:'Śrīmad-Bhāgavatam · Canto 3'},
        {id:'sb4',label:'Śrīmad-Bhāgavatam · Canto 4'},
        {id:'sb5',label:'Śrīmad-Bhāgavatam · Canto 5'},
        {id:'sb6',label:'Śrīmad-Bhāgavatam · Canto 6'}
      ]
    },
    {
      id:'bhakti-vedanta',
      label:'Bhakti Vedānta',
      books:[
        {id:'sb7',label:'Śrīmad-Bhāgavatam · Canto 7'},
        {id:'sb8',label:'Śrīmad-Bhāgavatam · Canto 8'},
        {id:'sb9',label:'Śrīmad-Bhāgavatam · Canto 9'},
        {id:'sb10',label:'Śrīmad-Bhāgavatam · Canto 10'},
        {id:'sb11',label:'Śrīmad-Bhāgavatam · Canto 11'},
        {id:'sb12',label:'Śrīmad-Bhāgavatam · Canto 12'}
      ]
    },
    {
      id:'bhakti-sarvabhauma',
      label:'Bhakti Sārvabhauma',
      books:[
        {id:'cc-adi',label:'Śrī Caitanya-caritāmṛta · Ādi-līlā'},
        {id:'cc-madhya',label:'Śrī Caitanya-caritāmṛta · Madhya-līlā'},
        {id:'cc-antya',label:'Śrī Caitanya-caritāmṛta · Antya-līlā'}
      ]
    }
  ];

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));

  async function loadRegistry(){
    const response=await fetch('../data/question-sheet-registry.json');
    if(!response.ok)throw new Error(`Registro de hojas de preguntas: HTTP ${response.status}`);
    return response.json();
  }

  async function loadSheet(record){
    const response=await fetch('../'+record.data);
    if(!response.ok)throw new Error(`${record.id}: HTTP ${response.status}`);
    return response.json();
  }

  function importedBooks(program,batch){
    const books=new Set();

    (batch.questions||[]).forEach(q=>{
      const ref=String(q.canonical_ref||'').toUpperCase();
      const unit=String(q.unit||'');

      if(program==='bhakti-sastri'){
        if(/^BG[. ]/.test(ref))books.add('bg');
        else if(/^ISO[. ]/.test(ref))books.add('iso');
        else if(/^NOD[. ]/.test(ref))books.add('nod');
        else if(/^NOI[. ]/.test(ref))books.add('noi');
      }

      if(program==='bhakti-vaibhava' ||
         program==='bhakti-vedanta'){
        const m=ref.match(/^SB[. ](\d+)/);
        if(m)books.add('sb'+m[1]);
      }

      if(program==='bhakti-sarvabhauma'){
        const m=ref.match(/^CC[. ](ADI|MADHYA|ANTYA)/);
        if(m)books.add('cc-'+m[1].toLowerCase());
      }

      // Conservative unit fallback only where the existing
      // curriculum mapping is unambiguous.
      if(!ref){
        const maps={
          'BV.U1':'sb1','BV.U2':'sb1','BV.U3':'sb2',
          'BV.U4':'sb3','BV.U5':'sb3',
          'BV.U6':'sb4','BV.U7':'sb4',
          'BV.U8':'sb5','BV.U9':'sb6',
          'BVED.U1':'sb7','BVED.U2':'sb8',
          'BVED.U3':'sb9','BVED.U4':'sb10',
          'BVED.U5':'sb11','BVED.U6':'sb12'
        };
        if(maps[unit])books.add(maps[unit]);
      }
    });

    return [...books];
  }

  function importedSheets(){
    if(!global.QuestionSheetImporter)return [];

    return PROGRAMS.flatMap(program=>
      QuestionSheetImporter.batches(program.id).map(batch=>({
        record:{
          id:batch.id,
          program:program.id,
          imported:true,
          books:importedBooks(program.id,batch)
        },
        data:{
          title:batch.title||'Hoja de preguntas importada',
          provider:batch.author||'Imported',
          source_file:batch.source_file||'',
          questions:batch.questions||[]
        }
      }))
    );
  }

  function coverageLabel(record){
    const c=record.coverage||{};
    if(c.type==='chapter-range' && c.start && c.end){
      return `Chapters ${c.start}–${c.end}`;
    }
    return '';
  }

  function renderAcademiaCanto7(){
    return "<div style=\"padding-top:.75rem\"><p class=\"small\">15 capítulos · 22 lecciones · 220 preguntas · Academia</p><details class=\"card\"><summary><strong>Capítulo 1: El Señor Supremo es igual con todos</strong></summary><p><a class=\"button secondary\" href=\"questions.html?sheet=academia-bved-u1&amp;ref=BVED.S001\">Lección 1 — 10 preguntas</a></p></details><details class=\"card\"><summary><strong>Capítulo 2: Hiraṇyakaśipu, rey de los demonios</strong></summary><p><a class=\"button secondary\" href=\"questions.html?sheet=academia-bved-u1&amp;ref=BVED.S002\">Lección 2 · Parte 1 — 10 preguntas</a></p><p><a class=\"button secondary\" href=\"questions.html?sheet=academia-bved-u1&amp;ref=BVED.S003\">Lección 3 · Parte 2 — 10 preguntas</a></p></details><details class=\"card\"><summary><strong>Capítulo 3: El plan de Hiraṇyakaśipu para volverse inmortal</strong></summary><p><a class=\"button secondary\" href=\"questions.html?sheet=academia-bved-u1&amp;ref=BVED.S004\">Lección 4 — 10 preguntas</a></p></details><details class=\"card\"><summary><strong>Capítulo 4: Hiraṇyakaśipu aterroriza al universo</strong></summary><p><a class=\"button secondary\" href=\"questions.html?sheet=academia-bved-u1&amp;ref=BVED.S005\">Lección 5 — 10 preguntas</a></p></details><details class=\"card\"><summary><strong>Capítulo 5: Prahlāda Mahārāja, el santo hijo de Hiraṇyakaśipu</strong></summary><p><a class=\"button secondary\" href=\"questions.html?sheet=academia-bved-u1&amp;ref=BVED.S006\">Lección 6 · Parte 1 — 10 preguntas</a></p><p><a class=\"button secondary\" href=\"questions.html?sheet=academia-bved-u1&amp;ref=BVED.S007\">Lección 7 · Parte 2 — 10 preguntas</a></p></details><details class=\"card\"><summary><strong>Capítulo 6: Prahlāda instruye a sus compañeros de escuela demoníacos</strong></summary><p><a class=\"button secondary\" href=\"questions.html?sheet=academia-bved-u1&amp;ref=BVED.S008\">Lección 8 — 10 preguntas</a></p></details><details class=\"card\"><summary><strong>Capítulo 7: Lo que Prahlāda aprendió en el vientre materno</strong></summary><p><a class=\"button secondary\" href=\"questions.html?sheet=academia-bved-u1&amp;ref=BVED.S009\">Lección 9 · Parte 1 — 10 preguntas</a></p><p><a class=\"button secondary\" href=\"questions.html?sheet=academia-bved-u1&amp;ref=BVED.S010\">Lección 10 · Parte 2 — 10 preguntas</a></p></details><details class=\"card\"><summary><strong>Capítulo 8: El Señor Nṛsiṁhadeva mata al rey de los demonios</strong></summary><p><a class=\"button secondary\" href=\"questions.html?sheet=academia-bved-u1&amp;ref=BVED.S011\">Lección 11 — 10 preguntas</a></p></details><details class=\"card\"><summary><strong>Capítulo 9: Prahlāda apacigua al Señor Nṛsiṁhadeva con oraciones</strong></summary><p><a class=\"button secondary\" href=\"questions.html?sheet=academia-bved-u1&amp;ref=BVED.S012\">Lección 12 · Parte 1 — 10 preguntas</a></p><p><a class=\"button secondary\" href=\"questions.html?sheet=academia-bved-u1&amp;ref=BVED.S013\">Lección 13 · Parte 2 — 10 preguntas</a></p></details><details class=\"card\"><summary><strong>Capítulo 10: Prahlāda, el mejor entre los devotos excelsos</strong></summary><p><a class=\"button secondary\" href=\"questions.html?sheet=academia-bved-u1&amp;ref=BVED.S014\">Lección 14 · Parte 1 — 10 preguntas</a></p><p><a class=\"button secondary\" href=\"questions.html?sheet=academia-bved-u1&amp;ref=BVED.S015\">Lección 15 · Parte 2 — 10 preguntas</a></p></details><details class=\"card\"><summary><strong>Capítulo 11: La sociedad perfecta: cuatro clases sociales</strong></summary><p><a class=\"button secondary\" href=\"questions.html?sheet=academia-bved-u1&amp;ref=BVED.S016\">Lección 16 — 10 preguntas</a></p></details><details class=\"card\"><summary><strong>Capítulo 12: La sociedad perfecta: cuatro órdenes espirituales</strong></summary><p><a class=\"button secondary\" href=\"questions.html?sheet=academia-bved-u1&amp;ref=BVED.S017\">Lección 17 — 10 preguntas</a></p></details><details class=\"card\"><summary><strong>Capítulo 13: El comportamiento de una persona perfecta</strong></summary><p><a class=\"button secondary\" href=\"questions.html?sheet=academia-bved-u1&amp;ref=BVED.S018\">Lección 18 · Parte 1 — 10 preguntas</a></p><p><a class=\"button secondary\" href=\"questions.html?sheet=academia-bved-u1&amp;ref=BVED.S019\">Lección 19 · Parte 2 — 10 preguntas</a></p></details><details class=\"card\"><summary><strong>Capítulo 14: La vida familiar ideal</strong></summary><p><a class=\"button secondary\" href=\"questions.html?sheet=academia-bved-u1&amp;ref=BVED.S020\">Lección 20 — 10 preguntas</a></p></details><details class=\"card\"><summary><strong>Capítulo 15: Instrucciones para los seres humanos civilizados</strong></summary><p><a class=\"button secondary\" href=\"questions.html?sheet=academia-bved-u1&amp;ref=BVED.S021\">Lección 21 · Parte 1 — 10 preguntas</a></p><p><a class=\"button secondary\" href=\"questions.html?sheet=academia-bved-u1&amp;ref=BVED.S022\">Lección 22 · Parte 2 — 10 preguntas</a></p></details></div>";
  }


  function renderCanto8(lessons,mapping){
    const selected=lessons.filter(x=>x.unitId==='BVED.U2');
    const assignments=mapping.assignments||{};
    const pending=mapping.pending||[];
    const counts={};

    Object.values(assignments).forEach(id=>{
      counts[id]=(counts[id]||0)+1;
    });

    const chapters=new Map();

    selected.forEach(lesson=>{
      const chapter=lesson.chapter;
      if(!chapters.has(chapter))chapters.set(chapter,[]);
      chapters.get(chapter).push(lesson);
    });

    return `
      <div style="padding-top:.75rem">
        <p class="small">
          ${chapters.size} capítulos ·
          ${selected.length} lecciones ·
          ${Object.keys(assignments).length} actividades clasificadas ·
          ${pending.length} pendientes
        </p>

        ${[...chapters.entries()].map(([chapter,items])=>`
          <details class="card">
            <summary><strong>Capítulo ${chapter}</strong></summary>
            ${items.map(lesson=>`
              <p>
                ${counts[lesson.id]
                  ? `<a class="button secondary"
                       href="questions.html?sheet=collected-bved-u2&amp;ref=${encodeURIComponent(lesson.id)}">
                       ${esc(lesson.title)} — ${counts[lesson.id]} actividades
                     </a>`
                  : `<strong>${esc(lesson.title)}</strong>
                     <span class="small"> · Sin actividades asignadas</span>`}
                <span class="small">
                  · ${esc(lesson.firstRef)}–${esc(lesson.lastRef)}
                </span>
              </p>
            `).join('')}
          </details>
        `).join('')}

        <details class="card">
          <summary>
            <strong>Actividades pendientes de clasificación (${pending.length})</strong>
          </summary>
          <p class="small">
            Estas actividades conservan sus identificadores originales.
            Todavía no tienen una referencia verificada para asignarlas
            a una lección.
          </p>
          <p>
            <a class="button secondary"
               href="questions.html?sheet=collected-bved-u2&amp;ref=pending">
              Ver ${pending.length} actividades pendientes
            </a>
          </p>
        </details>
      </div>
    `;
  }


  function renderVaibhavaChapters(sheets){
    const chapters=new Map();

    sheets.forEach(({record,data})=>{
      (data.questions||[]).forEach(q=>{
        const match=String(q.canonical_ref||'').match(/^SB\.(\d+)\.(\d+)$/);
        if(!match)return;

        const ref=q.canonical_ref;
        const kind=q.kind||'study-question';
        const key=`${record.id}|${ref}|${kind}`;

        if(!chapters.has(ref))chapters.set(ref,new Map());
        const groups=chapters.get(ref);
        const existing=groups.get(key);

        if(existing){
          existing.count++;
        }else{
          groups.set(key,{
            sheet:record.id,
            ref,
            kind,
            count:1
          });
        }
      });
    });

    const ordered=[...chapters.entries()].sort((a,b)=>{
      const x=a[0].split('.').map(Number);
      const y=b[0].split('.').map(Number);
      return x[1]-y[1]||x[2]-y[2];
    });

    const general=sheets.flatMap(({record,data})=>
      (data.questions||[])
        .filter(q=>q.canonical_ref===record.scope)
        .reduce((groups,q)=>{
          const kind=q.kind||'study-question';
          let group=groups.find(g=>g.kind===kind);
          if(!group){
            group={sheet:record.id,ref:record.scope,kind,count:0};
            groups.push(group);
          }
          group.count++;
          return groups;
        },[])
    );

    return `<div>
      ${general.length ? `
        <details class="card">
          <summary><strong>Introducción / Preguntas generales</strong></summary>
          ${general.map(g=>`
            <p>
              <a class="button secondary"
                 href="questions.html?sheet=${encodeURIComponent(g.sheet)}&amp;ref=${encodeURIComponent(g.ref)}&amp;kind=${encodeURIComponent(g.kind)}">
                ${esc(g.kind)} — ${g.count} preguntas
              </a>
            </p>
          `).join('')}
        </details>
      ` : ''}
      ${ordered.map(([ref,groups])=>`
        <details class="card">
          <summary>
            <strong>Capítulo ${esc(ref.replace(/^SB\.\d+\./,''))}</strong>
            <span class="small"> · ${[...groups.values()].reduce((n,g)=>n+g.count,0)} preguntas</span>
          </summary>
          ${[...groups.values()].map(g=>`
            <p>
              <a class="button secondary"
                 href="questions.html?sheet=${encodeURIComponent(g.sheet)}&amp;ref=${encodeURIComponent(g.ref)}&amp;kind=${encodeURIComponent(g.kind)}">
                ${esc(g.kind)} — ${g.count} preguntas
              </a>
            </p>
          `).join('')}
        </details>
      `).join('')}
    </div>`;
  }


  function renderSastriAcademy(sheets){
    const units=sheets
      .filter(x=>/^academia-bs-u[1-5]$/.test(x.record.id))
      .sort((a,b)=>a.record.scope.localeCompare(b.record.scope));

    return `<div style="padding-top:.75rem">
      ${units.map(({record,data})=>{
        const questions=data.questions||[];
        const kinds=[...new Set(questions.map(q=>q.kind||'study-question'))];

        return `<details class="card">
          <summary>
            <strong>Unidad ${esc(record.scope.replace('BS.U',''))}</strong>
            <span class="small"> · ${questions.length} preguntas</span>
          </summary>
          ${kinds.map(kind=>`
            <p>
              <a class="button secondary"
                 href="questions.html?sheet=${encodeURIComponent(record.id)}&amp;ref=${encodeURIComponent(record.scope)}&amp;kind=${encodeURIComponent(kind)}">
                Preguntas de reflexión — ${questions.filter(q=>(q.kind||'study-question')===kind).length}
              </a>
            </p>
          `).join('')}
        </details>`;
      }).join('')}
    </div>`;
  }

  function boexTypeLabel(type){
    const labels={
      'Closed Book Questions':'Preguntas a libro cerrado',
      'Closed Book Short':'Respuestas cortas a libro cerrado',
      'Closed Book Thematic Questions':'Preguntas temáticas a libro cerrado',
      'Open Book Essays':'Ensayos a libro abierto',
      'Open Book Thematic Questions':'Preguntas temáticas a libro abierto'
    };
    return labels[type]||type;
  }

  function renderSastriBoex(sheets){
    const source=sheets.find(x=>x.record.id==='boex-bg-1-6-es');
    if(!source)return '';

    const {record,data}=source;
    const groups=data.groups||[];

    return `<div style="padding-top:.75rem">
      ${groups.map(group=>{
        const chapter=String(group.chapter);
        const label=chapter==='1-6'
          ? 'Evaluación general · Capítulos 1–6'
          : `Capítulo ${chapter}`;

        const total=(group.sections||[]).reduce(
          (n,section)=>n+(section.questions||[]).length,0
        );

        return `<details class="card">
          <summary>
            <strong>${esc(label)}</strong>
            <span class="small"> · ${total} preguntas</span>
          </summary>
          ${(group.sections||[]).map((section,index)=>`
            <p>
              <a class="button secondary"
                 href="questions.html?sheet=${encodeURIComponent(record.id)}&amp;group=${encodeURIComponent(chapter)}&amp;section=${index}">
                ${esc(boexTypeLabel(section.type||'Preguntas BOEX'))}
                — ${(section.questions||[]).length} preguntas
              </a>
            </p>
          `).join('')}
        </details>`;
      }).join('')}
    </div>`;
  }

  function renderBook(book,sheets,context={}){
    const selected=context.program===context.programId && context.book===book.id;
    const academia=book.id==='sb7' &&
      sheets.some(x=>x.record.id==='academia-bved-u1');

    const canto8=book.id==='sb8' &&
      context.programId==='bhakti-vedanta' &&
      context.canto8;

    const vaibhava=context.programId==='bhakti-vaibhava' &&
      /^sb[1-6]$/.test(book.id) &&
      sheets.some(x=>x.record.id.startsWith('boex-bv-u'));

    const sastriAcademy=context.programId==='bhakti-sastri' &&
      book.id==='general' &&
      sheets.some(x=>/^academia-bs-u[1-5]$/.test(x.record.id));

    const sastriBoex=context.programId==='bhakti-sastri' &&
      book.id==='bg' &&
      sheets.some(x=>x.record.id==='boex-bg-1-6-es');

    const content=sastriBoex
      ? renderSastriBoex(sheets)
      : sastriAcademy
      ? renderSastriAcademy(sheets)
      : vaibhava
      ? renderVaibhavaChapters(sheets)
      : academia
      ? renderAcademiaCanto7()
      : canto8
      ? renderCanto8(context.canto8.lessons,context.canto8.mapping)
      : sheets.length
      ? `<div style="padding-top:.75rem">
          ${sheets.map(x=>`
            <p>
              <a class="button secondary"
                 href="${x.record.imported
                   ? `questions.html?import=${encodeURIComponent(x.record.id)}&program=${encodeURIComponent(x.record.program)}`
                   : `sheet.html?sheet=${encodeURIComponent(x.record.id)}`}">
                ${esc(x.data.title||x.data.source_title||x.record.id)}
              </a>
              <span class="small">
                · ${esc(x.data.provider||'')}
                ${coverageLabel(x.record)?' · '+esc(coverageLabel(x.record)):''}
              </span>
            </p>
          `).join('')}
         </div>`
      : '<p class="small">Aún no hay hojas de preguntas registradas.</p>';

    return `
      <details class="card" data-question-book="${esc(book.id)}"${selected?' open':''}>
        <summary><strong>${esc(book.label)}</strong></summary>
        ${content}
      </details>
    `;
  }

  async function init(){
    const host=document.getElementById('questionBank');
    if(!host)return;

    try{
      const params=new URLSearchParams(location.search);
      const context={
        program:params.get('program')||'',
        book:params.get('book')||''
      };

      const registry=await loadRegistry();

      const staticSheets=await Promise.all(
        (registry.sheets||[]).map(async record=>({
          record,
          data:await loadSheet(record)
        }))
      );

      const imported=importedSheets();
      const loaded=[...staticSheets,...imported];

      const canto8Record=registry.sheets.find(
        x=>x.id==='collected-bved-u2'
      );

      let canto8=null;

      if(canto8Record?.lessonMap){
        const [lessonsResponse,mapResponse]=await Promise.all([
          fetch('../programs/bhakti-vedanta/data/course/lessons.json'),
          fetch('../'+canto8Record.lessonMap)
        ]);

        if(!lessonsResponse.ok || !mapResponse.ok){
          throw new Error('No se pudieron cargar las lecciones del Canto 8.');
        }

        const lessonsData=await lessonsResponse.json();
        const mapping=await mapResponse.json();

        canto8={
          lessons:lessonsData.lessons||[],
          mapping
        };
      }

      host.innerHTML=PROGRAMS.map(program=>{
        const programSheets=loaded.filter(
          x=>x.record.program===program.id
        );

        return `
          <section class="card">
            <h2>${esc(program.label)}</h2>
            ${program.books.map(book=>
              renderBook(
                book,
                programSheets.filter(x=>
                  x.record.book===book.id ||
                  (x.record.imported && x.record.books?.includes(book.id))
                ),
                {...context,programId:program.id,canto8}
              )
            ).join('')}
            ${renderBook(
              {id:'general',label:'Importado / General'},
              programSheets.filter(x=>
                (x.record.imported && !(x.record.books||[]).length) ||
                (program.id==='bhakti-sastri' &&
                 /^academia-bs-u[1-5]$/.test(x.record.id))
              ),
              {...context,programId:program.id,canto8}
            )}
          </section>
        `;
      }).join('');

      if(context.program && context.book){
        const target=[...host.querySelectorAll('[data-question-book]')]
          .find(el=>el.dataset.questionBook===context.book &&
            el.closest('section')?.querySelector('h2')?.textContent===
              PROGRAMS.find(p=>p.id===context.program)?.label);

        target?.scrollIntoView({block:'start'});
      }

    }catch(error){
      host.innerHTML=
        `<div class="card missing">No se pudo cargar el Banco de Preguntas: ${esc(error.message)}</div>`;
    }
  }

  global.CentralQuestionBank={
    programs:PROGRAMS,
    loadRegistry,
    loadSheet,
    importedBooks,
    importedSheets,
    init
  };

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init);
  }else{
    init();
  }
})(window);
