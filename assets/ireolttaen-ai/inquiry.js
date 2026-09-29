(()=>{
 const names={content:'AI 광고·콘텐츠 제작',website:'브랜드 홈페이지 제작',training:'오프라인 원데이클래스',custom:'그 외 맞춤 문의'},q=new URLSearchParams(location.search),kind=Object.hasOwn(names,q.get('service'))?q.get('service'):'custom';
 const form=document.querySelector('#form'),error=document.querySelector('#form-error'),submit=form.querySelector('[type=submit]');let busy=false,submitted=false,id='AI-'+crypto.randomUUID().toUpperCase();
 document.querySelector('#selected').textContent='선택한 서비스 · '+names[kind];
 document.querySelector('#source-label').textContent=q.get('content')?'보고 온 사례 · '+(q.get('content')==='menu'?'메뉴 광고':q.get('content')==='website'?'홈페이지 제작':q.get('content')):'';
 form.elements.request.placeholder={content:'상품이나 메뉴, 필요한 영상 길이와 사용 채널을 알려주세요.',website:'어떤 브랜드의 사이트인지, 필요한 페이지와 기능을 알려주세요.',training:'희망 지역·인원·원데이클래스 또는 단체 교육·만들고 싶은 결과를 알려주세요.',custom:'현재 어떤 일을 하고 있고, 무엇을 바꾸거나 만들고 싶은가요?'}[kind];
 form.onsubmit=async e=>{e.preventDefault();if(busy||submitted||!form.reportValidity())return;busy=true;submit.disabled=true;submit.textContent='안전하게 접수하는 중…';error.hidden=true;
 try{
  const response=await fetch('/api/ai-inquiry',{credentials:'same-origin',cache:'no-store'}),session=await response.json();if(!response.ok||!session.nonce)throw Error('temporary');
  const f=new FormData(form),payload={submission_id:id,service:kind,content:q.get('content')||'',name:f.get('name'),email:f.get('email'),request:f.get('request'),reference:f.get('reference'),company_website:f.get('company_website'),privacy_consent:f.get('privacy_consent')==='on',origin_page:location.pathname,utm_source:q.get('utm_source')||'',utm_medium:q.get('utm_medium')||'',utm_campaign:q.get('utm_campaign')||''};
  const r=await fetch('/api/ai-inquiry',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-Request-Nonce':session.nonce},body:JSON.stringify(payload),signal:AbortSignal.timeout(30000)}),data=await r.json();
  if(!r.ok||!data.ok||!data.stored)throw Error(data.error||'save_unconfirmed');submitted=true;
  document.querySelector('#form-area').innerHTML='<div class="completed"><p class="eyebrow">문의 접수 완료</p><strong>✓</strong><h1>문의가 접수되었습니다.</h1><p class="intro">남겨주신 이메일로 진행 범위를 안내드리겠습니다.</p><p id="receipt-id" class="fine"></p><button type="button" id="complete-close" class="button">확인하고 닫기</button></div>';
  document.querySelector('#receipt-id').textContent='접수번호 '+data.submissionId;document.querySelector('#complete-close').onclick=()=>{if(parent!==window)parent.postMessage({type:'ai-inquiry-close'},location.origin);else location.href='index.html#services';};scrollTo(0,0);
 }catch(e){error.textContent=e.message==='rate_limited'?'짧은 시간에 여러 문의가 접수되었습니다. 잠시 후 다시 시도하거나 오픈채팅으로 문의해주세요.':'접수 결과를 확인하지 못했습니다. 입력 내용은 유지됩니다. 다시 누르면 같은 접수번호로 확인하여 중복을 막습니다.';error.hidden=false;submit.disabled=false;submit.textContent='문의 접수하기 →';}finally{busy=false;}
 };
})();
