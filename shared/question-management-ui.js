(function(global){
  function render(container,{program,unit='',scope,questions=[],bank=null}={}){
    if(!container||!global.QuestionEngine)return;

    const active=QuestionEngine.active(questions,program);
    const deleted=QuestionEngine.deletedQuestions(program).map(d=>{
      const current=questions.find(q=>q.id===d.qid);
      return current||d.question||{id:d.qid,question:'Pregunta eliminada',canonical_ref:''};
    });

    container.innerHTML=
      `<h3>${bank?.label||'Preguntas de Estudio'}</h3>`+
      active.map((x,i)=>`<article class="question-card" data-qid="${x.id}">
        <p><strong>${i+1}. ${x.question}</strong></p>
        <textarea class="field qanswer" data-qid="${x.id}" placeholder="Responde basándote en la fuente primaria…"></textarea>
        <p><button class="button secondary clearAnswer" type="button" data-qid="${x.id}">Borrar Respuesta</button></p>
        <div class="small">${x.canonical_ref||''}${bank?.provenance_label?' · '+bank.provenance_label:''}${x.kind?' · '+x.kind:''}${x.provenance?.title?' · Fuente: '+x.provenance.title:''}${x.provenance?.author?' · '+x.provenance.author:''}</div>
        <p>
          ${x.canonical_ref?`<button class="button secondary studyQuestionSource" type="button" data-qid="${x.id}" data-ref="${x.canonical_ref}">Estudiar Fuente</button>`:''}
          ${x.provider==='student-import'?`<button class="button secondary editImportedQuestion" type="button" data-qid="${x.id}">Editar Pregunta</button>`:''}
          <button class="button secondary flagDuplicate" data-qid="${x.id}">
            ${QuestionEngine.isDuplicate(program,x.id)?'Quitar Marca de Duplicado':'Marcar como Duplicado'}
          </button>
          <button class="button secondary deleteQuestion" data-qid="${x.id}">Eliminar Pregunta</button>
        </p>
      </article>`).join('')+
      (active.length?`<p class="question-navigation">
        <button id="previousQuestion" type="button" class="button secondary">← Pregunta Anterior</button>
        <button id="nextUnanswered" type="button" class="button secondary">Siguiente sin Responder</button>
        <button id="nextQuestion" type="button" class="button secondary">Pregunta Siguiente →</button>
      </p>`:'')+
      '<p><button id="saveQuestions" class="button">Guardar Respuestas</button></p>'+
      (deleted.length?`<details>
        <summary><strong>Deleted Questions (${deleted.length})</strong></summary>
        ${deleted.map(x=>`<article class="question-card">
          <p>${x.question}</p>
          <button class="button secondary restoreQuestion" data-qid="${x.id}">Restaurar</button>
        </article>`).join('')}
      </details>`:'');

    container.querySelectorAll('.qanswer').forEach(el=>{
      el.value=QuestionEngine.load(program,scope,el.dataset.qid);

      if(global.StudentWorkDraft){
        StudentWorkDraft.track({
          id:`question.${program}.${scope}.${el.dataset.qid}`,
          field:el
        });
      }
    });

    container.querySelectorAll('.studyQuestionSource').forEach(btn=>btn.onclick=async()=>{
      const canonical=global.SourceResolver?.canon?.(btn.dataset.ref)||btn.dataset.ref;
      if(!canonical || !global.SourceResolver)return;

      let target=await SourceResolver.resolve(canonical);
      let sourceCanonical=canonical;

      // A question may correctly cite an entire SB chapter,
      // e.g. SB.1.2. The internal reader is verse-based.
      const sbChapter=canonical.match(/^SB\.(\d+)\.(\d+)$/i);

      if(sbChapter && target?.kind!=='internal'){
        const firstVerse=`SB.${Number(sbChapter[1])}.${Number(sbChapter[2])}.1`;
        const firstTarget=await SourceResolver.resolve(firstVerse);

        if(firstTarget?.kind==='internal'){
          target=firstTarget;
          sourceCanonical=firstVerse;
        }
      }

      if(!target?.href)return;

      global.StudyReturnContext?.set?.(program,{
        returnHref:location.href,
        unit,
        scope,
        mode:'questions',
        questionId:btn.dataset.qid,
        canonical,
        sourceCanonical
      });

      rememberQuestion(btn.dataset.qid);

      if(target.kind==='internal'){
        const sourceUrl=new URL(target.href,location.href);

        if(program)sourceUrl.searchParams.set('program',program);
        if(unit)sourceUrl.searchParams.set('unit',unit);

        location.href=sourceUrl.href;
      }else{
        location.href=target.href;
      }
    });

    container.querySelectorAll('.clearAnswer').forEach(btn=>btn.onclick=()=>{
      const answer=container.querySelector(`.qanswer[data-qid="${btn.dataset.qid}"]`);
      if(!answer || !answer.value)return;
      if(!confirm('¿Borrar esta respuesta? La respuesta guardada permanecerá sin cambios hasta que guardes las respuestas.'))return;
      answer.value='';
      answer.focus();
    });

    const cards=[...container.querySelectorAll('.question-card[data-qid]')];

    function rememberQuestion(qid){
      if(!qid || !global.StudyContext)return;
      StudyContext.set({
        program,
        unit,
        mode:'questions',
        questionId:qid
      });
    }

    cards.forEach(card=>{
      card.querySelector('.qanswer')?.addEventListener('focus',()=>{
        rememberQuestion(card.dataset.qid);
      });
    });

    function currentIndex(){
      const focused=document.activeElement?.closest?.('.question-card[data-qid]');
      if(focused){
        const ix=cards.indexOf(focused);
        if(ix>=0)return ix;
      }

      const visible=cards.findIndex(card=>{
        const r=card.getBoundingClientRect();
        return r.bottom>0 && r.top<window.innerHeight;
      });
      return visible>=0?visible:0;
    }

    function goTo(ix){
      if(ix<0 || ix>=cards.length)return;
      rememberQuestion(cards[ix].dataset.qid);
      cards[ix].scrollIntoView({behavior:'smooth',block:'center'});
      cards[ix].querySelector('.qanswer')?.focus({preventScroll:true});
    }

    const requestedQuestion=new URLSearchParams(location.search).get('question');
    if(requestedQuestion){
      const ix=cards.findIndex(card=>card.dataset.qid===requestedQuestion);
      if(ix>=0){
        requestAnimationFrame(()=>{
          cards[ix].scrollIntoView({block:'center'});
          cards[ix].querySelector('.qanswer')?.focus({preventScroll:true});
        });
      }
    }

    container.querySelector('#previousQuestion')?.addEventListener('click',()=>{
      goTo(Math.max(0,currentIndex()-1));
    });

    container.querySelector('#nextQuestion')?.addEventListener('click',()=>{
      goTo(Math.min(cards.length-1,currentIndex()+1));
    });

    container.querySelector('#nextUnanswered')?.addEventListener('click',()=>{
      if(!cards.length)return;

      const start=currentIndex();
      const unanswered=card=>{
        const field=card.querySelector('.qanswer');
        return !String(field?.value||'').trim();
      };

      for(let offset=1;offset<=cards.length;offset++){
        const ix=(start+offset)%cards.length;
        if(unanswered(cards[ix])){
          goTo(ix);
          return;
        }
      }
    });

    container.querySelectorAll('.editImportedQuestion').forEach(btn=>btn.onclick=()=>{
      const item=questions.find(x=>x.id===btn.dataset.qid);
      if(!item || item.provider!=='student-import' || !global.QuestionSheetImporter?.update)return;

      const revised=prompt('Edita esta pregunta importada:',item.question||'');
      if(revised===null)return;

      const question=revised.trim();
      if(!question){
        alert('El texto de la pregunta no puede estar vacío.');
        return;
      }

      const updated=QuestionSheetImporter.update(program,item.id,{question});
      if(!updated)return;

      item.question=updated.question;
      render(container,{program,unit,scope,questions,bank});
    });

    container.querySelectorAll('.flagDuplicate').forEach(btn=>btn.onclick=()=>{
      if(QuestionEngine.isDuplicate(program,btn.dataset.qid)){
        QuestionEngine.clearDuplicate(program,btn.dataset.qid);
        btn.textContent='Marcar como Duplicado';
      }else{
        QuestionEngine.flagDuplicate(program,btn.dataset.qid);
        btn.textContent='Quitar Marca de Duplicado';
      }
    });

    container.querySelectorAll('.deleteQuestion').forEach(btn=>btn.onclick=()=>{
      if(!confirm('¿Eliminar esta pregunta de tu colección de estudio? Puedes restaurarla más adelante.'))return;
      const item=questions.find(x=>x.id===btn.dataset.qid);
      QuestionEngine.deleteQuestion(program,btn.dataset.qid,item||null);
      render(container,{program,unit,scope,questions,bank});
    });

    container.querySelectorAll('.restoreQuestion').forEach(btn=>btn.onclick=()=>{
      QuestionEngine.restoreQuestion(program,btn.dataset.qid);
      render(container,{program,unit,scope,questions,bank});
    });
  }

  function clearAnswerDrafts(container,{program,scope}={}){
    if(!container||!global.StudentWorkDraft)return;

    container.querySelectorAll('.qanswer').forEach(el=>{
      StudentWorkDraft.clear(`question.${program}.${scope}.${el.dataset.qid}`);
    });
  }

  global.QuestionManagementUI={render,clearAnswerDrafts};
})(window);
