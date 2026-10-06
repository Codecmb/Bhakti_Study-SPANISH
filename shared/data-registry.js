(function(global){
  const jsonCache=new Map();
  const valueCache=new Map();
  const stats={networkRequests:0,cacheHits:0};

  function getJSON(url){
    if(jsonCache.has(url)){stats.cacheHits++;return jsonCache.get(url)}
    stats.networkRequests++;
    const p=fetch(url,{cache:'default'}).then(r=>{
      if(!r.ok)throw new Error(`${r.status} ${url}`);
      return r.json();
    }).catch(err=>{jsonCache.delete(url);throw err});
    jsonCache.set(url,p);
    return p;
  }

  function cached(key,loader){
    if(valueCache.has(key)){stats.cacheHits++;return valueCache.get(key)}
    const p=Promise.resolve().then(loader).catch(err=>{valueCache.delete(key);throw err});
    valueCache.set(key,p);return p;
  }

  function preloadJSON(url){getJSON(url).catch(()=>{});}

  async function loadManifestModules(manifestUrl,baseUrl,moduleField='modules'){
    return cached(`manifest:${manifestUrl}`,async()=>{
      const manifest=await getJSON(manifestUrl);
      const modules=manifest[moduleField]||[];
      const parts=await Promise.all(modules.map(m=>getJSON(baseUrl+m.path)));
      return {manifest,parts};
    });
  }

  async function questionBanks(base){
    try{
      const registry=await getJSON(base+'data/questions/banks.json');
      return registry.banks||[];
    }catch(err){
      const manifest=await getJSON(base+'data/questions/manifest.json');
      return [{id:manifest.provider||'default',label:manifest.provider||'Preguntas de Estudio',description:'Banco de preguntas del curso',manifest:'manifest.json',provider:manifest.provider||''}];
    }
  }

  async function questionShards(base,scopes,bankId){
    const banks=await questionBanks(base);
    const bank=(bankId&&banks.find(b=>b.id===bankId))||banks.find(b=>b.default)||banks[0];
    if(!bank)return [];
    const manifestPath=bank.manifest||'manifest.json';
    const manifest=await getJSON(base+'data/questions/'+manifestPath);
    const wanted=new Set(scopes||[]);
    const rows=(manifest.shards||[]).filter(s=>wanted.has(s.scope));
    const manifestDir=manifestPath.includes('/')?manifestPath.slice(0,manifestPath.lastIndexOf('/')+1):'';
    const parts=await Promise.all(rows.map(s=>getJSON(base+'data/questions/'+manifestDir+s.path)));
    return parts.flatMap(x=>(x.questions||[]).map(q=>({...q,question_bank_id:q.question_bank_id||bank.id,question_bank_label:q.question_bank_label||bank.label})));
  }

  global.DataRegistry={getJSON,cached,preloadJSON,loadManifestModules,questionBanks,questionShards,stats};
})(window);
