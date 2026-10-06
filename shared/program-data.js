(function(global){
  const fallbackCache=new Map();
  function fetchJson(url){
    if(global.DataRegistry)return global.DataRegistry.getJSON(url);
    if(fallbackCache.has(url))return fallbackCache.get(url);
    const p=fetch(url).then(r=>{if(!r.ok)throw new Error(`No se pudo cargar ${url}: ${r.status}`);return r.json()}).catch(e=>{fallbackCache.delete(url);throw e});
    fallbackCache.set(url,p);return p;
  }
  function merge(target,part){Object.keys(part||{}).forEach(k=>{target[k]=part[k]});return target}
  async function loadCourse(base='data/'){
    const key=`course:${base}`;
    const run=async()=>{
      const manifest=await fetchJson(`${base}course-manifest.json`);
      const parts=await Promise.all((manifest.modules||[]).map(m=>fetchJson(`${base}${m.path}`)));
      return parts.reduce(merge,{__manifest:manifest});
    };
    return global.DataRegistry?global.DataRegistry.cached(key,run):run();
  }
  global.BhaktiProgramData={loadCourse,fetchJson};
})(window);
