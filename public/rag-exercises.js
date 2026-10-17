/* Deterministic interactive RAG laboratories. No network/LLM or benchmark claims. */
(() => {
  const root = document.querySelector('[data-rag-lab]');
  if (!root) return;
  const find = (selector, base=root) => base.querySelector(selector);
  const many = (selector, base=root) => [...base.querySelectorAll(selector)];
  const num = (selector, base=root) => Number(find(selector,base).value);
  const put = (selector, value, base=root) => { const el=find(selector,base); if (el) el.textContent = String(value); };
  const fmt = n => n.toLocaleString('en-US');
  const switchButtons = (selector, target) => many(selector).forEach(button => button.setAttribute('aria-pressed',String(button===target)));
  if (find('[data-rag-chunk]')) {
    const block=find('[data-rag-chunk]');
    const paint=()=>{
      const T=2048,c=num('[data-chunk-size]',block),maxO=Math.min(384,c-32),overlap=find('[data-chunk-overlap]',block);
      overlap.max=String(maxO);if(+overlap.value>maxO)overlap.value=String(maxO);
      const o=+overlap.value, stride=c-o, starts=[];
      for(let start=0;start<T;start+=stride){starts.push([start,Math.min(start+c,T)]); if(start+c>=T)break;}
      const indexed=starts.reduce((n,[a,b])=>n+b-a,0);
      put('[data-chunk-size-label]',`${c} tokens`,block);put('[data-chunk-overlap-label]',`${o} tokens`,block);
      put('[data-chunk-count]',starts.length,block);put('[data-chunk-embedded]',fmt(indexed),block);
      put('[data-chunk-repeat]',`${((indexed-T)/T*100).toFixed(1)}%`,block);
      const bars=find('[data-chunk-bars]',block); bars.replaceChildren();
      starts.forEach(([a,b],i)=>{const row=document.createElement('div');row.className='rag-chunk-row';
        const label=document.createElement('span');label.textContent=`${String(i+1).padStart(2,'0')} · ${a}–${b}`;
        const track=document.createElement('div'); track.className='rag-chunk-track';
        const window=document.createElement('span');window.className='rag-chunk-window';window.style.left=`${a/T*100}%`;window.style.width=`${(b-a)/T*100}%`;
        track.append(window);row.append(label,track);bars.append(row);
      });
      put('[data-chunk-note]',`The index encodes ${fmt(indexed-T)} repeated tokens across ${starts.length} chunks. Larger overlap can protect boundary facts but raises retrieval redundancy.`,block);
    };
    many('input',block).forEach(input=>input.addEventListener('input',paint));paint();
  }
  if(find('[data-rag-fusion]')) {
    const block=find('[data-rag-fusion]');const sparse=['A','B','C','D'],dense=['C','A','E','B'];
    const labels={A:'ZX-41 manual',B:'General guide',C:'Fault record',D:'Service note',E:'Troubleshooting'};
    const paint=()=>{
      const a=find('[data-rrf-lex]',block).checked,b=find('[data-rrf-dense]',block).checked, scores=new Map();
      for(const ranked of [a?sparse:[],b?dense:[]])ranked.forEach((key,rank)=>scores.set(key,(scores.get(key)||0)+1/(60+rank+1)));
      const sorted=[...scores].sort((x,y)=>y[1]-x[1]||x[0].localeCompare(y[0]));
      const results=find('[data-rrf-results]',block);results.replaceChildren();
      sorted.forEach(([key,score],i)=>{
        const row=document.createElement('div');row.className='rag-rrf-item';
        const title=document.createElement('span');title.textContent=`${i+1}. Doc ${key} · ${labels[key]}`;
        const track=document.createElement('div');track.className='rag-rrf-track';const fill=document.createElement('span');fill.style.width=`${score/(sorted[0]?.[1]||1)*100}%`;track.append(fill);
        const val=document.createElement('output');val.textContent=score.toFixed(5);row.append(title,track,val);results.append(row);
      });
      put('[data-rrf-explanation]',!a&&!b?'No search channels are enabled.':`Fused ${sorted.length} distinct candidates. Doc A ranks ${a?'#1 in lexical':'absent lexically'} and ${b?'#2 in dense':'absent in dense'}. Ranks are one-based.`,block);
    };
    many('input',block).forEach(input=>input.addEventListener('change',paint));paint();
  }
  if(find('[data-rag-colbert]')) {
    const block=find('[data-rag-colbert]');const scores=[[.90,.22,.10,.15],[.09,.31,.85,.82]];let selected=0;
    const maxima=scores.map(row=>Math.max(...row));
    function paint(){
      many('[data-colbert-row]',block).forEach(btn=>btn.setAttribute('aria-pressed',String(Number(btn.dataset.colbertRow)===selected)));
      scores.forEach((row,i)=>row.forEach((v,j)=>{const cell=find(`[data-colbert-cell="${i}-${j}"]`,block);cell.textContent=v.toFixed(2);cell.classList.toggle('is-max',v===maxima[i]);cell.classList.toggle('is-inspected',selected===i);}));
      put('[data-colbert-max]',maxima[selected].toFixed(2),block);put('[data-colbert-sum]',(maxima[0]+maxima[1]).toFixed(2),block);
      put('[data-colbert-summary]',`Query token ${selected+1} takes max ${maxima[selected].toFixed(2)}. Full MaxSim = ${maxima.map(x=>x.toFixed(2)).join(' + ')} = ${(maxima[0]+maxima[1]).toFixed(2)}.`,block);
    }
    many('[data-colbert-row]',block).forEach(btn=>btn.addEventListener('click',()=>{selected=Number(btn.dataset.colbertRow);paint();}));paint();
  }
  if(find('[data-rag-metrics]')) {
    const block=find('[data-rag-metrics]');
    const paint=(changed)=>{
      const gold=num('[data-gold]',block),hit=find('[data-hit]',block),fp=num('[data-fp]',block);
      hit.max=String(gold);if(+hit.value>gold)hit.value=String(gold);
      const h=+hit.value,k=h+fp,p=k?h/k:null,r=h/gold;
      put('[data-gold-label]',gold,block);put('[data-hit-label]',h,block);put('[data-fp-label]',fp,block);
      put('[data-precision]',p===null?'N/A':(p*100).toFixed(1)+'%',block);
      put('[data-recall]',(r*100).toFixed(1)+'%',block);put('[data-k]',k,block);
      put('[data-metrics-note]',`${h} of ${gold} relevant passages were retrieved; ${fp} irrelevant passages also appeared. ${k===0?'Precision is undefined for an empty result set.':'The missing '+(gold-h)+' relevant passages limit grounded answer coverage.'} Faithfulness requires evaluating generated claims separately.`,block);
    };
    many('input',block).forEach(input=>input.addEventListener('input',paint));paint();
  }
  if(find('[data-rag-vectors]')) {
    const block=find('[data-rag-vectors]');const paint=()=>{
      const n=num('[data-vector-n]',block)*1e6,d=num('[data-vector-d]',block),b=num('[data-vector-b]',block),bytes=n*d*b;
      put('[data-vector-n-label]',`${n/1e6} million`,block);put('[data-vector-result]',`${(bytes/2**30).toFixed(2)} GiB`,block);
      put('[data-vector-total]',fmt(n),block);put('[data-vector-note]',`${fmt(n)} × ${fmt(d)} × ${b} = ${fmt(bytes)} bytes, excluding graph index, metadata, replicas and rebuild buffers.`,block);
    };many('input,select',block).forEach(input=>input.addEventListener('input',paint));paint();
  }
  if(find('[data-rag-acl]')) {
    const block=find('[data-rag-acl]');let principal='a';const records=[
      {id:'S1',title:'Tenant A / public manual',tenant:'a',private:false},
      {id:'S2',title:'Tenant A / HR compensation',tenant:'a',private:true},
      {id:'S3',title:'Tenant B / internal policy',tenant:'b',private:false},
      {id:'S4',title:'Tenant B / HR compensation',tenant:'b',private:true}];
    function paint(){
      many('[data-acl-user]',block).forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.aclUser===principal)));
      const list=find('[data-acl-records]',block);list.replaceChildren();let allowed=0;
      records.forEach(record=>{const pass=(principal==='admin'?record.tenant==='a':record.tenant===principal&&!record.private);allowed+=Number(pass);
        const line=document.createElement('div');line.className='rag-record';const title=document.createElement('span');title.textContent=`${record.id} · ${record.title}`;
        const status=document.createElement('strong');status.textContent=pass?'ELIGIBLE':'DENIED';status.className=pass?'is-eligible':'is-denied';line.append(title,status);list.append(line);
      });
      put('[data-acl-note]',`${allowed} permitted candidates for this principal. In production, the trusted server—not the browser, user prompt or LLM—must enforce this filtering before any content leaves the data boundary.`,block);
    }
    many('[data-acl-user]',block).forEach(btn=>btn.addEventListener('click',()=>{principal=btn.dataset.aclUser;paint();}));paint();
  }
  if(find('[data-rag-freshness]')) {
    const block=find('[data-rag-freshness]');let source=1,index=1,stage=null;
    function paint(message){
      put('[data-source-version]',`v${source}`,block);put('[data-index-version]',`v${index}`,block);put('[data-stage-version]',stage===null?'None':`v${stage}`,block);
      find('[data-fresh-source]',block).classList.toggle('is-ready',source>index);
      find('[data-fresh-stage]',block).classList.toggle('is-ready',stage===source&&stage!==null);
      find('[data-fresh-live]',block).classList.toggle('is-ready',index===source);
      put('[data-fresh-note]',message??(source===index?'Source and published index match.':'Active retrieval still sees the previous version until a validated publish.'),block);
    }
    many('[data-version-action]',block).forEach(btn=>btn.addEventListener('click',()=>{
      switch(btn.dataset.versionAction){
        case 'update':source++;stage=null;paint(`Source advanced to v${source}; active index remains v${index}. Old answers are possible until publishing.`);break;
        case 'stage':stage=source;paint(`Built staging index v${stage}. It is not visible to queries yet; validate coverage, ACLs and deletion handling.`);break;
        case 'publish':if(stage===source&&stage!==null){index=stage;stage=null;paint(`Published v${index} atomically. Queries now use the updated source revision.`);}else paint('Build and validate the current source revision before publishing.');break;
        default:source=1;index=1;stage=null;paint('Reset: source and active index both use v1.');
      }
    }));paint();
  }
  if(find('[data-rag-pdf]')) {
    const block=find('[data-rag-pdf]');const box=find('[data-pdf-view]',block);
    function paint(mode){
      many('[data-pdf-mode]',block).forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.pdfMode===mode)));
      if(mode==='flat'){
        const pre=document.createElement('pre');pre.textContent='Item Qty Unit price\nPrinter 2 120\nMonitor 1 300\nDiscount: 10%\n\nBROKEN EXTRACTION:\nPrinter Monitor | 2 1 | 120 300';box.replaceChildren(pre);
        put('[data-pdf-note]','Flattened reading order can separate values from their row and column headers. Do not ask an LLM to guess which prices belong to which item.',block);
      }else{
        const table=document.createElement('table');table.innerHTML='<thead><tr><th>Item</th><th>Qty</th><th>Unit price ($)</th><th>Line total ($)</th></tr></thead><tbody><tr><td>Printer</td><td>2</td><td>120</td><td>240</td></tr><tr><td>Monitor</td><td>1</td><td>300</td><td>300</td></tr></tbody>';
        const note=document.createElement('p');note.textContent='Subtotal: $540 · illustrative calculation from typed cells';box.replaceChildren(table,note);
        put('[data-pdf-note]','A structured representation keeps row identity, quantity, unit and header lineage. Actual PDFs need extraction and visual verification; this table is invented.',block);
      }
    }
    many('[data-pdf-mode]',block).forEach(btn=>btn.addEventListener('click',()=>paint(btn.dataset.pdfMode)));paint('flat');
  }
  if(find('[data-rag-hops]')) {
    const block=find('[data-rag-hops]');let id='D-72';
    function paint(){
      many('[data-hop-id]',block).forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.hopId===id)));
      put('[data-hop-selected]',id,block);put('[data-hop-person]',id==='D-72'?'Rina':'Samir',block);
      put('[data-hop-result]',id==='D-72'?'Verified chain: incident I-9 → deployment D-72 → Rina. Both edges have matching IDs in this fictional example.':'Broken join: I-9 does not reference D-28. Samir may be the real approver of D-28, but that does not answer this incident.',block);
    }
    many('[data-hop-id]',block).forEach(btn=>btn.addEventListener('click',()=>{id=btn.dataset.hopId;paint();}));paint();
  }
  if(find('[data-rag-latency]')) {
    const block=find('[data-rag-latency]');const paint=()=>{
      const dense=num('[data-lat-dense]',block),sparse=num('[data-lat-sparse]',block),rerank=num('[data-lat-rerank]',block),branch=Math.max(dense,sparse);
      put('[data-lat-dense-label]',dense+' ms',block);put('[data-lat-sparse-label]',sparse+' ms',block);put('[data-lat-rerank-label]',rerank+' ms',block);
      put('[data-lat-branch]',branch+' ms',block);put('[data-lat-total]',(40+branch+rerank)+' ms',block);
      put('[data-lat-note]',`Illustrative 40 ms fixed overhead + max(${dense}, ${sparse}) ms concurrent search + ${rerank} ms rerank = ${40+branch+rerank} ms before generation.`,block);
    };many('input',block).forEach(input=>input.addEventListener('input',paint));paint();
  }
})();
