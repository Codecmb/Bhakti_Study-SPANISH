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

  function renderBook(book,sheets,context={}){
    const selected=context.program===context.programId && context.book===book.id;
    const content=sheets.length
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
                {...context,programId:program.id}
              )
            ).join('')}
            ${renderBook(
              {id:'general',label:'Importado / General'},
              programSheets.filter(x=>
                x.record.imported && !(x.record.books||[]).length
              ),
              {...context,programId:program.id}
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
