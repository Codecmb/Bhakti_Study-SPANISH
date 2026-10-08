/* Optional voice input adapter. Typing always remains available. */
window.VoiceInput={
  attach(textarea,opts={}){
    if(!textarea||textarea.dataset.voiceAttached)return;
    textarea.dataset.voiceAttached='1';
    const bar=document.createElement('div');bar.className='voice-input-bar';
    const btn=document.createElement('button');btn.type='button';btn.className='button secondary';btn.textContent='🎙 Hablar';
    const msg=document.createElement('span');msg.className='small muted';msg.textContent=' Entrada de voz opcional';
    bar.append(btn,msg);textarea.insertAdjacentElement('afterend',bar);
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){btn.disabled=true;btn.title='El reconocimiento de voz no está disponible en este navegador.';msg.textContent=' La transcripción por micrófono no está disponible en este navegador. Puedes continuar escribiendo.';return}
    let rec=null;
    btn.addEventListener('click',()=>{
      if(rec){rec.stop();return}
      rec=new SR();rec.lang=opts.lang||document.documentElement.lang||'es-ES';rec.interimResults=true;rec.continuous=false;
      const before=textarea.value.trim();let finalText='';btn.textContent='■ Detener';msg.textContent=' Escuchando…';
      rec.onresult=e=>{let interim='';for(let i=e.resultIndex;i<e.results.length;i++){const t=e.results[i][0].transcript;if(e.results[i].isFinal)finalText+=t;else interim+=t}textarea.value=[before,finalText||interim].filter(Boolean).join(before?' ':'');};
      rec.onerror=e=>{msg.textContent=' Micrófono no disponible: '+e.error;};
      rec.onend=()=>{rec=null;btn.textContent='🎙 Hablar';msg.textContent=' Revisa o corrige la transcripción antes de guardar.';textarea.dispatchEvent(new Event('input',{bubbles:true}));};
      rec.start();
    });
  },
  attachAll(root=document){root.querySelectorAll('textarea').forEach(t=>this.attach(t));}
};
