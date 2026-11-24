(async function(){
  'use strict';
  const key='pe_private_visitor_v1', choice='pe_private_choice_v1';
  try {
    const config=await fetch('/api/private-visitor/config',{cache:'no-store'}).then(r=>r.json());
    if(!config.enabled) return;
    const send=(id,action)=>fetch('/api/private-visitor/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,action}),keepalive:true}).then(r=>{if(!r.ok)throw Error('Unable to save analytics preference');});
    const panel=document.createElement('section');panel.setAttribute('aria-label','Analytics privacy preferences');
    panel.style.cssText='position:fixed;bottom:16px;left:12px;right:12px;max-width:560px;margin:auto;padding:18px;background:white;color:#17213c;border:1px solid #aaa;border-radius:12px;z-index:99999;box-shadow:0 4px 20px #0003;font:16px system-ui';
    const message=document.createElement('p');message.textContent='Optional private analytics: allow a random browser identifier to count repeat visits for 30-day reports? Rejecting does not affect shopping. Aggregate page and search counts continue. This is a staging test, not advertising consent.';panel.append(message);
    const button=(label,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.style.cssText='padding:10px;margin:4px;border:1px solid #555;border-radius:6px;background:white;color:#17213c';b.onclick=fn;return b;};
    const manage=button('Analytics privacy',()=>{panel.hidden=false;});manage.style.cssText+=';position:fixed;bottom:4px;right:4px;z-index:99998;font-size:12px';document.body.append(manage,panel);
    const report=async()=>{let id=localStorage.getItem(key);if(!id){id=Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join('');localStorage.setItem(key,id);}await send(id,'visit');};
    panel.append(button('Accept analytics',async()=>{try{localStorage.setItem(choice,'accept');await report();panel.hidden=true;}catch(e){message.textContent=e.message;}}),button('Reject analytics',async()=>{const id=localStorage.getItem(key);localStorage.setItem(choice,'reject');localStorage.removeItem(key);try{if(id)await send(id,'withdraw');panel.hidden=true;}catch(e){message.textContent='Tracking stopped. Server deletion could not be confirmed.';}}));
    const saved=localStorage.getItem(choice);panel.hidden=!!saved;if(saved==='accept')await report();
  } catch(e){console.warn('Private analytics unavailable');}
})();
