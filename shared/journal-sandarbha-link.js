(function(){
'use strict';

const channelName='academia-study-journal';

function update(context){
  const actions=document.querySelector('.sandarbha-passage-nav');
  if(!actions)return;

  let button=document.getElementById('sandarbhaJournalButton');

  const params=new URLSearchParams({
    program:context.program,
    unit:context.unit,
    book:context.book,
    bookTitle:context.bookTitle,
    section:context.section,
    ref:context.ref
  });

  const journalUrl='../../../student/journal.html?'+params.toString();

  if(!button){
    button=document.createElement('button');
    button.id='sandarbhaJournalButton';
    button.type='button';
    button.className='button secondary';
    button.textContent='Diario de Estudio ↗';
    actions.appendChild(button);
  }

  button.onclick=function(){
    const popup=window.open(
      journalUrl,
      '_blank',
      'popup=yes,width=760,height=900,left=20,top=20,resizable=yes,scrollbars=yes'
    );
    if(popup)popup.focus();
  };

  try{
    const channel=new BroadcastChannel(channelName);
    channel.postMessage({
      type:'reader-context',
      program:context.program,
      unit:context.unit,
      book:context.book,
      bookTitle:context.bookTitle,
      section:context.section,
      canonical:context.ref
    });
    channel.close();
  }catch(error){
    console.warn('No se pudo actualizar el Diario de Estudio:',error);
  }
}

window.AcademyJournalReader={update};
})();
