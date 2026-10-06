(function(){
  const PREFIX='bhakti-study.imported-questions.';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid=()=>`IQ.${Date.now().toString(36)}.${Math.random().toString(36).slice(2,8)}`;
  const key=program=>PREFIX+program;
  const readAll=program=>{try{return JSON.parse(localStorage.getItem(key(program))||'[]')}catch{return []}};
  const writeAll=(program,items)=>localStorage.setItem(key(program),JSON.stringify(items));
  const rtfToText=s=>s.replace(/\\par[d]?\b/g,'\n').replace(/\\'[0-9a-fA-F]{2}/g,' ').replace(/\\[a-zA-Z]+-?\d* ?/g,'').replace(/[{}]/g,'').replace(/\r/g,'');
  function batches(program){
    const groups=new Map();

    readAll(program).forEach(item=>{
      if(item.provider!=='student-import')return;

      const provenance=item.provenance||{};
      const legacyKey=[
        provenance.imported_at||'',
        provenance.source_file||'',
        provenance.title||'',
        provenance.author||''
      ].join('|');

      const importId=item.import_id||(
        provenance.imported_at
          ? `legacy.${legacyKey}`
          : `legacy.${item.id}`
      );
      if(!groups.has(importId)){
        groups.set(importId,{
          id:importId,
          title:item.provenance?.title||'Hoja de preguntas importada',
          author:item.provenance?.author||'',
          source_file:item.provenance?.source_file||'',
          imported_at:item.provenance?.imported_at||'',
          legacy:!item.import_id,
          questions:[]
        });
      }

      groups.get(importId).questions.push(item);
    });

    return [...groups.values()];
  }

  function removeBatch(program,importId){
    if(!program||!importId)return 0;

    const items=readAll(program);
    const legacy=String(importId).startsWith('legacy.');

    const matches=item=>{
      if(item.provider!=='student-import')return false;

      if(!legacy)return item.import_id===importId;
      if(item.import_id)return false;

      const provenance=item.provenance||{};
      if(!provenance.imported_at)return `legacy.${item.id}`===importId;

      const legacyKey=[
        provenance.imported_at||'',
        provenance.source_file||'',
        provenance.title||'',
        provenance.author||''
      ].join('|');

      return `legacy.${legacyKey}`===importId;
    };

    const kept=items.filter(item=>!matches(item));
    const removed=items.length-kept.length;

    if(removed)writeAll(program,kept);
    return removed;
  }

  function update(program,id,patch={}){
    if(!program||!id)return null;
    const items=readAll(program);
    const index=items.findIndex(x=>x.id===id&&x.provider==='student-import');
    if(index<0)return null;

    const current=items[index];
    const next={
      ...current,
      ...patch,
      id:current.id,
      provider:current.provider,
      provenance:current.provenance
    };

    items[index]=next;
    writeAll(program,items);
    return next;
  }

  function detect(text){
    const src=String(text||'').replace(/\r/g,'\n').replace(/\n{3,}/g,'\n\n').trim(); if(!src)return [];
    const lines=src.split(/\n+/).map(x=>x.trim()).filter(Boolean),out=[];let current='';
    const starts=/^(?:question\s*)?(?:\d{1,4}|[A-Za-z])[.)\-:]\s+(.+)/i;
    for(const line of lines){const m=line.match(starts);if(m){if(current)out.push(current.trim());current=m[1].trim();continue}if(current){current+=' '+line;if(/[?]$/.test(line)){out.push(current.trim());current=''};continue}if(/[?]$/.test(line))out.push(line)}
    if(current)out.push(current.trim());return [...new Set(out.map(x=>x.replace(/^[-•]\s*/,'')))].filter(x=>x.length>=8);
  }
  function parseCSV(raw){
    const rows=[];let row=[],cell='',quoted=false;
    for(let i=0;i<raw.length;i++){const c=raw[i],n=raw[i+1];if(c==='"'){if(quoted&&n==='"'){cell+='"';i++}else quoted=!quoted}else if(c===','&&!quoted){row.push(cell);cell=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&n==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell=''}else cell+=c}
    row.push(cell);if(row.some(x=>x.trim()))rows.push(row);return rows;
  }
  function csvQuestions(raw){
    const rows=parseCSV(raw);if(!rows.length)return [];
    const headers=rows[0].map(x=>x.trim().toLowerCase());
    const aliases=['question','questions','prompt','study question','study_question','question_text','text'];
    let qi=headers.findIndex(h=>aliases.includes(h));let start=1;
    if(qi<0){const firstLooksHeader=headers.some(h=>/question|prompt|chapter|canto|verse|id|answer/.test(h));start=firstLooksHeader?1:0;qi=rows.reduce((best,r)=>r.length>best? r.length:best,0)===1?0:-1}
    let qs=[];
    if(qi>=0)qs=rows.slice(start).map(r=>(r[qi]||'').trim()).filter(Boolean);
    else qs=rows.slice(start).flatMap(r=>r.map(x=>x.trim()).filter(x=>x.endsWith('?')));
    return [...new Set(qs)].filter(x=>x.length>=8);
  }
  async function pdfText(file){
    const pdfjsLib=await import('./vendor/pdfjs/pdf.mjs');
    const worker='../../shared/vendor/pdfjs/pdf.worker.mjs';
    pdfjsLib.GlobalWorkerOptions.workerSrc=worker;
    const pdf=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;const pages=[];
    for(let n=1;n<=pdf.numPages;n++){const page=await pdf.getPage(n),content=await page.getTextContent();pages.push(content.items.map(x=>x.str).join(' '))}
    return pages.join('\n');
  }
  async function odtText(file){
    if(!window.JSZip)throw new Error('JSZip is not loaded.');
    const zip=await JSZip.loadAsync(await file.arrayBuffer());
    const entry=zip.file('content.xml');
    if(!entry)throw new Error('No se encontró content.xml en el archivo ODT.');

    const xml=await entry.async('string');
    const doc=new DOMParser().parseFromString(xml,'application/xml');
    if(doc.querySelector('parsererror'))throw new Error('No se pudo procesar content.xml del archivo ODT.');

    return Array.from(doc.getElementsByTagName('*'))
      .filter(el=>el.localName==='p'||el.localName==='h')
      .map(el=>el.textContent.trim())
      .filter(Boolean)
      .join('\n');
  }

  async function fileText(file){
    const ext=(file.name.split('.').pop()||'').toLowerCase();
    if(ext==='csv'){const raw=await file.text(),questions=csvQuestions(raw);return {text:questions.map((q,i)=>`${i+1}. ${q}`).join('\n'),automatic:true,questions,note:`Read ${questions.length} question${questions.length===1?'':'s'} from CSV.`}}
    if(['txt','md','rtf'].includes(ext)){const raw=await file.text();return {text:ext==='rtf'?rtfToText(raw):raw,automatic:true}}
    if(ext==='pdf'){try{const text=await pdfText(file);return {text,automatic:true,note:'PDF text extracted locally in your browser.'}}catch(e){return {text:'',automatic:false,reason:e.message+' The file was not uploaded. Install the bundled PDF.js files, then drop it again.'}}}
    if(ext==='odt'){try{const text=await odtText(file);return {text,automatic:true,note:'El texto del ODT de LibreOffice se extrajo localmente en tu navegador.'}}catch(e){return {text:'',automatic:false,reason:'No se pudo leer este archivo ODT: '+e.message}}}
    return {text:'',automatic:false,reason:`${ext.toUpperCase()||'Este tipo de archivo'} todavía no tiene extracción instalada. Se conserva el nombre del archivo fuente; pega el texto de las preguntas abajo si deseas continuar.`};
  }
  function list(program,scopes=[]){const S=new Set(scopes.filter(Boolean));return readAll(program).filter(q=>!q.canonical_ref||S.has(q.canonical_ref)||S.has(q.unit));}
  function renderBatchManagement(host,{program,onRemoved=()=>location.reload()}={}){
    if(!host||!program)return;

    const items=batches(program);

    if(!items.length){
      host.innerHTML='';
      return;
    }

    host.innerHTML=`<div class="imported-sheet-management">
      <h4>Imported Sheets</h4>
      ${items.map(batch=>`
        <div class="notice" style="margin:.5rem 0">
          <strong>${esc(batch.title)}</strong>
          <div class="small">${batch.questions.length} question${batch.questions.length===1?'':'s'}${batch.source_file?` · ${esc(batch.source_file)}`:''}</div>
          <p><button class="button secondary qsiRemoveManagedBatch" type="button" data-import-id="${esc(batch.id)}">Remove Imported Sheet</button></p>
        </div>
      `).join('')}
    </div>`;

    host.querySelectorAll('.qsiRemoveManagedBatch').forEach(btn=>btn.onclick=()=>{
      const batch=items.find(x=>x.id===btn.dataset.importId);
      if(!batch)return;

      if(!confirm(`¿Eliminar "${batch.title}" y sus ${batch.questions.length} pregunta${batch.questions.length===1?'':'s'} importada${batch.questions.length===1?'':'s'}?`))return;

      const removed=removeBatch(program,batch.id);
      if(removed)onRemoved({batch,removed});
    });
  }

  function render(host,opts={}){
    const program=opts.program,unit=opts.unit||'',canonical=opts.canonical||'',onImported=opts.onImported||(()=>location.reload());
    host.innerHTML=`<details class="question-importer"><summary><strong>Importar Hoja de Preguntas</strong></summary><div style="padding-top:.75rem"><p class="small">Arrastra y suelta una hoja de preguntas o selecciona un archivo. Los archivos CSV, PDF, TXT, Markdown y RTF se extraen localmente en el navegador. No se sube ningún archivo.</p><div id="qsiDrop" class="notice" style="border:2px dashed currentColor;text-align:center;padding:1.25rem;cursor:pointer">Suelta aquí la hoja de preguntas<br><span class="small">o haz clic para seleccionar un archivo</span><input id="qsiFile" type="file" accept=".csv,.txt,.md,.rtf,.pdf,.odt,.docx" hidden></div><p id="qsiFileName" class="small"></p><label class="small">Título de la fuente</label><input id="qsiTitle" class="field" placeholder="p. ej., Guía de Estudio de Bhakti Vaibhava"><label class="small">Profesor / autor (dejar en blanco si se desconoce)</label><input id="qsiAuthor" class="field" placeholder="Name"><label class="small">Texto de las preguntas</label><textarea id="qsiText" class="field" rows="8" placeholder="El texto extraído aparece aquí. También puedes pegar preguntas aquí."></textarea><p><button id="qsiPreview" class="button secondary" type="button">Vista Previa de las Preguntas</button></p><div id="qsiPreviewBox"></div><p id="qsiMsg" class="small"></p><div id="qsiBatches"></div></div></details>`;
    const $=s=>host.querySelector(s),drop=$('#qsiDrop'),fileInput=$('#qsiFile'),text=$('#qsiText'),msg=$('#qsiMsg'),preview=$('#qsiPreviewBox'),batchBox=$('#qsiBatches');let sourceFile='',found=[],preDetected=[];

    function renderBatches(){
      const items=batches(program);

      if(!items.length){
        batchBox.innerHTML='';
        return;
      }

      batchBox.innerHTML=`<hr><h4>Imported Sheets</h4>${items.map(batch=>`
        <div class="notice" style="margin:.5rem 0">
          <strong>${esc(batch.title)}</strong>
          <div class="small">${batch.questions.length} question${batch.questions.length===1?'':'s'}${batch.source_file?` · ${esc(batch.source_file)}`:''}</div>
          <p><button class="button secondary qsiRemoveBatch" type="button" data-import-id="${esc(batch.id)}">Remove Imported Sheet</button></p>
        </div>
      `).join('')}`;

      batchBox.querySelectorAll('.qsiRemoveBatch').forEach(btn=>btn.onclick=()=>{
        const batch=items.find(x=>x.id===btn.dataset.importId);
        if(!batch)return;

        if(!confirm(`¿Eliminar "${batch.title}" y sus ${batch.questions.length} pregunta${batch.questions.length===1?'':'s'} importada${batch.questions.length===1?'':'s'}?`))return;

        const removed=removeBatch(program,batch.id);
        if(!removed)return;

        msg.textContent=`Se eliminaron ${removed} pregunta${removed===1?'':'s'} importada${removed===1?'':'s'} de "${batch.title}".`;
        renderBatches();
        onImported([]);
      });
    }

    renderBatches();
    async function take(file){if(!file)return;sourceFile=file.name;preDetected=[];$('#qsiFileName').textContent=`Archivo fuente: ${file.name}`;if(!$('#qsiTitle').value)$('#qsiTitle').value=file.name.replace(/\.[^.]+$/,'');msg.textContent='Leyendo el archivo localmente…';const got=await fileText(file);if(got.automatic){text.value=got.text;preDetected=got.questions||[];msg.textContent=got.note||'Texto extraído localmente. Revísalo y luego visualiza las preguntas.'}else{msg.textContent=got.reason}}
    drop.onclick=()=>fileInput.click();fileInput.onchange=()=>take(fileInput.files[0]);['dragenter','dragover'].forEach(e=>drop.addEventListener(e,x=>{x.preventDefault();drop.style.opacity='.75'}));['dragleave','drop'].forEach(e=>drop.addEventListener(e,x=>{x.preventDefault();drop.style.opacity='1'}));drop.addEventListener('drop',e=>take(e.dataTransfer.files[0]));
    $('#qsiPreview').onclick=()=>{found=preDetected.length?preDetected:detect(text.value);if(!found.length){preview.innerHTML='';msg.textContent='No se detectaron preguntas. La fuente se mantuvo intacta; no se importó ninguna pregunta.';return}preview.innerHTML=`<h4>Vista Previa — ${found.length} pregunta${found.length===1?'':'s'}</h4><ol>${found.map(q=>`<li>${esc(q)}</li>`).join('')}</ol><p><button id="qsiImport" class="button" type="button">Importar ${found.length} Pregunta${found.length===1?'':'s'}</button></p>`;msg.textContent='Revisa antes de importar. Todavía no se ha guardado nada.';$('#qsiImport').onclick=()=>{const title=$('#qsiTitle').value.trim()||sourceFile||'Hoja de preguntas importada',author=$('#qsiAuthor').value.trim(),now=new Date().toISOString(),importId=`IMPORT.${Date.now().toString(36)}.${Math.random().toString(36).slice(2,8)}`;const records=found.map((question,i)=>({id:uid(),import_id:importId,provider:'student-import',source_question_id:String(i+1),question,kind:'pregunta de estudio importada',canonical_ref:canonical||null,unit:unit||null,canonical_sources:canonical?[canonical]:[],provenance:{provider:'student-import',title,author,source_file:sourceFile,imported_at:now}}));const all=readAll(program);writeAll(program,all.concat(records));msg.textContent=`Se importaron ${records.length} preguntas.`;onImported(records)}};
  }
  window.QuestionSheetImporter={render,renderBatchManagement,list,batches,removeBatch,update,detect,csvQuestions};
})();
