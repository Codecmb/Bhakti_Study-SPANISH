(function(global){
const KEY='bhakti_academy_guides_v1';

function load(){
  try{
    const data=JSON.parse(localStorage.getItem(KEY)||'[]');
    return Array.isArray(data)?data:[];
  }catch{
    return [];
  }
}

function save(x){
  localStorage.setItem(KEY,JSON.stringify(x));
  return x;
}

function id(){
  return 'guide-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
}

function programOf(item){
  return String(item?.program||'bhakti-sastri');
}

function forProgram(program){
  return load().filter(item=>programOf(item)===program);
}

function refs(text){
  const source=String(text||'');
  const found=[];

  const patterns=[
    {
      re:/\b(?:BG|Bhagavad[- ]g(?:ī|i)t(?:ā|a))\s*\.?\s*(\d{1,2})\s*[.:]\s*(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?/gi,
      make:m=>'BG.'+m[1]+'.'+m[2]
    },
    {
      re:/\bSB\s*\.?\s*(\d{1,2})\s*[.:]\s*(\d{1,3})\s*[.:]\s*(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?/gi,
      make:m=>'SB.'+m[1]+'.'+m[2]+'.'+m[3]
    },
    {
      re:/\bCC\s*\.?\s*(ADI|MADHYA|ANTYA)\s*[.:]\s*(\d{1,3})\s*[.:]\s*(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?/gi,
      make:m=>'CC.'+m[1].toUpperCase()+'.'+m[2]+'.'+m[3]
    },
    {
      re:/\bISO\s*\.?\s*(\d{1,3})\b/gi,
      make:m=>'ISO.'+m[1]
    },
    {
      re:/\bNOD\s*\.?\s*(\d{1,3})\b/gi,
      make:m=>'NOD.'+m[1]
    },
    {
      re:/\bNOI\s*\.?\s*(\d{1,3})\b/gi,
      make:m=>'NOI.'+m[1]
    }
  ];

  patterns.forEach(({re,make})=>{
    let m;
    while((m=re.exec(source))){
      const ref=make(m);
      if(!found.includes(ref))found.push(ref);
    }
  });

  return found;
}

function questions(text){
  return String(text||'')
    .split(/\n+/)
    .map(s=>s.trim().replace(/^[-•*\d.)\s]+/,''))
    .filter(s=>s.length>8&&s.includes('?'))
    .map(q=>({
      id:id(),
      text:q,
      refs:refs(q),
      required:true
    }));
}

function internalHref(ref,program='bhakti-sastri',unit=''){
  const canonical=String(ref||'').trim();
  const p=String(program||'bhakti-sastri');

  if(p==='bhakti-sastri' && /^BG[. ]/i.test(canonical)){
    return 'bg-1-6.html?ref='+encodeURIComponent(canonical);
  }

  if((p==='bhakti-vaibhava'||p==='bhakti-vedanta') &&
     /^SB[. ]/i.test(canonical)){
    return 'sb.html?ref='+encodeURIComponent(canonical)+
      (unit?'&unit='+encodeURIComponent(unit):'');
  }

  if(p==='bhakti-sarvabhauma' && /^CC[. ]/i.test(canonical)){
    return 'cc.html?ref='+encodeURIComponent(canonical)+
      (unit?'&unit='+encodeURIComponent(unit):'');
  }

  const book=/^NOD\./i.test(canonical)?'nod-es':canonical.split('.')[0].toLowerCase();

  return '../../library/reader.html?'+new URLSearchParams({
    book,
    ref:canonical,
    program:p,
    ...(unit?{unit}:{})
  }).toString();
}

global.AcademyGuides={
  load,
  save,
  id,
  refs,
  questions,
  internalHref,
  programOf,
  forProgram,

  add(g){
    const a=load();
    a.push(g);
    return save(a);
  },

  update(gid,patch={}){
    const items=load();
    const index=items.findIndex(x=>x.id===gid);
    if(index<0)return null;

    items[index]={
      ...items[index],
      ...patch,
      id:items[index].id
    };

    save(items);
    return items[index];
  },

  remove(gid){
    return save(load().filter(x=>x.id!==gid));
  },

  get(gid){
    return load().find(x=>x.id===gid);
  }
};
})(window);
