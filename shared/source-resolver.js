(function(){
  let manifest=null; const shardCache=new Map();
  const rootFromPath=()=>{const p=location.pathname; if(p.includes('/programs/'))return '../../'; if(p.includes('/library/')||p.includes('/student/')||p.includes('/slokas/')||p.includes('/certificates/')||p.includes('/admin/')||p.includes('/references/')||p.includes('/question-bank/'))return '../'; return './'};
  function canon(raw){let s=String(raw||'').trim().replace(/[–—]/g,'-').replace(/\s+/g,' '),m;
    m=s.match(/^(?:BG|Bhagavad[- ]g[iī]t[aā])\s*[ .]?(\d+)\s*[.:]\s*(\d+(?:-\d+)?)$/i);if(m)return `BG.${m[1]}.${m[2]}`;
    m=s.match(/^(?:SB|Śrīmad[- ]Bhāgavatam|Srimad[- ]Bhagavatam)\s*[ .]?(\d+)\s*[.:]\s*(\d+)\s*[.:]\s*(\d+(?:-\d+)?)$/i);if(m)return `SB.${m[1]}.${m[2]}.${m[3]}`;
    m=s.match(/^(?:CC|Caitanya[- ]carit[aā]mṛta)\s+(Adi|Ādi|Madhya|Antya)\s+(\d+)\s*[.:]\s*(\d+(?:-\d+)?)$/i);if(m){let l=m[1].normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();return `CC.${l}.${m[2]}.${m[3]}`}
    m=s.match(/^(?:ISO|Śrī Īśopaniṣad|Sri Isopanisad|Isopanisad)\s*[ .]?(?:Mantra\s*)?(\d+)$/i);if(m)return `ISO.${m[1]}`;
    m=s.match(/^(?:NOI|Nectar of Instruction)\s*[ .]?(?:Text\s*)?(\d+)$/i);if(m)return `NOI.${m[1]}`;
    m=s.match(/^(?:NOD|Nectar of Devotion)\s*[ .]?(?:Chapter\s*)?(\d+)$/i);if(m)return `NOD.${m[1]}`;return null}
  function external(c){if(!c)return null;let p=c.split('.');if(p[0]==='BG')return `https://vedabase.cc/es/bg/${p[1]}/${p[2].split('-')[0]}/`;if(p[0]==='SB')return `https://vedabase.io/en/library/sb/${p[1]}/${p[2]}/${p[3]}/`;if(p[0]==='CC')return `https://vedabase.io/en/library/cc/${p[1].toLowerCase()}/${p[2]}/${p[3]}/`;return null}
  function shardId(c){let p=c.split('.');if(p[0]==='SB')return `sb-canto-${String(+p[1]).padStart(2,'0')}`;if(p[0]==='CC')return `cc-${p[1].toLowerCase()}`;return p[0].toLowerCase()}
  async function ready(){if(manifest)return manifest;manifest=await (window.DataRegistry?DataRegistry.getJSON(rootFromPath()+'data/sources/canonical-index/manifest.json'):fetch(rootFromPath()+'data/sources/canonical-index/manifest.json').then(r=>{if(!r.ok)throw Error(r.status);return r.json()})).catch(()=>({shards:[]}));return manifest}
  async function shard(c){await ready();const id=shardId(c);if(shardCache.has(id))return shardCache.get(id);const meta=manifest.shards.find(x=>x.id===id);if(!meta)return {records:{}};const url=rootFromPath()+'data/sources/canonical-index/'+meta.path;const p=(window.DataRegistry?DataRegistry.getJSON(url):fetch(url).then(r=>r.json())).catch(()=>({records:{}}));shardCache.set(id,p);return p}
  async function internal(c){const s=await shard(c);return s.records?.[c]||null}
  function internalHref(c,hit){const aliases={'sb-1':'sb1','sb-2':'sb2','sb-3':'sb3','sb-4':'sb4','sb-5':'sb5','sb-6':'sb6','sb-7':'sb7','sb-8':'sb8','sb-9':'sb9','sb-10':'sb10','sb-11':'sb11','sb-12':'sb12'};const book=aliases[hit.book]||hit.book;return rootFromPath()+`library/reader.html?book=${encodeURIComponent(book)}&ref=${encodeURIComponent(c)}`}
  async function resolve(raw){let c=canon(raw)||raw;if(!c)return null;let hit=await internal(c);if(hit)return {canonical:c,kind:'internal',href:internalHref(c,hit),label:'Read in Academy'};let url=external(c);return url?{canonical:c,kind:'external',href:url,label:'Vedabase ↗'}:null}
  async function linkify(el){
    if(!el)return;
    const re=/(?:BG\s+\d+\.\d+(?:-\d+)?|SB\s+\d+\.\d+\.\d+(?:-\d+)?|CC\s+(?:Adi|Ādi|Madhya|Antya)\s+\d+\.\d+(?:-\d+)?)/gi;
    const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),nodes=[],wanted=new Set();
    while(walker.nextNode())nodes.push(walker.currentNode);
    for(const n of nodes){if(n.parentElement?.closest('a,button,textarea,script,style'))continue;re.lastIndex=0;let m;while((m=re.exec(n.nodeValue||''))){const c=canon(m[0]);if(c)wanted.add(c)}}
    const resolved=new Map(await Promise.all([...wanted].map(async c=>[c,await internal(c)])));
    for(const n of nodes){
      if(n.parentElement?.closest('a,button,textarea,script,style'))continue;
      const t=n.nodeValue||'';let last=0,m,frag=document.createDocumentFragment(),changed=false;re.lastIndex=0;
      while((m=re.exec(t))){const c=canon(m[0]);if(!c)continue;const hit=resolved.get(c),href=hit?internalHref(c,hit):external(c);if(!href)continue;frag.append(t.slice(last,m.index));const a=document.createElement('a');a.href=href;a.textContent=m[0];a.className='scripture-ref';if(!hit){a.target='_blank';a.rel='noopener';a.title='Alternativa externa en Vedabase'}else a.title='Abrir fuente interna de la Academia';frag.append(a);last=m.index+m[0].length;changed=true}
      if(changed){frag.append(t.slice(last));n.replaceWith(frag)}
    }
  }
  window.SourceResolver={canon,external,ready,internal,resolve,linkify,internalHref};
})();
