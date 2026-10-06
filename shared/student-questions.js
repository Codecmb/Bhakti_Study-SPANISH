(function(global){
  const TYPE='my-question';
  const uid=()=>`q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  function list(program=''){
    return StudentStore.entries(TYPE).map(x=>{try{return JSON.parse(x.value)}catch{return null}}).filter(Boolean).filter(q=>!program||q.program===program).sort((a,b)=>(b.updatedAt||'').localeCompare(a.updatedAt||''));
  }
  function save(q){
    const now=new Date().toISOString();
    const rec={id:q.id||uid(),question:String(q.question||'').trim(),program:q.program||'',unit:q.unit||'',canonical:q.canonical||'',scope:q.scope||'book',linkedSources:Array.isArray(q.linkedSources)?q.linkedSources:[],myAnswer:q.myAnswer||'',revisedAnswer:q.revisedAnswer||'',status:q.status||'studying',createdAt:q.createdAt||now,updatedAt:now};
    if(!rec.question)throw new Error('La pregunta es obligatoria.'); StudentStore.setJSON(TYPE,rec.id,rec);return rec;
  }
  function get(id){return StudentStore.getJSON(TYPE,id,null)}
  function remove(id){StudentStore.remove(TYPE,id)}
  function link(id,source){const q=get(id);if(!q)return null;const c=source.canonical;if(!q.linkedSources.some(x=>x.canonical===c))q.linkedSources.push(source);return save(q)}
  global.StudentQuestions={list,save,get,remove,link};
})(window);
