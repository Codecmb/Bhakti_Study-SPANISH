(function(global){
  const fallbackCache=new Map();
  function fetchJson(url){
    if(global.DataRegistry)return global.DataRegistry.getJSON(url);
    if(fallbackCache.has(url))return fallbackCache.get(url);
    const p=fetch(url).then(r=>{if(!r.ok)throw new Error(`No se pudo cargar ${url}: ${r.status}`);return r.json()}).catch(e=>{fallbackCache.delete(url);throw e});
    fallbackCache.set(url,p);return p;
  }
  async function loadProviders(base='data/'){
    const key=`providers:${base}`;
    const run=async()=>{
      const manifest=await fetchJson(`${base}question-provider-manifest.json`);
      const parts=await Promise.all((manifest.modules||[]).map(m=>fetchJson(`${base}${m.path}`)));
      return {schema:manifest.schema,providers:parts.map(x=>x.provider),__manifest:manifest};
    };
    return global.DataRegistry?global.DataRegistry.cached(key,run):run();
  }
  global.BhaktiQuestionProviders={loadProviders,fetchJson};
})(window);
