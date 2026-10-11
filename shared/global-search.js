(function(global){
  'use strict';

  const concepts = [
    ['alma','atman','atma','jiva','entidad viviente','soul','living entity'],
    ['devocion','bhakti','servicio devocional','devotion','devotional service'],
    ['conocimiento','jnana','jñana','knowledge'],
    ['accion','karma','action','work'],
    ['liberacion','moksha','moksa','mukti','liberation'],
    ['dios','bhagavan','bhagavān','suprema personalidad de dios','god'],
    ['superalma','paramatma','paramātmā','supersoul'],
    ['naturaleza material','prakriti','prakrti','prakṛti','material nature'],
    ['ilusion','maya','māyā','illusion'],
    ['amor por dios','prema','love of god']
  ];

  const normalize = value => String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,' ')
    .replace(/\s+/g,' ')
    .trim();

  const conceptGroups = concepts.map(group =>
    [...new Set(group.map(normalize))]
  );

  function expand(query){
    const q=normalize(query);
    const terms=new Set([q]);

    for(const group of conceptGroups){
      if(group.some(term =>
        q===term ||
        q.split(' ').includes(term) ||
        (term.includes(' ') && q.includes(term))
      )){
        group.forEach(term=>terms.add(term));
      }
    }

    return [...terms].filter(Boolean);
  }

  function search(query,records,{
    mode='both',
    limit=50
  }={}){
    const q=normalize(query);
    if(!q || !Array.isArray(records))return [];

    const terms=mode==='literal'?[q]:expand(q);
    const results=[];

    for(const record of records){
      const text=normalize([
        record.title,
        record.text,
        record.reference,
        record.author
      ].filter(Boolean).join(' '));

      if(!text)continue;

      let score=0;
      let matchType='';

      if(text.includes(q)){
        score=100;
        matchType='literal';
      }else if(mode!=='literal'){
        const matches=terms.filter(t=>t!==q && text.includes(t));
        if(matches.length){
          score=40+Math.min(matches.length,5)*5;
          matchType='conceptual';
        }
      }

      if(score){
        results.push({...record,score,matchType});
      }
    }

    return results
      .sort((a,b)=>b.score-a.score)
      .slice(0,limit);
  }

  global.GlobalSearch={
    normalize,
    expand,
    search
  };
})(window);
