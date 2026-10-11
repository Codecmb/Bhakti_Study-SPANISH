(function(global){
  const PREFIX='bhakti-study.student.v1';
  const key=(type,id)=>`${PREFIX}.${type}.${id}`;
  function get(type,id,fallback=''){const v=localStorage.getItem(key(type,id));return v===null?fallback:v}
  function set(type,id,value){localStorage.setItem(key(type,id),String(value??''));return value}
  function remove(type,id){localStorage.removeItem(key(type,id))}
  function getJSON(type,id,fallback=null){const v=get(type,id,null);if(v===null)return fallback;try{return JSON.parse(v)}catch{return fallback}}
  function setJSON(type,id,value){return set(type,id,JSON.stringify(value))}
  function migrate(oldKey,type,id){const modern=key(type,id);if(localStorage.getItem(modern)!==null)return localStorage.getItem(modern);const old=localStorage.getItem(oldKey);if(old!==null){localStorage.setItem(modern,old);return old}return null}
  function has(type,id){return localStorage.getItem(key(type,id))!==null}
  function entries(type){
    const prefix=`${PREFIX}.${type}.`,out=[];
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i)||'';if(!k.startsWith(prefix))continue;
      out.push({id:k.slice(prefix.length),value:localStorage.getItem(k)});
    }
    return out;
  }
  function count(type,prefix=''){return entries(type).filter(x=>!prefix||x.id.startsWith(prefix)).length}
  function allEntries(){
    const prefix=`${PREFIX}.`,out=[];
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i)||''; if(!k.startsWith(prefix))continue;
      const rest=k.slice(prefix.length),dot=rest.indexOf('.');
      if(dot<1)continue;
      out.push({type:rest.slice(0,dot),id:rest.slice(dot+1),value:localStorage.getItem(k)});
    }
    return out;
  }
  function exportBackup(){
    return {format:'bhakti-study-student-backup',version:1,exported_at:new Date().toISOString(),records:allEntries()};
  }
  function importBackup(data,{replace=false}={}){
    if(!data||data.format!=='bhakti-study-student-backup'||data.version!==1||!Array.isArray(data.records))throw Error('El archivo de respaldo de Bhakti Study no tiene un formato compatible.');
    if(replace) allEntries().forEach(r=>remove(r.type,r.id));
    let imported=0;
    data.records.forEach(r=>{if(r&&typeof r.type==='string'&&typeof r.id==='string'){set(r.type,r.id,r.value??'');imported++;}});
    return imported;
  }
  global.StudentStore={get,set,remove,getJSON,setJSON,migrate,key,has,entries,count,allEntries,exportBackup,importBackup};
})(window);
