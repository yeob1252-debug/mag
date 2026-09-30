window.connectLiveInquiry=(form,serviceOptions)=>{
 let busy=false,submitted=false;const localReview=['localhost','127.0.0.1','::1','[::1]'].includes(location.hostname);if(localReview){const note=document.createElement('p');note.className='note-box';note.textContent='검수용 문의 화면입니다. 입력과 단계 이동을 확인할 수 있으며, 이 로컬 화면에서는 실제 문의를 접수하지 않습니다.';form.prepend(note);}
 const id='AI-'+crypto.randomUUID().toUpperCase();
 const error=document.createElement('p');error.className='form-error';error.setAttribute('role','alert');error.hidden=true;form.append(error);
 form.elements.request.maxLength=1000;
 form.addEventListener('input',()=>{error.hidden=true});
 form.onsubmit=async event=>{
  event.preventDefault();if(localReview){error.textContent='검수 화면에서는 실제 접수하지 않습니다. 입력 내용은 전송되지 않았습니다.';error.hidden=false;return;}if(busy||submitted||!form.reportValidity())return;
  const button=form.querySelector('[type=submit]'),fd=new FormData(form);
  const service=fd.get('service'),mapped=({classes:'training',store:'website'})[service]||service;
  const selected=form.elements.plan.selectedOptions[0]?.textContent||'맞춤 상담';
  const fields=['assets','schedule','subject','scope','pages','products','experience','device'];
  const labels={assets:'자료',schedule:'희망일정',subject:'소재',scope:'수량/길이',pages:'페이지수',products:'상품수',experience:'AI경험',device:'환경'};
  const details=fields.filter(k=>fd.get(k)).map(k=>labels[k]+': '+String(fd.get(k)).slice(0,80));
  if(fd.getAll('features').length)details.push('기능: '+fd.getAll('features').join(', '));
  const request=[serviceOptions.find(v=>v[0]===service)?.[1],selected,...details,'요청: '+fd.get('request')].join('\n');
  if(request.length>1500){error.textContent='요청 내용이 길어졌습니다. 핵심 내용 위주로 조금 줄여주세요.';error.hidden=false;return;}
  busy=true;button.disabled=true;button.textContent='접수하는 중…';error.hidden=true;
  try{
   const response=await fetch('/api/ai-inquiry',{credentials:'same-origin',cache:'no-store'}),session=await response.json();
   if(!response.ok||!session.nonce)throw Error('temporary');
   const q=new URLSearchParams(location.search);
   const payload={submission_id:id,service:mapped,content:String(service+':'+fd.get('plan')).slice(0,80),name:fd.get('name'),email:fd.get('email'),request,reference:fd.get('reference'),privacy_consent:fd.get('consent')==='on',origin_page:(location.pathname+location.search).slice(0,160),utm_source:q.get('utm_source')||'',utm_medium:q.get('utm_medium')||'',utm_campaign:q.get('utm_campaign')||''};
   const r=await fetch('/api/ai-inquiry',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-Request-Nonce':session.nonce},body:JSON.stringify(payload),signal:AbortSignal.timeout(30000)}),data=await r.json();
   if(!r.ok||!data.ok||!data.stored||data.submissionId!==id)throw Error(data.error||'save_unconfirmed');
   submitted=true;form.hidden=true;const success=document.querySelector('#preview-success');
   success.innerHTML='<span class="eyebrow">문의 접수 완료</span><h2>문의가 접수되었습니다.</h2><p>남겨주신 이메일로 진행 범위와 다음 절차를 안내하겠습니다.</p><p class="fine" id="receipt-id"></p><a class="btn" href="/index.html#services">확인하고 돌아가기</a>';
   success.querySelector('#receipt-id').textContent='접수번호 '+data.submissionId;success.hidden=false;success.scrollIntoView({block:'center'});
  }catch(e){error.textContent=e.message==='rate_limited'?'짧은 시간에 여러 문의가 접수되었습니다. 잠시 후 다시 시도해주세요.':'접수 결과를 확인하지 못했습니다. 입력 내용은 유지됩니다. 다시 누르면 같은 접수번호로 확인해 중복을 막습니다.';error.hidden=false;button.disabled=false;button.textContent='다시 접수 확인하기';}
  finally{busy=false;}
 };
};
