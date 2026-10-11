(function(global){
  const TYPE='highlight';
  let root=null;
  let ref='';
  let popup=null;

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));

  function records(){
    if(!global.StudentStore||!ref)return [];
    return StudentStore.getJSON(TYPE,ref,[])||[];
  }

  function save(items){
    if(!global.StudentStore||!ref)return;
    if(items.length) StudentStore.setJSON(TYPE,ref,items);
    else StudentStore.remove(TYPE,ref);
  }

  function textNodes(host){
    const walker=document.createTreeWalker(
      host,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node){
          if(!node.nodeValue)return NodeFilter.FILTER_REJECT;
          if(node.parentElement?.closest('mark[data-student-highlight]'))
            return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    const out=[];
    while(walker.nextNode())out.push(walker.currentNode);
    return out;
  }

  function unwrap(){
    if(!root)return;
    root.querySelectorAll('mark[data-student-highlight]').forEach(mark=>{
      mark.replaceWith(document.createTextNode(mark.textContent||''));
    });
    root.normalize();
  }

  function applyOne(item){
    if(!root||!item?.text)return;

    const nodes=textNodes(root);
    let full='', map=[];

    nodes.forEach(node=>{
      const start=full.length;
      full+=node.nodeValue;
      map.push({node,start,end:full.length});
    });

    const start=Number(item.start);
    const end=Number(item.end);

    if(!Number.isInteger(start)||!Number.isInteger(end)||end<=start)return;
    if(full.slice(start,end)!==item.text)return;

    const first=map.find(x=>start>=x.start&&start<x.end);
    const last=map.find(x=>end>x.start&&end<=x.end);
    if(!first||!last)return;

    try{
      const range=document.createRange();
      range.setStart(first.node,start-first.start);
      range.setEnd(last.node,end-last.start);

      const mark=document.createElement('mark');
      mark.dataset.studentHighlight=item.id;
      mark.title='Texto resaltado — haz clic para eliminar';
      mark.className='student-highlight';

      range.surroundContents(mark);
    }catch{}
  }

  function render(){
    if(!root)return;
    unwrap();
    records()
      .slice()
      .sort((a,b)=>Number(b.start)-Number(a.start))
      .forEach(applyOne);
  }

  function positionInRoot(node,offset){
    const range=document.createRange();
    range.selectNodeContents(root);
    range.setEnd(node,offset);
    return range.toString().length;
  }

  function hidePopup(){
    popup?.remove();
    popup=null;
  }

  function showPopup(range){
    hidePopup();

    const text=range.toString();
    if(!text.trim())return;

    const start=positionInRoot(range.startContainer,range.startOffset);
    const end=positionInRoot(range.endContainer,range.endOffset);
    if(end<=start)return;

    popup=document.createElement('button');
    popup.type='button';
    popup.className='button student-highlight-action';
    popup.textContent='Resaltar';

    const box=range.getBoundingClientRect();
    popup.style.position='absolute';
    popup.style.zIndex='10000';
    popup.style.left=`${window.scrollX+box.left}px`;
    popup.style.top=`${window.scrollY+box.bottom+6}px`;

    popup.onclick=e=>{
      e.preventDefault();
      e.stopPropagation();

      const items=records();
      items.push({
        id:`h-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
        start,
        end,
        text,
        created_at:new Date().toISOString()
      });

      save(items);
      hidePopup();
      window.getSelection()?.removeAllRanges();
      render();
    };

    document.body.appendChild(popup);
  }

  function selectionChanged(){
    if(!root)return;

    const sel=window.getSelection();
    if(!sel||sel.rangeCount!==1||sel.isCollapsed){
      hidePopup();
      return;
    }

    const range=sel.getRangeAt(0);
    const common=range.commonAncestorContainer;
    const element=common.nodeType===1?common:common.parentElement;

    if(!element||!root.contains(element)){
      hidePopup();
      return;
    }

    if(element.closest('button,a,input,textarea,select')){
      hidePopup();
      return;
    }

    showPopup(range.cloneRange());
  }

  function removeHighlight(mark){
    const id=mark.dataset.studentHighlight;
    if(!id)return;

    save(records().filter(x=>x.id!==id));
    render();
  }

  function attach(host,canonicalRef){
    root=typeof host==='string'?document.querySelector(host):host;
    ref=String(canonicalRef||'');

    hidePopup();

    if(!root||!ref)return;

    render();

    root.onmouseup=()=>setTimeout(selectionChanged,0);
    root.ontouchend=()=>setTimeout(selectionChanged,100);

    root.onclick=e=>{
      const mark=e.target.closest?.('mark[data-student-highlight]');
      if(mark&&root.contains(mark)){
        e.preventDefault();
        if(confirm('¿Deseas eliminar este resaltado?'))removeHighlight(mark);
      }
    };
  }

  global.AcademyHighlighter={attach,render};
})(window);
