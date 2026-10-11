(function(){
'use strict';

const channelName='academia-study-journal';

function update(context){
  const actions=document.querySelector('#passage .reader-actions, .reader-actions');
  if(!actions)return;

  const params=new URLSearchParams({
    program:context.program,
    unit:context.unit,
    book:context.book,
    bookTitle:context.bookTitle,
    section:context.section,
    ref:context.ref
  });

  const journalUrl='../../student/journal.html?'+params.toString();

  const button=document.createElement('button');
  button.type='button';
  button.className='button secondary';
  button.textContent='Abrir Diario ↗';

  button.addEventListener('click',function(){
    const popup=window.open(
      journalUrl,
      '_blank',
      'popup=yes,width=760,height=900,left=20,top=20,resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no,status=no'
    );
    if(popup)popup.focus();
  });

  actions.appendChild(button);

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
    console.warn('No se pudo actualizar el diario:',error);
  }
}

window.AcademyJournalReader={update};
})();
