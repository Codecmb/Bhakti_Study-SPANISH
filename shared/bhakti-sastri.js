(async function(){
  const base='../../';
  const [course, reqs, integ] = await Promise.all([
    BhaktiProgramData.loadCourse('data/'),
    DataRegistry.getJSON(base+'slokas/bhakti-sastri-required.json'),
    DataRegistry.getJSON(base+'slokas/integration.json')
  ]);
  const reqMap=Object.fromEntries(reqs.units.map(x=>[x.id,x.references]));
  document.querySelector('#title').textContent=course.title;
  document.querySelector('#subtitle').textContent='Four books · five study units · 45 mapped memorization ślokas';
  const host=document.querySelector('#courseUnits');
  host.innerHTML=course.units.map(u=>{
    const refs=reqMap[u.id]||[];
    return `<section class="card"><div class="eyebrow">${u.id}</div><h2>${u.title}</h2><p>${u.range||''}</p>
      <button class="button saffron slokaToggle" data-id="${u.id}">Ślokas Requeridos (${refs.length})</button>${u.id==='BS.U1'?` <a class="button secondary" href="../../question-bank/sheet.html?sheet=boex-bg-1-6">Preguntas Oficiales de BOEX</a> <a class="button secondary" href="bg-1-6-most-quoted.html">Más Citados por Śrīla Prabhupāda</a> <a class="button secondary" href="../../admin/study-guides.html">Administrar Academia</a>`:''}
      <div id="slokas-${u.id}" hidden class="sloka-list">${refs.map(r=>{const c=(window.SourceResolver?.canon?.(r)||r);const m=String(c).match(/^BG\.(\d+)\.(\d+)$/);const href=(u.id==='BS.U1'&&m&&+m[1]>=1&&+m[1]<=6)?`bg-1-6.html?ref=${encodeURIComponent(c)}`:`../../slokas/index.html?ref=${encodeURIComponent(r)}`;return `<a class="sloka-link" href="${href}">${r}</a>`}).join('')}</div>
      <div class="action-grid">${StudyWorkflow.buttons(course,{program:'bhakti-sastri',unit:u.id})}</div></section>`;
  }).join('');
  host.addEventListener('click',e=>{if(!e.target.matches('.slokaToggle'))return; const x=document.getElementById('slokas-'+e.target.dataset.id);x.hidden=!x.hidden;});
  document.querySelector('#slokaProvider').textContent=`Ślokas Requeridos open the Academy's internal primary-source verse first. Śloka Lab (${integ.provider}) is optional and used only for memorization practice.`;
})();
