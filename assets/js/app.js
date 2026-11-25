/* ================= Practice tab: every exam-style question on the site, filters, self-marking, mini papers ================= */
/* definition flashcards are stored as '@termId' to avoid repeating the glossary text */
(function(){var C=window.CS;if(C&&C.fc)C.fc.cards.forEach(function(c){if(c.b&&c.b.charAt(0)==='@'){var t=C.terms[c.b.slice(1)];if(t)c.b=t.ib}})})();
(function(){
var CS=window.CS,$=function(id){return document.getElementById(id)};
function esc(t){return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function lsGet(k,d){try{var v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function isSL(){return document.body.getAttribute('data-level')!=='hl'}
function strip(h){var d=document.createElement('div');d.innerHTML=h;return d.textContent.replace(/\s+/g,' ').trim()}
var PAGES={};CS.lines.forEach(function(l){l.pages.forEach(function(p){p.line=l.id;PAGES[p.id]=p})});
var SPECIAL_R={'Exam':'exam','IA-assessment':'ia','Case-study':'case-study','Pseudocode':'pseudocode'};
var Q=CS.prac,BYID={};Q.forEach(function(q,i){q.i=i;BYID[q.id]=q});
var KIND={quiz:'Test yourself',model:'Model answer in the notes',fm:'Full-mark practice',term:'Definition',case:'Case-study bank',essay:'Extended response',mix:'Mixed topics',xs:'Exam-style'};
function unitsOf(q){return q.us||[q.u]}
function paperOf(q){if(q.pp)return q.pp;var u=q.u||'';return u==='CS'||u.charAt(0)==='A'?1:(u.charAt(0)==='B'?2:0)}
var HAS={};Q.forEach(function(q){unitsOf(q).forEach(function(u){HAS[u]=1})});
var UNITS=[['all','All']].concat(CS.lines.map(function(l){return [l.id,l.id]})).concat([['CS','Case study'],['EX','Exam']]).filter(function(u){return u[0]==='all'||HAS[u[0]]});
function unitName(u){if(u==='CS')return 'Case study';if(u==='EX')return 'Exam and IA';var l=CS.lines.filter(function(x){return x.id===u})[0];return l?l.name:u}
function thOf(u){return u==='EX'?'IA':u}
function codeOf(q){if(q.us)return q.us.join(' + ');var p=PAGES[q.p];if(p)return p.code;if(q.u==='CS')return 'Case study';if(q.u==='EX')return 'Exam';return q.u}
function titleOf(q){var m=CS.meta[q.p];return m?m.title:''}
function href(q){var r=SPECIAL_R[q.p]||q.p;if(!CS.meta[q.p])return '';return '#'+r+(q.s?'.'+q.s:'')}
/* "Open in the notes": the stop that teaches the idea (q.n), never the box holding this question's answer */
function notesLink(q){
  var h=href(q);if(!h)return '';
  if(q.n){var ps=q.n.split('.');if(CS.meta[ps[0]])h='#'+(SPECIAL_R[ps[0]]||ps[0])+'.'+ps[1]}
  var lab=q.f?(q.fg?q.f.split('|').join(' · '):'Key ideas for this question'):'';
  return '<a class="minibtn" href="'+h+'" data-hide="'+esc(q.id)+'"'+(q.f?' data-find="'+esc(q.f)+'" data-multi="1" data-label="'+esc(lab)+'"':'')+' title="Opens the notes that teach this, with its own answer hidden">Open in the notes →</a>';
}

/* ---------- progress: {q:{id:[score,marks,time,star]}, papers:[[time,score,total,mins]]} ---------- */
var P=lsGet('csPrac',null);if(!P||typeof P!=='object')P={q:{},papers:[]};if(!P.q)P.q={};if(!P.papers)P.papers=[];
function rec(id){return P.q[id]||null}
function status(id){var r=rec(id);if(!r||r[0]==null)return 'new';return r[0]>=r[1]?'full':'lost'}
function starred(id){var r=rec(id);return !!(r&&r[3])}
var Sync={ref:null,ok:false,busy:false,again:false,timer:null,started:false};
function dirty(){lsSet('csPrac',P);if(Sync.ok){clearTimeout(Sync.timer);Sync.timer=setTimeout(push,2000)}}
function setScore(id,s){var q=BYID[id];var r=(rec(id)||[null,q.m,0,0]).slice();r[0]=s;r[1]=q.m;r[2]=Date.now();P.q[id]=r;dirty()}
function toggleStar(id){var q=BYID[id];var r=(rec(id)||[null,q.m,0,0]).slice();r[3]=r[3]?0:1;r[2]=Date.now();P.q[id]=r;dirty()}
function merge(d){
  if(!d||typeof d!=='object')return;
  var rq=d.q||{};Object.keys(rq).forEach(function(id){var a=P.q[id],b=rq[id];if(!Array.isArray(b))return;if(!a||(b[2]||0)>(a[2]||0))P.q[id]=b});
  if(Array.isArray(d.papers)){var seen={};P.papers.forEach(function(p){seen[p[0]]=1});d.papers.forEach(function(p){if(Array.isArray(p)&&!seen[p[0]])P.papers.push(p)});P.papers.sort(function(a,b){return a[0]-b[0]});P.papers=P.papers.slice(-30)}
  lsSet('csPrac',P);
}
function push(){
  if(!Sync.ok||!Sync.ref)return;if(Sync.busy){Sync.again=true;return}Sync.busy=true;
  Sync.ref.set({v:1,q:P.q,papers:P.papers,updated:Date.now()}).then(function(){Sync.busy=false;if(Sync.again){Sync.again=false;push()}},function(e){Sync.busy=false;if(e&&(e.code==='revoked'||e.code==='invalid_argument'||e.code==='not_granted')){Sync.ok=false;badge()}});
}
function syncInit(){
  if(Sync.started)return;Sync.started=true;
  try{if(!window.claude||typeof window.claude.use!=='function')return}catch(e){return}
  Promise.all([window.claude.use('db'),window.claude.use('user')]).then(function(r){
    var db=r[0],user=r[1];if(!db||!user||typeof user.id!=='function')return null;
    return user.id().then(function(uid){
      if(!uid)return null;
      Sync.ref=db.doc('data/users/'+uid+'/practice');
      return Sync.ref.get().then(function(s){if(s&&s.exists)merge(s.data());Sync.ok=true;badge();if(V.ready)draw();if(Object.keys(P.q).length)push()});
    });
  }).catch(function(){Sync.ok=false;badge()});
}
function badge(){var b=$('px-sync');if(!b)return;b.classList.toggle('on',Sync.ok);b.lastChild.textContent=Sync.ok?'Scores saved to your account':'Scores saved on this device'}
var SAMPLE=null;
function samp(){try{if(window.claude&&window.claude.use)window.claude.use('sample').then(function(s){SAMPLE=s||null;if(SAMPLE&&V.ready)document.querySelectorAll('.pq-ai').forEach(function(b){b.hidden=false})}).catch(function(){})}catch(e){}}

/* ---------- filters ---------- */
var F=lsGet('csPracF',{u:'all',src:'exam',cmd:'',mk:'',st:'',q:'',shuffle:false});
if(!Array.isArray(F.us))F.us=F.u&&F.u!=='all'?[F.u]:[];if(F.pp==null)F.pp='';
function unitsLabel(){return F.us.map(unitName).join(' + ')}
function unitOk(q){return !F.us.length||unitsOf(q).every(function(u){return F.us.indexOf(u)>-1})}
var V={ready:false,mode:'bank',shown:15,order:null,paper:null};
function saveF(){lsSet('csPracF',F)}
function srcOk(q,src){
  if(src==='exam')return q.k!=='term';
  if(src==='quiz')return q.k==='quiz'||q.k==='fm'||q.k==='case'||q.k==='xs'||q.k==='mix';
  if(src==='mix')return q.k==='mix';
  if(src==='model')return q.k==='model';
  if(src==='term')return q.k==='term';
  if(src==='long')return q.k==='essay'||q.m>=5;
  return true;
}
function mkOk(m,f){if(!f)return true;if(f==='1')return m<=2;if(f==='3')return m>=3&&m<=4;if(f==='5')return m>=5&&m<=6;return m>=7}
var STOPF=null;   /* "Practice this stop": only the questions that stop teaches */
function pool(ignore){
  var sl=isSL(),ql=(F.q||'').trim().toLowerCase();
  if(STOPF)return Q.filter(function(q){return !(sl&&q.h)&&q.k!=='term'&&q.n===STOPF});
  return Q.filter(function(q){
    if(sl&&q.h)return false;
    if(ignore!=='u'&&!unitOk(q))return false;
    if(F.pp&&paperOf(q)!==+F.pp)return false;
    if(!srcOk(q,F.src))return false;
    if(ignore!=='cmd'&&F.cmd&&q.c!==F.cmd)return false;
    if(F.mk&&!mkOk(q.m,F.mk))return false;
    if(F.st){var s=status(q.id);if(F.st==='star'?!starred(q.id):s!==F.st)return false}
    if(ql){if(!q._t)q._t=(strip(q.q)+' '+q.c+' '+codeOf(q)+' '+titleOf(q)).toLowerCase();if(ql.split(/\s+/).some(function(w){return q._t.indexOf(w)<0}))return false}
    return true;
  });
}
function shuffled(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}

/* ---------- render ---------- */
function render(u){
  if(u&&UNITS.some(function(x){return x[0]===u})){F.us=[u];F.cmd='';saveF();V.shown=15;V.order=null}
  var el=$('view-practice');
  if(!V.ready){
    el.innerHTML='<div class="vhead plain th-IA"><div class="vh-in"><h1>Practice</h1><p>Exam-style questions with markschemes, flashcards for every term, and the IB specimen papers broken down. Choose what to practise on the side; your progress is saved on this device.</p></div></div>'+
      '<div class="vbody pxv"><div class="studybar" id="sb-practice"></div><div class="fcl"><aside class="fcl-side">'+
      '<div class="px-modes"><span class="seg" role="group" aria-label="Mode"><button type="button" data-m="bank">Question bank</button><button type="button" data-m="paper">Mini paper</button></span></div>'+
      '<div class="px-filters fcl-box" id="px-filters"><span class="fcl-bh">Your questions</span><div class="gl-bar"><input type="search" id="px-q" placeholder="Search questions, e.g. “cache” or “normalise”" aria-label="Search questions" autocomplete="off"><span class="gl-count" id="px-count"></span><button type="button" class="ftog" id="px-ftog" aria-expanded="false" aria-controls="px-fbody">Filters</button></div><div class="fsum" id="px-fsum"></div><div class="fbody" id="px-fbody">'+
      '<div class="chips" id="px-units" role="group" aria-label="Topic"></div>'+
      '<details class="px-more"><summary>More filters</summary><div class="px-sel"><label><span>Questions</span><select id="px-src"><option value="exam">All exam-style</option><option value="quiz">Test-yourself and bank only</option><option value="model">Model answers from the notes</option><option value="mix">Mixed-topic questions</option><option value="long">Long answers (5+ marks)</option><option value="term">Definitions (glossary)</option><option value="all">Everything incl. definitions</option></select></label>'+
      '<label><span>Paper</span><select id="px-pp"><option value="">Both papers</option><option value="1">Paper 1 · Theme A + case study</option><option value="2">Paper 2 · Theme B</option></select></label>'+
      '<label><span>Command term</span><select id="px-cmd"></select></label>'+
      '<label><span>Marks</span><select id="px-mk"><option value="">Any</option><option value="1">1–2</option><option value="3">3–4</option><option value="5">5–6</option><option value="7">7 or more</option></select></label>'+
      '<label><span>Status</span><select id="px-st"><option value="">Any</option><option value="new">Not tried yet</option><option value="lost">Lost marks</option><option value="full">Full marks</option><option value="star">Starred</option></select></label>'+
      '<button type="button" class="minibtn" id="px-shuf" aria-pressed="false">Shuffle</button></div></details></div><div class="fcl-foot"><span class="fcx-sync px-sync" id="px-sync"><i></i><span>Scores saved on this device</span></span></div></div>'+
      '</aside><div class="fcl-main"><div class="pmh"><div class="pmh-top"><h2 id="px-title">Question bank</h2><div class="pmh-stats" id="px-head"></div></div><div class="sb-modes" role="group" aria-label="Study mode"></div></div><div id="px-body"></div></div></div></div>';
    $('px-q').addEventListener('input',function(){F.q=this.value;saveF();V.shown=15;V.order=null;drawList()});
    $('px-ftog').addEventListener('click',function(){V.fopen=!V.fopen;lsSet('csPracFOpen',V.fopen);fsum()});
    $('px-fsum').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;
      if(b.dataset.a==='fclear'){F.us=[];F.pp='';F.src='exam';F.cmd='';F.mk='';F.st='';F.shuffle=false;saveF();V.shown=15;V.order=null;draw()}
      else{V.fopen=true;lsSet('csPracFOpen',true);fsum()}});
    $('px-units').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;var u=b.dataset.u;
      if(u==='all')F.us=[];else{var k=F.us.indexOf(u);if(k>-1)F.us.splice(k,1);else F.us.push(u)}
      F.cmd='';saveF();V.shown=15;V.order=null;draw()});
    ['src','cmd','mk','st','pp'].forEach(function(k){$('px-'+k).addEventListener('change',function(){F[k]=this.value;saveF();V.shown=15;V.order=null;draw()})});
    $('px-shuf').addEventListener('click',function(){F.shuffle=!F.shuffle;saveF();V.order=null;V.shown=15;draw()});
    el.querySelector('.px-modes .seg').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;V.mode=b.dataset.m;draw()});
    $('px-body').addEventListener('click',onClick);
    $('px-body').addEventListener('change',onChange);
    V.ready=true;syncInit();samp();badge();
  }
  draw();
}
function head(){
  var sl=isSL(),all=Q.filter(function(q){return !(sl&&q.h)&&q.k!=='term'});
  var tried=0,got=0,tot=0,full=0;all.forEach(function(q){var r=rec(q.id);if(r&&r[0]!=null){tried++;got+=r[0];tot+=r[1];if(r[0]>=r[1])full++}});
  var last=P.papers.slice(-1)[0];
  $('px-head').innerHTML='<span>Marked <b>'+tried+'</b></span><span>Score <b>'+(tot?Math.round(100*got/tot)+'%':'–')+'</b></span><span>Last paper <b>'+(last?last[1]+'/'+last[2]:'–')+'</b></span>';
}
/* collapsible filters: a one-line summary of what is applied */
V.fopen=!!lsGet('csPracFOpen',false);
function fsum(){
  var el=$('px-filters');if(!el)return;
  var parts=[],n=0,lab=function(id){var x=$(id);return x&&x.selectedIndex>=0?x.options[x.selectedIndex].text.replace(/\s*\(\d+\)$/,''):''};
  if(F.us.length){parts.push(unitsLabel());n++}else parts.push('All units');
  if(F.pp){parts.push('Paper '+F.pp);n++}
  if(F.src!=='exam'){parts.push(lab('px-src'));n++}
  if(F.cmd){parts.push(F.cmd);n++}
  if(F.mk){parts.push(lab('px-mk')+' marks');n++}
  if(F.st){parts.push(lab('px-st'));n++}
  if(F.shuffle){parts.push('Shuffled');n++}
  el.classList.toggle('open',!!V.fopen);
  var t=$('px-ftog');t.setAttribute('aria-expanded',String(!!V.fopen));t.innerHTML='Filters'+(n?' <b class="fnum">'+n+'</b>':'')+'<span class="fchev" aria-hidden="true">'+(V.fopen?'▴':'▾')+'</span>';
  $('px-fsum').innerHTML=V.fopen?'':'<button type="button" class="fsum-t">'+esc(parts.join(' · '))+'</button>'+(n?'<button type="button" class="fsum-x" data-a="fclear">Clear</button>':'');
}
function draw(){
  head();
  document.querySelectorAll('.px-modes .seg button').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.m===V.mode))});
  var sl=isSL();
  $('px-units').innerHTML=UNITS.filter(function(u){if(u[0]==='all'||u[0]==='CS'||u[0]==='EX')return true;var l=CS.lines.filter(function(x){return x.id===u[0]})[0];return !(sl&&l&&l.pages.every(function(p){return p.hl}))}).map(function(u){
    var n=u[0]==='all'?0:pool('u').filter(function(q){return unitsOf(q).indexOf(u[0])>-1}).length;
    return '<button type="button" class="chip'+(u[0]!=='all'?' th-'+thOf(u[0]):'')+'" data-u="'+u[0]+'" aria-pressed="'+(u[0]==='all'?!F.us.length:F.us.indexOf(u[0])>-1)+'"'+(u[0]!=='all'&&!n?' disabled':'')+'>'+(u[0]!=='all'?'<i></i>':'')+esc(u[1])+(u[0]!=='all'?' <small>'+n+'</small>':'')+'</button>'}).join('');
  var cm={};pool('cmd').forEach(function(q){cm[q.c]=(cm[q.c]||0)+1});
  if(F.cmd&&!cm[F.cmd])F.cmd='';
  $('px-cmd').innerHTML='<option value="">Any</option>'+Object.keys(cm).sort(function(a,b){return cm[b]-cm[a]}).map(function(c){return '<option value="'+esc(c)+'"'+(F.cmd===c?' selected':'')+'>'+esc(c)+' ('+cm[c]+')</option>'}).join('');
  $('px-src').value=F.src;$('px-pp').value=F.pp||'';$('px-mk').value=F.mk||'';$('px-st').value=F.st||'';
  if($('px-q').value!==F.q)$('px-q').value=F.q||'';
  $('px-shuf').setAttribute('aria-pressed',String(!!F.shuffle));
  $('px-filters').classList.toggle('paper',V.mode==='paper');fsum();var tt=$('px-title');if(tt)tt.textContent=V.mode==='paper'?'Mini paper':'Question bank';
  if(V.mode==='paper')drawPaper();else drawList();
}
function card(q,n,opt){
  opt=opt||{};
  var r=rec(q.id),s=status(q.id),h=href(q),th=thOf(q.u);
  var out='<article class="pq th-'+th+'" data-id="'+q.id+'">'+
    '<header class="pq-h">'+(n?'<span class="pq-n">'+n+'</span>':'')+'<span class="pq-code">'+esc(codeOf(q))+'</span><span class="pq-src">'+esc(KIND[q.k]||'')+(titleOf(q)&&q.u!=='CS'&&!q.us?' · '+esc(titleOf(q)):'')+'</span>'+(q.h?'<span class="hltag">HL</span>':'')+
    '<span class="pq-sp"></span>'+(opt.paper?'':'<span class="pq-st st-'+s+'">'+(s==='new'?'Not tried':s==='full'?'Full marks':'Scored '+r[0]+'/'+r[1])+'</span>')+
    '<button type="button" class="pq-star" data-a="star" aria-pressed="'+starred(q.id)+'" aria-label="Star this question">'+(starred(q.id)?'★':'☆')+'</button></header>'+
    '<div class="pq-q"><span class="pq-cmd">'+esc(q.c)+'</span> '+q.q+' <span class="pq-mk">['+q.m+']</span></div>'+
    (/Python/.test(q.q)?'<p class="lang-note">Sitting Paper 2 in Java? Answer in Java: the marking points are the same.</p>':'')+
    '<textarea class="pq-ans" rows="'+(q.m>=6?7:q.m>=3?4:2)+'" placeholder="'+(opt.paper?'Your answer':'Write your answer first (optional), then open the markscheme')+'" aria-label="Your answer">'+esc(V.ans[q.id]||'')+'</textarea>';
  if(!opt.paper)out+='<div class="pq-act"><button type="button" class="minibtn pri" data-a="ms">Show markscheme</button><button type="button" class="minibtn pq-ai" data-a="ai"'+(SAMPLE?'':' hidden')+'><span aria-hidden="true">✦</span> Mark with Claude</button>'+notesLink(q)+'</div>';
  out+='<div class="pq-ms"'+(opt.open?'':' hidden')+'>'+ms(q)+(q.st&&q.st.length?'<div class="pq-st"><div class="pq-lab">How to get the marks</div><ol>'+q.st.map(function(x){return '<li>'+x+'</li>'}).join('')+'</ol></div>':'')+(q.tr?'<div class="pq-tr"><span class="pq-trl">Watch out</span> '+q.tr+'</div>':'')+'</div></article>';
  return out;
}
function ms(q){
  var r=rec(q.id),cur=r&&r[0]!=null?r[0]:null,essay=q.k==='essay';
  return '<div class="pq-lab">'+(essay?'Model response · read it, then judge your own answer against the markband':'Markscheme · tick each point you made (one mark each, up to '+q.m+')')+'</div>'+
    '<ul class="pq-pts">'+q.a.map(function(a,i){return '<li>'+(essay?'<span class="pq-dot" aria-hidden="true"></span><span>'+a+'</span>':'<label><input type="checkbox" data-pt="'+i+'"><span>'+a+'</span></label>')+'</li>'}).join('')+'</ul>'+
    (q.ex?'<div class="pq-ex"><div class="pq-lab">Example answer · other correct answers earn the same marks</div><pre class="lang-py">'+esc(q.ex.py)+'</pre><pre class="lang-java">'+esc(q.ex.java)+'</pre></div>':'')+
    (essay?'<p class="pq-band">'+(q.m===12?'HL markbands: 1–3 basic · 4–6 adequate · 7–9 competent · 10–12 proficient.':'SL markbands: 1–2 basic · 3–4 adequate · 5–6 competent.')+' Top band: a clear position, accurate case-study terms, both sides with specific mechanisms, and a justified conclusion.</p>':'')+
    '<div class="pq-score"><span>Your mark</span><span class="pq-btns">'+Array.apply(null,Array(q.m+1)).map(function(_,i){return '<button type="button" data-mk="'+i+'" aria-pressed="'+(cur===i)+'">'+i+'</button>'}).join('')+'</span><span class="pq-of">/ '+q.m+'</span></div><div class="pq-aiout" aria-live="polite"></div>';
}
V.ans=lsGet('csPracAns',{});
var ansT=null;function saveAns(){clearTimeout(ansT);ansT=setTimeout(function(){lsSet('csPracAns',V.ans)},600)}
function listOrder(list){
  if(!F.shuffle)return list;
  if(!V.order){V.order=shuffled(list.map(function(q){return q.id}))}
  var pos={};V.order.forEach(function(id,i){pos[id]=i});
  return list.slice().sort(function(a,b){return (pos[a.id]==null?1e9:pos[a.id])-(pos[b.id]==null?1e9:pos[b.id])});
}
function drawList(){
  $('view-practice').classList.remove('px-focus');
  var list=listOrder(pool());
  $('px-count').textContent=list.length+' question'+(list.length===1?'':'s');
  var body=$('px-body');if(V.mode!=='bank')return;
  if(!list.length){body.innerHTML='<p class="note">No questions match. Clear the search or pick “Any” in the filters.'+(isSL()?' Some questions are HL only: switch to HL to see them.':'')+'</p>';return}
  var marks=list.reduce(function(s,q){return s+q.m},0);
  var h=(STOPF?'<div class="px-stop"><span>Questions for <b>'+esc(stopName(STOPF))+'</b></span><button type="button" class="minibtn" data-a="allq">Show all questions</button></div>':'')+'<div class="px-sum"><b>'+list.length+'</b> questions · <b>'+marks+'</b> marks'+(F.us.length?' in '+esc(unitsLabel()):'')+(F.pp?' · Paper '+F.pp:'')+(F.us.length>1&&F.src!=='mix'?' · includes questions that mix these units':'')+'</div><div class="pq-list">'+list.slice(0,V.shown).map(function(q){return card(q)}).join('')+'</div>';
  if(list.length>V.shown)h+='<div class="px-more"><button type="button" class="pill" data-a="more">Show '+Math.min(15,list.length-V.shown)+' more · '+(list.length-V.shown)+' left</button></div>';
  body.innerHTML=h;
}

/* ---------- mini paper ---------- */
var TIMER=null;
function drawPaper(){
  var body=$('px-body'),P0=V.paper;$('view-practice').classList.toggle('px-focus',!!P0);
  $('px-count').textContent=pool().filter(function(q){return q.k!=='term'}).length+' questions to draw from';
  if(!P0){
    var avail=pool().filter(function(q){return q.k!=='term'}),am=avail.reduce(function(s,q){return s+q.m},0);
    var full=isSL()?50:80,cur=paperTarget();
    var intro=F.pp==='1'?'<b>Section A</b>: Theme A questions (lines A1–A4). <b>Section B</b>: case-study questions, '+(isSL()?'about 12 of the 50 marks':'about 24 of the 80 marks')+', the same split as the real Paper 1.'
      :F.pp==='2'?'Theme B only: computational thinking, programming and OOP'+(isSL()?'':', plus ADTs at HL')+'. Write your code and trace tables by hand, as in the exam.'
      :'A random set of questions from your filters.';
    body.innerHTML='<div class="px-paper-setup mapcard"><h2>'+(F.pp?'Paper '+F.pp+' practice':'Mini paper')+'</h2>'+
      '<div class="seg px-pp" role="group" aria-label="Which paper"><button type="button" data-pp="" aria-pressed="'+(!F.pp)+'">Any topics</button><button type="button" data-pp="1" aria-pressed="'+(F.pp==='1')+'">Paper 1</button><button type="button" data-pp="2" aria-pressed="'+(F.pp==='2')+'">Paper 2</button></div>'+
      '<p>'+intro+(F.us.length?' Units: <b>'+esc(unitsLabel())+'</b>.':'')+' Timed at exam pace (about 1.5 minutes a mark). Markschemes stay hidden until you finish, then you mark each answer and the total is saved.</p>'+
      '<div class="px-len" role="radiogroup" aria-label="Length">'+[[12,'Quick','18 min'],[20,'Standard','30 min'],[30,'Long','45 min'],[full,'Full paper length',isSL()?'1 h 15 min':'2 h']].map(function(x){return '<label class="wdir'+(cur===x[0]?' on':'')+'"><input type="radio" name="pxlen" value="'+x[0]+'"'+(cur===x[0]?' checked':'')+'><b>'+x[1]+'</b><span>'+x[0]+' marks · '+x[2]+'</span></label>'}).join('')+'</div>'+
      '<p class="px-avail">'+avail.length+' questions ('+am+' marks) match your filters.'+(am<12?' Widen the filters to build a paper.':'')+'</p>'+
      '<div><button type="button" class="pill pri" data-a="start"'+(am<12?' disabled':'')+'>Start the paper</button></div>'+
      (P.papers.length?'<div class="px-hist"><h3>Your last papers</h3>'+P.papers.slice(-6).reverse().map(function(p){var d=new Date(p[0]);return '<div><span>'+d.toLocaleDateString('en-GB',{day:'numeric',month:'short'})+'</span><b>'+p[1]+' / '+p[2]+'</b><span>'+Math.round(100*p[1]/p[2])+'% · '+p[3]+' min</span></div>'}).join('')+'</div>':'')+'</div>';
    return;
  }
  var qs=P0.ids.map(function(id){return BYID[id]}),total=qs.reduce(function(s,q){return s+q.m},0);
  var h='<div class="px-bar" id="px-bar"><span class="px-time" id="px-time"></span><span class="px-tot" id="px-tot"></span><span class="pq-sp"></span>'+(P0.done?'<button type="button" class="minibtn" data-a="quit">New paper</button>':'<button type="button" class="minibtn" data-a="quit">← Leave paper</button><button type="button" class="minibtn pri" data-a="finish">Finish and mark</button>')+'</div>';
  var secs=P0.pp==='1'&&P0.secB!=null&&P0.secB<qs.length;
  h+='<div class="pq-list">'+qs.map(function(q,i){return (secs&&i===0?'<h3 class="px-sec">Section A · Theme A</h3>':'')+(secs&&i===P0.secB?'<h3 class="px-sec">Section B · Case study</h3>':'')+card(q,i+1,{paper:true,open:P0.done})}).join('')+'</div>';
  if(P0.done)h+='<div class="px-more"><button type="button" class="pill pri" data-a="save">Save this paper</button></div>';
  body.innerHTML=h;
  if(P0.done){qs.forEach(function(q){var b=P0.marks[q.id];if(b!=null)pressMark(q.id,b)})}
  tick();clearInterval(TIMER);if(!P0.done)TIMER=setInterval(tick,1000);
}
function tick(){
  var P0=V.paper,el=$('px-time');if(!P0||!el){clearInterval(TIMER);return}
  var qs=P0.ids.map(function(id){return BYID[id]}),total=qs.reduce(function(s,q){return s+q.m},0);
  if(P0.done){var got=0,n=0;qs.forEach(function(q){if(P0.marks[q.id]!=null){got+=P0.marks[q.id];n++}});el.textContent='Marking: '+n+' of '+qs.length+' done';$('px-tot').textContent=got+' / '+total+' marks';return}
  var left=Math.round((P0.end-Date.now())/1000),neg=left<0,a=Math.abs(left);
  el.textContent=(neg?'Over time by ':'')+Math.floor(a/60)+':'+('0'+a%60).slice(-2)+(neg?'':' left');
  el.classList.toggle('over',neg);$('px-tot').textContent=qs.length+' questions · '+total+' marks';
}
function paperTarget(){var o=lsGet('csPracPaper',{marks:20}),m=+o.marks||20;return (m===50||m===80)?(isSL()?50:80):m}
function build(target){
  var avail=shuffled(pool().filter(function(q){return q.k!=='term'}));
  // prefer questions not yet at full marks
  avail.sort(function(a,b){return (status(a.id)==='full'?1:0)-(status(b.id)==='full'?1:0)});
  function take(list,t){var pick=[],sum=0;for(var i=0;i<list.length&&sum<t;i++){var q=list[i];if(sum+q.m<=t||!pick.length){pick.push(q);sum+=q.m}}return [pick,sum]}
  function byI(a,b){return a.i-b.i}
  var pick,secB=null;
  if(F.pp==='1'){   // Paper 1: Section A (Theme A) then Section B (case study), in the real paper's proportions
    var cs=avail.filter(function(q){return q.u==='CS'}),th=avail.filter(function(q){return q.u!=='CS'});
    var rb=take(cs,Math.round(target*(isSL()?12/50:24/80))),ra=take(th,target-rb[1]);
    if(!ra[0].length){ra=[[],0];rb=take(cs,target)}
    pick=ra[0].sort(byI).concat(rb[0].sort(byI));secB=ra[0].length;
  }else{pick=take(avail,target)[0].sort(byI)}
  var sum=pick.reduce(function(s,q){return s+q.m},0);
  return {ids:pick.map(function(q){return q.id}),start:Date.now(),end:Date.now()+Math.round(sum*1.5*60)*1000,mins:Math.round(sum*1.5),marks:{},done:false,pp:F.pp,secB:secB};
}
function pressMark(id,mk){var c=document.querySelector('.pq[data-id="'+id+'"]');if(!c)return;c.querySelectorAll('.pq-btns button').forEach(function(b){b.setAttribute('aria-pressed',String(+b.dataset.mk===mk))})}

/* ---------- events ---------- */
function onChange(e){
  var t=e.target;
  if(t.name==='pxlen'){var o={marks:+t.value};lsSet('csPracPaper',o);document.querySelectorAll('.px-len .wdir').forEach(function(l){l.classList.toggle('on',l.querySelector('input').checked)});return}
  if(t.dataset.pt!=null){
    var c=t.closest('.pq'),q=BYID[c.dataset.id],n=c.querySelectorAll('input[data-pt]:checked').length;
    if(q.k!=="essay"){var mk=Math.min(n,q.m);pick(q,mk,c,false)}
  }
}
document.addEventListener('input',function(e){var t=e.target;if(!t.classList||!t.classList.contains('pq-ans'))return;var c=t.closest('.pq');if(!c)return;V.ans[c.dataset.id]=t.value;saveAns()});
function pick(q,mk,c,soft){
  pressMark(q.id,mk);
  if(V.mode==='paper'&&V.paper){V.paper.marks[q.id]=mk;tick();return}
  if(soft)return;
  setScore(q.id,mk);
  var st=c.querySelector('.pq-st');if(st){var s=status(q.id);st.className='pq-st st-'+s;st.textContent=s==='full'?'Full marks':'Scored '+mk+'/'+q.m}
  head();
}
function onClick(e){
  var b=e.target.closest('button');if(!b)return;
  var c=b.closest('.pq'),q=c?BYID[c.dataset.id]:null,a=b.dataset.a;
  if(b.dataset.mk!=null&&q){pick(q,+b.dataset.mk,c,false);return}
  if(a==='star'&&q){toggleStar(q.id);b.setAttribute('aria-pressed',String(starred(q.id)));b.textContent=starred(q.id)?'★':'☆';return}
  if(a==='ms'&&q){var m=c.querySelector('.pq-ms');m.hidden=!m.hidden;b.textContent=m.hidden?'Show markscheme':'Hide markscheme';return}
  if(a==='ai'&&q){askClaude(q,c,b);return}
  if(a==='more'){V.shown+=15;drawList();return}
  if(a==='allq'){STOPF=null;V.shown=15;V.order=null;draw();return}
  if(b.dataset.pp!=null&&!c){F.pp=b.dataset.pp;saveF();V.order=null;draw();return}
  if(a==='start'){V.paper=build(paperTarget());drawPaper();window.scrollTo(0,$('px-body').getBoundingClientRect().top+window.scrollY-80);return}
  if(a==='finish'){V.paper.done=true;V.paper.took=Math.max(1,Math.round((Date.now()-V.paper.start)/60000));clearInterval(TIMER);drawPaper();return}
  if(a==='quit'){clearInterval(TIMER);V.paper=null;drawPaper();return}
  if(a==='save'){
    var P0=V.paper,qs=P0.ids.map(function(id){return BYID[id]}),total=0,got=0,miss=0;
    qs.forEach(function(q){total+=q.m;var m=P0.marks[q.id];if(m==null){miss++;return}got+=m});
    if(miss){b.textContent='Mark all '+qs.length+' answers first ('+miss+' left)';return}
    qs.forEach(function(q){var r=(rec(q.id)||[null,q.m,0,0]).slice();r[0]=P0.marks[q.id];r[1]=q.m;r[2]=Date.now();P.q[q.id]=r});
    P.papers.push([Date.now(),got,total,P0.took||P0.mins]);P.papers=P.papers.slice(-30);dirty();
    V.paper=null;drawPaper();head();return;
  }
}
function askClaude(q,c,btn){
  var out=c.querySelector('.pq-aiout'),ans=(c.querySelector('.pq-ans').value||'').trim();
  var m=c.querySelector('.pq-ms');if(m.hidden){m.hidden=false;var sb=c.querySelector('[data-a="ms"]');if(sb)sb.textContent='Hide markscheme'}
  if(!SAMPLE){out.innerHTML='<span class="wai-wait">Claude marking is not available here. Mark it yourself with the ticks.</span>';return}
  if(ans.length<3){out.innerHTML='<span class="wai-wait">Write your answer in the box first, then ask Claude to mark it.</span>';return}
  btn.disabled=true;out.innerHTML='<span class="wai-wait">Claude is marking your answer…</span>';
  var pts=q.a.map(function(x,i){return (i+1)+'. '+strip(x)}).join('\n');
  var prompt='You are an IB Diploma Computer Science examiner (syllabus first assessed 2027). Mark the student answer strictly against the markscheme.\n'+
    'Command term: '+q.c+'. Total marks: '+q.m+'.\n'+(q.k==='essay'?'This is an extended response marked with markbands. The model response below shows what a top-band answer contains.\n':'Award one mark per markscheme point the answer clearly makes (accept equivalent wording, do not reward vague or contradictory statements), up to the total.\n')+
    '\nQuestion: '+strip(q.q)+'\n\nMarkscheme points:\n'+pts+'\n\nStudent answer:\n'+ans.slice(0,3000)+'\n\n'+
    'Reply with only JSON: {"mark": integer 0-'+q.m+', "points": [numbers of the markscheme points awarded], "feedback": "two short sentences to the student: what earned marks and exactly what to add for the missing marks"}';
  SAMPLE.json(prompt,{modelTier:'quick'}).then(function(res){
    var mk=res&&res.mark!=null?Math.max(0,Math.min(q.m,Math.round(+res.mark))):null;if(mk==null||isNaN(mk))throw {code:'invalid_json'};
    btn.disabled=false;
    if(q.k!=='essay'&&Array.isArray(res.points))c.querySelectorAll('input[data-pt]').forEach(function(x){x.checked=res.points.map(Number).indexOf(+x.dataset.pt+1)>-1});
    pressMark(q.id,mk);
    out.innerHTML='<div class="wai-res"><b>Claude: '+mk+' / '+q.m+'.</b> '+esc(String(res.feedback||''))+' <button type="button" class="btn sm" data-mk="'+mk+'">Use this mark</button></div>';
  }).catch(function(e){
    btn.disabled=false;var code=e&&e.code;
    if(code==='not_granted'){SAMPLE=null;document.querySelectorAll('.pq-ai').forEach(function(x){x.hidden=true});out.innerHTML='<span class="wai-wait">Claude marking is switched off for this page. Mark it yourself with the ticks.</span>';return}
    out.innerHTML='<span class="wai-wait">'+(code==='rate_limited'?'Claude is busy right now. Try again in a minute, or mark it yourself.':'Claude couldn\'t mark this one. Mark it yourself with the ticks.')+'</span>';
  });
}
function stopName(n){var ps=n.split('.'),m=CS.meta[ps[0]],st=m&&m.st.filter(function(x){return x[0]===ps[1]})[0];return (PAGES[ps[0]]?PAGES[ps[0]].code+' · ':'')+(st?st[1]:ps[1])}
window.csPrac={render:render,mode:function(){return V.mode},setMode:function(m){V.mode=m;if(V.ready)draw()},stop:function(n){STOPF=n;V.shown=15;V.order=null;V.mode='bank';if(location.hash==='#practice'&&V.ready)draw();else window.csNav('practice')},level:function(){if(V.ready){V.order=null;V.shown=15;if(V.paper&&!V.paper.done){}else draw()}},count:function(sl){return Q.filter(function(q){return !(sl&&q.h)&&q.k!=='term'}).length}};
})();

/* ================= IB CS Cheat Sheet: router, line pages, glossary, search, resources ================= */
(function(){
var CS=window.CS,$=function(id){return document.getElementById(id)};
function esc(t){return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function lsGet(k,d){try{var v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
var ROOTEL=document.documentElement,BODY=document.body;
var LEVEL=lsGet('csLevel','sl');
var PAGES={};CS.lines.forEach(function(l){l.pages.forEach(function(p){p.line=l.id;PAGES[p.id]=p})});
var SPECIAL={exam:'Exam',ia:'IA-assessment','case-study':'Case-study',pseudocode:'Pseudocode'};
var SPECIAL_R={};Object.keys(SPECIAL).forEach(function(k){SPECIAL_R[SPECIAL[k]]=k});
function isSL(){return LEVEL==='sl'}
function routeOf(p){return SPECIAL_R[p]||p}

/* ---------- theme ---------- */
(function(){var t=lsGet('csTheme',null);if(t==='dark'||t==='light')ROOTEL.setAttribute('data-theme',t)})();
function isDark(){var t=ROOTEL.getAttribute('data-theme');if(t)return t==='dark';try{return matchMedia('(prefers-color-scheme: dark)').matches}catch(e){return false}}
$('btn-theme').addEventListener('click',function(){var d=!isDark();ROOTEL.setAttribute('data-theme',d?'dark':'light');lsSet('csTheme',d?'dark':'light')});

/* ---------- level ---------- */
function setLevel(l,quiet){
  LEVEL=l==='hl'?'hl':'sl';BODY.setAttribute('data-level',LEVEL);lsSet('csLevel',LEVEL);
  document.querySelectorAll('.lvl button').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.level===LEVEL))});
  if(quiet)return;
  renderHome();if(GLOSS.ready)renderGloss();
  if(window.csFc&&window.csFc.ready)window.csFc.level();
  if(window.csPrac)window.csPrac.level();
  if(CUR.v==='page')mountPage(CUR.p,CUR.s);
}
document.querySelectorAll('.lvl button').forEach(function(b){b.addEventListener('click',function(){setLevel(b.dataset.level)})});
setLevel(LEVEL,true);

/* ---------- code language (Theme B examples) ---------- */
var LANG=lsGet('csLang','py');
function setLang(l){
  LANG=l==='java'?'java':'py';BODY.setAttribute('data-lang',LANG);lsSet('csLang',LANG);
  document.querySelectorAll('.langsw button').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.lang===LANG))});
}
document.querySelectorAll('.langsw button').forEach(function(b){b.addEventListener('click',function(){setLang(b.dataset.lang)})});
setLang(LANG);

/* ---------- find in the notes: jump to and highlight the words you searched for ---------- */
var FIND={pending:null,hits:[],i:0,label:''};
function findReq(o){FIND.pending=o}
window.csFindNext=findReq;
function clearFind(){
  document.querySelectorAll('mark.find').forEach(function(m){var t=document.createTextNode(m.textContent);m.parentNode.replaceChild(t,m);t.parentNode.normalize()});
  document.querySelectorAll('.find-btn').forEach(function(b){b.classList.remove('find-btn','cur')});
  document.querySelectorAll('.find-head').forEach(function(b){b.classList.remove('find-head')});
  FIND.hits=[];FIND.i=0;var fb=$('findbar');if(fb)fb.hidden=true;
}
function hiddenIn(el,root){for(var n=el;n&&n!==root.parentNode;n=n.parentElement){if(n.nodeType===1&&getComputedStyle(n).display==='none')return true}return false}
function openDetails(el){for(var n=el;n;n=n.parentElement){if(n.tagName==='DETAILS'&&!n.open)n.open=true}}
function rxFor(q,st){q=String(q||'').trim();if(!q)return null;var parts=q.split(/[\s\-–]+/).filter(Boolean).map(function(w){return w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')});return new RegExp('(?<![A-Za-z0-9])'+parts.join('[\\s\\-–:,]+')+(st?'[A-Za-z]*':''),'gi')}
function markText(root,rx){
  var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(n){var p=n.parentElement;if(!p||/^(SCRIPT|STYLE|TEXTAREA)$/.test(p.tagName)||p.closest('svg'))return NodeFilter.FILTER_REJECT;return n.nodeValue.trim()?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP}});
  var nodes=[],full='',starts=[],n;while((n=w.nextNode())){starts.push(full.length);nodes.push(n);full+=n.nodeValue+' '}
  var segs=[],m;rx.lastIndex=0;
  while((m=rx.exec(full))){if(!m[0].length){rx.lastIndex++;continue}var s=m.index,e=s+m[0].length,first=null;
    for(var k=0;k<nodes.length;k++){var a=starts[k],b=a+nodes[k].nodeValue.length;if(b<=s)continue;if(a>=e)break;segs.push({k:k,s:Math.max(0,s-a),e:Math.min(b,e)-a,first:first===null});first=k}}
  var out=[];
  for(var j=segs.length-1;j>=0;j--){var g=segs[j],node=nodes[g.k];if(hiddenIn(node.parentElement,root))continue;
    var mid=node;if(g.e<mid.nodeValue.length)mid.splitText(g.e);if(g.s>0)mid=mid.splitText(g.s);
    var mk=document.createElement('mark');mk.className='find';mid.parentNode.replaceChild(mk,mid);mk.appendChild(mid);if(g.first)out.unshift(mk)}
  return out;
}
function runFind(f){
  var art=$('view-page').querySelector('.pg');if(!art)return;
  var sec=art.querySelector('.secs>section.cur')||art,hits=[],anchor=null;
  if(f.head){var want=nrm(f.head).replace(/\s+/g,' ').trim();sec.querySelectorAll(HEADSEL).forEach(function(h){if(!anchor&&want&&nrm(h.textContent).replace(/\s+/g,' ').trim().indexOf(want)===0)anchor=h})}
  if(f.t){var trx=rxFor(f.q);if(trx)hits=markText(sec,trx);
    if(!hits.length)sec.querySelectorAll('button.gl[data-t="'+f.t+'"]').forEach(function(b){if(!hiddenIn(b,sec)){b.classList.add('find-btn');hits.push(b)}})}
  var multi=false;
  if(!hits.length&&f.q&&f.multi){var alts=f.q.split('|').filter(Boolean).map(function(w){return w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')});
    if(alts.length){hits=markText(sec,new RegExp('(?<![A-Za-z0-9])('+alts.join('|')+')[A-Za-z]*','gi'));multi=true}}
  if(!hits.length&&f.q){var rx=rxFor(f.q.replace(/\|/g,' '),f.stem);if(rx)hits=markText(sec,rx);
    if(!hits.length){var ws=String(f.q).split(/[\s|]+/).filter(function(x){return x.length>2}).sort(function(a,b){return b.length-a.length});if(ws.length)hits=markText(sec,rxFor(ws[0],1))}}
  if(!hits.length&&!TB&&!f._tb&&sec.querySelector('.tb')){f._tb=1;setTB(true);keyTerms(art);runFind(f);if(!FIND.hits.length){setTB(false);keyTerms(art)}return}   /* only in the textbook text: open it */
  FIND.hits=hits;FIND.i=0;FIND.label=f.label||f.q||'';
  if(!hits.length){if(anchor){anchor.scrollIntoView({block:'center',behavior:'smooth'});anchor.classList.add('find-head')}showFindbar(0);return}
  hits.forEach(function(h){openDetails(h)});
  var start=0;
  if(anchor){for(var k=0;k<hits.length;k++){if(anchor.contains(hits[k])||(anchor.compareDocumentPosition(hits[k])&Node.DOCUMENT_POSITION_FOLLOWING)){start=k;break}}}
  else if(multi){var bestN=0;hits.forEach(function(h,k){var blk=h.closest('p,li,td,th,h3,summary')||h.closest('div');if(!blk||!sec.contains(blk))return;var seen={};blk.querySelectorAll('mark.find').forEach(function(m){seen[m.textContent.toLowerCase().slice(0,5)]=1});var n=Object.keys(seen).length;if(n>bestN){bestN=n;start=k}})}
  focusHit(start);
}
function focusHit(i){
  var h=FIND.hits;if(!h.length)return;FIND.i=(i+h.length)%h.length;
  h.forEach(function(x,j){x.classList.toggle('cur',j===FIND.i)});
  h[FIND.i].scrollIntoView({block:'center',behavior:'smooth'});showFindbar(h.length);
}
function showFindbar(n){
  var fb=$('findbar');
  if(!fb){fb=document.createElement('div');fb.id='findbar';fb.className='findbar';fb.setAttribute('role','status');document.body.appendChild(fb);
    fb.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;if(b.dataset.f==='prev')focusHit(FIND.i-1);else if(b.dataset.f==='next')focusHit(FIND.i+1);else clearFind()})}
  fb.hidden=false;
  fb.innerHTML='<span class="fb-q">“'+esc(String(FIND.label).slice(0,48))+'”</span>'+(n?'<b>'+(FIND.i+1)+' of '+n+'</b><span class="fb-where">on this stop</span><button type="button" data-f="prev" aria-label="Previous match">↑</button><button type="button" data-f="next" aria-label="Next match">↓</button>':'<span class="fb-where">is in this stop, but in a part hidden at this level or language</span>')+'<button type="button" data-f="x" aria-label="Clear highlights">✕</button>';
}
document.addEventListener('click',function(e){var b=e.target.closest('button[data-expand]');if(!b)return;var box=b.closest('section')||document;var ds=box.querySelectorAll('details.bk-row');var open=b.dataset.expand==='1';ds.forEach(function(d){d.open=open});b.dataset.expand=open?'0':'1';b.textContent=open?'Close all':'Open all'});
document.addEventListener('click',function(e){var a=e.target.closest('a[data-find],a[data-hide]');if(!a)return;
  findReq({q:a.dataset.find||'',label:a.dataset.label||a.dataset.find||'',multi:a.dataset.multi==='1',hide:a.dataset.hide||''});var h=a.getAttribute('href');if(location.hash===h){e.preventDefault();go(parse(h))}},true);
/* coming from a practice question: hide that question's own answer (model answer, full-mark practice, test-yourself) */
function nq(t){return String(t||'').toLowerCase().replace(/\[\d+\]/g,' ').replace(/[^a-z0-9]+/g,' ').trim()}
function hideAnswer(id){
  var art=$('view-page').querySelector('.pg'),q=null;if(!art)return;
  for(var i=0;i<CS.prac.length;i++)if(CS.prac[i].id===id){q=CS.prac[i];break}
  if(!q)return;var d=document.createElement('div');d.innerHTML=q.q;var want=nq(d.textContent);if(want.length<12)return;
  var seen=[];
  art.querySelectorAll('.secs summary, .secs p').forEach(function(el){
    var t=nq(el.textContent);if(!t||(t!==want&&t.indexOf(want)<0))return;
    var box=el.closest('details')||el.parentElement;if(!box||seen.indexOf(box)>-1||box.classList.contains('secs'))return;seen.push(box);
    box.classList.add('ans-hid');
    var ph=document.createElement('div');ph.className='ans-ph';
    ph.innerHTML='<span><b>Answer hidden.</b> This is the question you are practising, so its answer stays hidden while you read the notes.</span><button type="button" class="minibtn">Show answer</button>';
    ph.querySelector('button').onclick=function(){box.classList.remove('ans-hid');ph.remove()};
    box.parentNode.insertBefore(ph,box);
  });
}

/* ---------- router ---------- */
var CUR={v:''};
function parse(h){
  h=String(h||'').replace(/^#/,'');
  if(!h)return {v:'map'};
  var parts=h.split('.'),id=parts[0];
  if(id==='map'||id==='flashcards'||id==='glossary'||id==='resources')return {v:id};
  if(id==='practice')return {v:'practice',u:parts[1]||''};
  if(id==='specimen')return {v:'specimen',u:parts[1]||''};
  if(SPECIAL[id])return {v:'page',p:SPECIAL[id],s:parts[1]||''};
  if(CS.meta[id])return {v:'page',p:id,s:parts[1]||''};
  for(var i=0;i<CS.index.length;i++)if(CS.index[i].s===id)return {v:'page',p:CS.index[i].p,s:id};
  return {v:'map'};
}
function show(v){
  document.querySelectorAll('.view').forEach(function(el){el.classList.toggle('on',el.id==='view-'+v)});
  var tab=v==='page'?(SPECIAL_R[CUR.p]||'map'):(v==='flashcards'||v==='specimen'?'practice':v);
  document.querySelectorAll('#tabs a').forEach(function(a){a.classList.toggle('on',a.dataset.v===tab)});
}
/* one Practice tab: exam questions and flashcards share a "Choose a way to study" bar (as in the BM notes) */
var QMODES=[['bank','Question bank','Write answers, tick the markscheme'],['paper','Mini paper','Timed, Paper 1 or Paper 2']];
function studyBar(){
  var fcm=window.csFc&&window.csFc.modes?window.csFc.modes():[],isF=CUR.v==='flashcards',isS=CUR.v==='specimen',cur=isF?'f:'+(window.csFc?window.csFc.mode():''):'q:'+(window.csPrac?window.csPrac.mode():'bank');
  var nq=window.csPrac?window.csPrac.count(isSL()):0,nf=window.csFc&&window.csFc.total?window.csFc.total():0,ns=(window.CS_SPEC_Q||[]).length;
  var qm=window.csPrac?window.csPrac.mode():'bank',fm=window.csFc?window.csFc.mode():'flash';
  var t=function(k,lab,n,on){return '<button type="button" role="tab" '+k+' aria-selected="'+on+'">'+lab+' <span>'+(n?n.toLocaleString('en'):'')+'</span></button>'};
  var tabs='<div class="px-tabs" role="tablist" aria-label="Practice">'+t('data-sm="q:'+qm+'"','Exam questions',nq,!isF&&!isS)+t('data-sm="f:'+fm+'"','Flashcards',nf,isF)+t('data-spec="1"','Specimen papers',ns,isS)+'</div>';
  document.querySelectorAll('.studybar').forEach(function(el){el.innerHTML=tabs});
  var list=isF?fcm.map(function(m){return ['f',m]}):QMODES.map(function(m){return ['q',m]});
  var mh=list.map(function(x){var g=x[0],m=x[1],k=g+':'+m[0];return '<button type="button" data-sm="'+k+'" aria-pressed="'+(k===cur)+'" title="'+esc(m[2])+'">'+esc(g==='f'&&m[0]==='flash'?'Flip cards':m[1])+'</button>'}).join('');
  document.querySelectorAll('.sb-modes').forEach(function(el){el.innerHTML=mh});
}
window.csStudyBar=studyBar;
document.addEventListener('click',function(e){
  if(e.target.closest('.studybar button[data-spec]')){nav('specimen');return}
  var bt=e.target.closest('.studybar button[data-sm],.sb-modes button[data-sm]');if(!bt)return;
  var k=bt.dataset.sm.split(':');
  if(k[0]==='q'){if(window.csPrac)window.csPrac.setMode(k[1]);if(CUR.v!=='practice')nav('practice');else studyBar()}
  else{if(window.csFc)window.csFc.start(k[1]);if(CUR.v!=='flashcards')nav('flashcards');else studyBar()}
});
/* "Back to Practice": opening the notes from Practice, Flashcards or the Glossary keeps a way straight back */
var RET=null,RETNAME={practice:'Practice',flashcards:'Practice',glossary:'Glossary',specimen:'Practice'};
function retPill(){
  var b=$('retpill');
  if(!b){b=document.createElement('button');b.type='button';b.id='retpill';b.className='retpill';document.body.appendChild(b);
    b.onclick=function(){var R=RET;RET=null;b.hidden=true;if(!R)return;nav(R.hash.slice(1));
      setTimeout(function(){var c=R.q&&document.querySelector('.pq[data-id="'+R.q+'"]');
        if(c){c.scrollIntoView({block:'center'});c.classList.remove('pq-flash');void c.offsetWidth;c.classList.add('pq-flash')}else window.scrollTo(0,R.y)},80)}}
  b.hidden=!(RET&&CUR.v==='page');if(RET)b.textContent='← Back to '+RETNAME[RET.v];
}
function go(r,noScroll){
  closeSheet(true);clearFind();
  if(r.v==='page'){if(RETNAME[CUR.v])RET={v:CUR.v,hash:'#'+CUR.v+(CUR.u?'.'+CUR.u:''),y:window.scrollY,q:FIND.pending&&FIND.pending.hide}}
  else RET=null;
  CUR=r;retPill();
  if(r.v==='page'){mountPage(r.p,r.s);show('page');if(FIND.pending&&!WAITING){var f=FIND.pending;FIND.pending=null;setTimeout(function(){if(f.hide)hideAnswer(f.hide);if(f.q)runFind(f)},40)}}
  else{FIND.pending=null;show(r.v);if(r.v==='map')renderHome();if(r.v==='glossary')renderGloss();if(r.v==='resources')renderRes();if(r.v==='flashcards'&&window.csFc)window.csFc.init();if(r.v==='flashcards'||r.v==='practice'||r.v==='specimen')setTimeout(studyBar,0);if(r.v==='practice'&&window.csPrac)window.csPrac.render(r.u);if(r.v==='specimen'&&window.csSpec)window.csSpec.render(r.u);}
  if(!noScroll&&!(r.v==='page'&&r.s)&&!(r.v==='specimen'&&/-/.test(r.u||'')))window.scrollTo(0,0);
  var t=r.v==='page'?(CS.meta[r.p]||{}).title:({map:'Home',flashcards:'Flashcards',practice:'Practice',glossary:'Glossary',resources:'Resources',specimen:'Specimen papers'})[r.v];
  document.title=window.CS_STATIC?(r.v==='map'?'IB Computer Science notes 2027 · SL and HL':(t?t+' · ':'')+'IB Computer Science notes'):(t?t+' · ':'')+'IB CS Cheat Sheet';
}
window.addEventListener('hashchange',function(){go(parse(location.hash))});
function nav(h){if(location.hash==='#'+h)go(parse(h));else location.hash=h}
window.csNav=nav;

/* ---------- home: the line map ---------- */
var ICON={
  cards:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="13" height="15" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 3h10.5A2.5 2.5 0 0 1 21 5.5V16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  prac:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M3.5 6l1.5 1.5L7.5 5M3.5 12l1.5 1.5L7.5 11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="5.2" cy="18" r="1.6" fill="currentColor"/></svg>',
  book:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 8h7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  exam:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  case:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="10" r="2" fill="currentColor"/><path d="M3.5 18l5.5-5 4 3.5 3-2.5 4.5 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  code:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 7L3.5 12l5 5M15.5 7l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  ia:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 21h8M12 17v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M8 11l2.5 2.5L16 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  res:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3.2-3.2a4.5 4.5 0 0 0-6.4-6.4L12 5.6M14 10a4.5 4.5 0 0 0-6.4 0l-3.2 3.2a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  search:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M15.5 15.5L21 21" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>'
};
function homeProgress(sl){
  var fc=lsGet('csFcProg',{cards:{}}),cards=CS.fc.cards.filter(function(c){return !(sl&&c.h)}),m=0;
  cards.forEach(function(c){var e=(fc.cards||{})[c.i];if(e&&e[0]>=3)m++});
  var pr=lsGet('csPrac',{q:{}}),qs=(CS.prac||[]).filter(function(q){return !(sl&&q.h)&&q.k!=='term'}),done=0,got=0,tot=0;
  qs.forEach(function(q){var r=(pr.q||{})[q.id];if(r&&r[0]!=null){done++;got+=r[0];tot+=r[1]}});
  return {cards:cards.length,mastered:m,qs:qs.length,done:done,pct:tot?Math.round(100*got/tot):null};
}
function renderHome(){
  var el=$('view-map'),sl=isSL(),P=homeProgress(sl);
  var terms=Object.keys(CS.terms).filter(function(k){return !(sl&&CS.terms[k].h)}).length;
  /* continue where you left off */
  var lr=lsGet('csLastRoute',null),cont='';
  if(lr&&CS.meta[lr.p]&&!(sl&&CS.meta[lr.p].hl)){
    var m=CS.meta[lr.p],st=(m.st||[]).filter(function(x){return x[0]===lr.s})[0],pg=PAGES[lr.p];
    cont='<a class="hm-cont th-'+(m.line||'IA')+'" href="#'+routeOf(lr.p)+(lr.s?'.'+lr.s:'')+'"><span class="k">Continue where you left off</span><b>'+(pg?'<span class="code">'+esc(pg.code)+'</span> ':'')+esc(pg?pg.name:m.title)+'</b>'+(st?'<span>'+esc(st[1])+'</span>':'')+'<i aria-hidden="true">→</i></a>';
  }else{
    var first=CS.lines[0].pages[0];
    cont='<a class="hm-cont th-'+CS.lines[0].id+'" href="#'+first.id+'"><span class="k">New here? Start with</span><b><span class="code">'+esc(first.code)+'</span> '+esc(first.name)+'</b><span>The first stop on the first line</span><i aria-hidden="true">→</i></a>';
  }
  var h='<div class="hm-hero"><div class="hm-hero-in"><div class="hm-intro">'+
    '<div class="eyebrow">IB Diploma · first exams 2027 · '+(sl?'Standard Level':'Higher Level')+'</div>'+
    '<h1>IB Computer Science</h1>'+
    '<p class="hm-sub">Plain-words notes, practice and exam prep for Themes A and B'+(sl?'':', including every HL topic')+'.</p>'+
    '<button type="button" class="hm-search" id="hm-search">'+ICON.search+'<span>Search a term, a phrase or a whole question</span><kbd>/</kbd></button></div>'+
    cont+'</div></div>';
  h+='<div class="wrap hm">';
  /* revise */
  var bar=function(n,d){var w=d?Math.round(100*n/d):0;return '<span class="hm-bar" aria-hidden="true"><i style="width:'+w+'%"></i></span>'};
  h+='<section class="hm-sec" aria-labelledby="hm-rev"><h2 class="hm-h" id="hm-rev">Revise</h2><div class="hm-tools">'+
    '<a class="hm-tool" href="#flashcards"><span class="hm-ic">'+ICON.cards+'</span><span class="hm-tt"><b>Flashcards</b><span>'+P.cards.toLocaleString('en-GB')+' cards · learn, test and games</span>'+bar(P.mastered,P.cards)+'<small>'+(P.mastered?P.mastered.toLocaleString('en-GB')+' mastered so far':'Nothing mastered yet: start with one line')+'</small></span></a>'+
    '<a class="hm-tool" href="#practice"><span class="hm-ic">'+ICON.prac+'</span><span class="hm-tt"><b>Practice questions</b><span>'+P.qs.toLocaleString('en-GB')+' exam questions with markschemes · mini papers</span>'+bar(P.done,P.qs)+'<small>'+(P.done?P.done+' answered · '+P.pct+'% of marks':'No questions answered yet')+'</small></span></a>'+
    '<a class="hm-tool" href="#glossary"><span class="hm-ic">'+ICON.book+'</span><span class="hm-tt"><b>Glossary</b><span>'+terms.toLocaleString('en-GB')+' terms with full-mark definitions</span><small>Every underlined word in the notes opens its definition</small></span></a>'+
    '</div></section>';
  /* study by topic */
  h+='<section class="hm-sec" aria-labelledby="hm-study"><div class="hm-hrow"><h2 class="hm-h" id="hm-study">Study by topic</h2><p>Each coloured line is a topic and each stop is one page of notes. Tap a stop to open it.</p></div>';
  [['A','Theme A','Concepts of computer science · Paper 1'],['B','Theme B','Computational thinking and programming · Paper 2 · Python or Java examples']].forEach(function(t){
    h+='<div class="mapcard hm-map"><header><h3>'+t[1]+'</h3><p>'+t[2]+'</p></header>';
    CS.lines.filter(function(l){return l.theme===t[0]}).forEach(function(l){
      var allhl=l.pages.every(function(p){return p.hl}),vis=l.pages.filter(function(p){return !(sl&&p.hl)}).length;
      h+='<div class="mline th-'+l.id+(allhl?' hlx':'')+'"><a class="mhead" href="#'+l.pages[0].id+'"><span class="mbadge">'+l.id+'</span><span class="mname">'+esc(l.name)+(allhl?' <span class="hltag">HL</span>':'')+'<small>'+vis+' stop'+(vis===1?'':'s')+'</small></span></a><div class="track">';
      l.pages.forEach(function(p){h+='<a class="stop'+(p.hl?' hlx':'')+'" href="#'+p.id+'"><span class="sd" aria-hidden="true"></span><span class="st-t"><span class="code">'+esc(p.code)+(p.hl?' · HL':'')+'</span><b>'+esc(p.name)+'</b></span></a>'});
      h+='</div></div>';
    });
    h+='</div>';
  });
  h+='</section>';
  /* exam prep */
  var tile=function(href,ic,title,txt,th){return '<a class="hm-tile th-'+th+'" href="'+href+'"><span class="hm-ic">'+ICON[ic]+'</span><b>'+title+'</b><span>'+txt+'</span></a>'};
  h+='<section class="hm-sec" aria-labelledby="hm-exam"><h2 class="hm-h" id="hm-exam">Exam prep</h2><div class="hm-tiles">'+
    tile('#exam','exam','Exam toolkit','How each paper works, command terms, full-mark answers and easy marks people lose.','IA')+
    tile('#case-study','case','Case study 2027','Generative AI for images: the booklet guide, models, ethics and model answers.','CS')+
    tile('#pseudocode','code','Pseudocode','How to write algorithms, with a pseudocode ⇄ Python ⇄ Java phrasebook.','B1')+
    tile('#ia','ia','Internal assessment','The five criteria, what earns the top band, the video and the rules.','IA')+
    '</div><a class="hm-res" href="#resources">'+ICON.res+'<span><b>Resources</b> videos, textbooks, revision sites and practice tools</span><i aria-hidden="true">→</i></a></section>';
  /* how it works */
  h+='<details class="hm-help"><summary>How this site works</summary><div class="howto">'+
    '<div><b>One stop at a time</b>Each page starts with the idea in plain words and a picture, then the exam definitions and model answers. Use Next at the bottom, or switch to the whole line.</div>'+
    '<div><b>Tap underlined words</b>Every dotted term opens its definition, a picture and a full-mark practice question.</div>'+
    '<div><b>Test yourself</b>Each line ends with exam-style questions; Practice and Flashcards keep your progress.</div>'+
    '<div><b>SL or HL, Python or Java</b>The switches at the top hide or show the HL material and change every code example.</div></div></details>';
  h+='<p class="note">Unofficial study notes, not affiliated with or endorsed by the International Baccalaureate Organization. Written from the official IB Computer Science guide (first assessment 2027) and checked against the Oxford and Hodder textbooks. Always confirm assessment details with your teacher.</p>';
  h+='</div>';
  el.innerHTML=h;
  var sb=$('hm-search');if(sb)sb.addEventListener('click',openSearch);
}

/* ---------- page notes: fetched after the first screen, each page parsed only when opened ---------- */
var VER=((document.currentScript&&document.currentScript.src)||'').split('?')[1]||'';
var TPL={},TPL_READY=false,WAITING=false;
function tplOf(id){var el=document.getElementById(id);if(el)return el;var src=TPL[id];if(src==null)return null;
  var t=document.createElement('template');t.id=id;t.innerHTML=src;document.body.appendChild(t);delete TPL[id];return t}
function loadTpl(tries){
  fetch('assets/pages.html'+(VER?'?'+VER:'')).then(function(r){if(!r.ok)throw r.status;return r.text()}).then(function(src){
    var re=/<template id="([^"]+)">([\s\S]*?)<\/template>/g,m;while((m=re.exec(src)))TPL[m[1]]=m[2];
    TPL_READY=true;IDX=null;if(CUR.v==='page'&&WAITING)go(CUR,true);
  }).catch(function(){if((tries||0)<3)setTimeout(function(){loadTpl((tries||0)+1)},1500*((tries||0)+1));else if(WAITING)$('view-page').innerHTML='<div class="wrap"><p class="note">The notes could not be loaded. Check your connection and reload the page.</p></div>'});
}
/* ---------- line pages ---------- */
var MODE=lsGet('csMode','step'),LASTSEC=lsGet('csLast',{});
function visibleSecs(art){return [].filter.call(art.querySelectorAll('.secs>section'),function(s){return !(isSL()&&s.hasAttribute('data-hl'))})}
function mountPage(p,sec){
  var view=$('view-page'),tpl=tplOf('pg-'+p);WAITING=false;
  if(!tpl){if(!TPL_READY){WAITING=true;view.innerHTML='<div class="wrap"><p class="note">Loading the notes…</p></div>';return}nav('map');return}
  var meta=CS.meta[p]||{};
  view.innerHTML='';
  if(meta.hl&&isSL()){
    view.innerHTML='<div class="wrap"><div class="hlgate"><span class="hltag">HL only</span><h2>'+esc(meta.title)+'</h2><p>This stop is Higher Level content. Switch to HL to read it, or go back to the line map.</p><div class="sh-links"><button class="pill pri" type="button" id="gate-hl" style="--line:var(--hlbg);--on:var(--hlfg)">Switch to HL</button><a class="pill" href="#map">Line map</a></div></div></div>';
    $('gate-hl').onclick=function(){setLevel('hl')};return;
  }
  view.appendChild(tpl.content.cloneNode(true));
  var art=view.querySelector('.pg'),secs=art.querySelector('.secs');
  if(!secs){return}
  initLine(art);buildRail(art,p);
  var tools=document.createElement('div');tools.className='pgtools';
  tools.innerHTML='<span class="steplabel" id="steplabel"></span><span style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><span class="seg" role="group" aria-label="Layout"><button type="button" data-mode="step" aria-pressed="'+(MODE==='step')+'">One stop</button><button type="button" data-mode="all" aria-pressed="'+(MODE!=='step')+'">Whole line</button></span>'+
    '<span class="seg tbsw" role="group" aria-label="Notes style"><button type="button" data-tb="0" aria-pressed="'+!TB+'" title="Short revision notes">Cheat sheet</button><button type="button" data-tb="1" aria-pressed="'+TB+'" title="Every stop explained in full sentences, with the diagrams and worked examples; the short definition boxes are left to Cheat sheet">Textbook</button></span>'+
    (PAGES[p]?'<a class="minibtn" href="#practice.'+PAGES[p].line+'">Practice '+esc(PAGES[p].line)+'</a><button type="button" class="minibtn" id="pg-fc">Flashcards for '+esc(PAGES[p].code)+'</button>':(p==='Case-study'?'<a class="minibtn" href="#practice.CS">Case-study practice</a>':''))+'</span>';
  secs.parentNode.insertBefore(tools,secs);
  if(PAGES[p]&&PAGES[p].line.charAt(0)==='B'){var lh=document.createElement('div');lh.className='langhint';lh.innerHTML='<span aria-hidden="true">☕</span><span><b>Java mode.</b> Every code example on this page is shown in Java, compiled and run to give the real output, with a “Java vs Python” note where they differ. The explanations still name Python features in places; the <a href="#pseudocode">pseudocode page</a> has a full Python ⇄ Java ⇄ pseudocode table.</span>';secs.parentNode.insertBefore(lh,secs)}
  var sn=document.createElement('div');sn.className='stepnav';sn.innerHTML='<div><button type="button" class="pill" id="st-prev"></button></div><div style="margin-left:auto"><button type="button" class="pill pri" id="st-next"></button></div>';
  secs.parentNode.insertBefore(sn,secs.nextSibling);
  art.classList.toggle('step',MODE==='step');
  tools.querySelectorAll('.seg:not(.tbsw) button').forEach(function(b){b.onclick=function(){MODE=b.dataset.mode;lsSet('csMode',MODE);tools.querySelectorAll('.seg:not(.tbsw) button').forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});art.classList.toggle('step',MODE==='step');showSec(art,CUR.s,false)}});
  var fcb=$('pg-fc');if(fcb)fcb.onclick=function(){openCards(p)};
  tools.querySelectorAll('.tbsw button').forEach(function(b){b.onclick=function(){setTB(b.dataset.tb==='1');keyTerms(art)}});
  keyTerms(art);
  watchCards(art,p,tools);
  art.querySelectorAll('.st').forEach(function(b){b.addEventListener('click',function(){showSec(art,b.dataset.sec,true)})});
  $('st-prev').onclick=function(){var v=visibleSecs(art),i=v.findIndex(function(s){return s.id===CUR.s});if(i>0)showSec(art,v[i-1].id,true)};
  $('st-next').onclick=function(){var v=visibleSecs(art),i=v.findIndex(function(s){return s.id===CUR.s});if(i<v.length-1)showSec(art,v[i+1].id,true)};
  var want=sec||LASTSEC[p];
  showSec(art,want,!!sec);
}
/* Videos (as in the BM notes): cards at the end of each stop, plus whole-topic videos at the top of the page */
var PLAY='<span class="vplay" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M8 5v14l11-7z" fill="#fff"/></svg></span>';
function vcard(c){var href='https://www.youtube.com/watch?v='+c[0]+(c[3]?'&t='+c[3]+'s':''),note=/^[AB]\d\.\d+\.\d+$/.test(c[4])?'Syllabus point '+c[4]:c[4];
  return '<a class="vcard" href="'+href+'" target="_blank" rel="noopener">'+PLAY+'<span><b>'+esc(c[1])+'</b><small>'+esc(c[2])+'</small><em>'+esc(note)+'</em></span></a>'}
function watchCards(art,p,tools){
  var W=(CS.watch&&CS.watch[p])||{};
  if(W.top&&W.top.length&&tools){
    var t=document.createElement('details');t.className='tvids tvids-top';
    t.innerHTML='<summary><b>Watch the whole topic</b><span>'+W.top.length+' video'+(W.top.length>1?'s':'')+' and chapter jumps</span></summary><div class="vcards all">'+W.top.map(vcard).join('')+'</div>';
    tools.parentNode.insertBefore(t,tools.nextSibling);
  }
  art.querySelectorAll('.secs>section').forEach(function(sec){
    var key=p+'.'+sec.id,nq=CS.prac.filter(function(q){return q.n===key&&q.k!=='term'&&!(isSL()&&q.h)}).length;
    if(nq&&window.csPrac){var pa=document.createElement('div');pa.className='stopact';
      pa.innerHTML='<button type="button" class="pill">Practice this stop · '+nq+' question'+(nq>1?'s':'')+'</button>';
      pa.firstChild.onclick=function(){window.csPrac.stop(key)};sec.appendChild(pa)}
    var L=W[sec.id];if(!L||!L.length)return;
    var d=document.createElement('div');d.className='tvids';
    d.innerHTML='<div class="tvids-h"><b>Watch</b><span>'+L.length+' video'+(L.length>1?'s':'')+' for this stop</span></div><div class="vcards">'+L.map(vcard).join('')+'</div>'+(L.length>3?'<button type="button" class="vmore">Show all '+L.length+' videos</button>':'');
    var mb=d.querySelector('.vmore');if(mb)mb.onclick=function(){var v=d.querySelector('.vcards'),all=v.classList.toggle('all');mb.textContent=all?'Show fewer':'Show all '+L.length+' videos'};
    sec.appendChild(d);
  });
}
/* Textbook mode: written explanations (CSS shows .tb) plus a key-terms box at the end of each stop */
var TB=!!lsGet('csTb',false);
function setTB(on){TB=!!on;lsSet('csTb',TB);BODY.setAttribute('data-tb',TB?'on':'off');document.querySelectorAll('.tbsw button').forEach(function(x){x.setAttribute('aria-pressed',String((x.dataset.tb==='1')===TB))})}
function keyTerms(art){
  /* the old "Terms in this stop" box is gone: the route sidebar lists the current stop's terms instead */
  art.querySelectorAll('.kt').forEach(function(k){k.remove()});
  railSync(art,CUR.s);
}
/* ---------- route sidebar (wide screens): the line drawn vertically, this stop's syllabus points, terms and practice ---------- */
var READ=lsGet('csRead',{}),CANDO=lsGet('csCanDo',{});
function sylFor(p,sid){return (window.CS_SYL||[]).filter(function(u){return u.at.some(function(a){return a[0]===p&&a[1]===sid})&&!(isSL()&&u.h)})}
function buildRail(art,p){
  var main=art.querySelector('main');if(!main)return;
  var old=main.querySelector('.rail');if(old)old.remove();
  var r=document.createElement('aside');r.className='rail';r.setAttribute('aria-label','Route through this page');
  main.classList.add('has-rail');main.insertBefore(r,main.firstChild);
  r.addEventListener('click',function(e){
    var b=e.target.closest('[data-go]');if(b){showSec(art,b.dataset.go,true);return}
    var h=e.target.closest('[data-hd]');if(h){var t=art.querySelector('.secs>section.cur .tb-h:nth-of-type(1)');var all=art.querySelectorAll('.secs>section.cur h3.tb-h,.secs>section.cur h3');var el=all[+h.dataset.hd];if(el)el.scrollIntoView({behavior:'smooth',block:'start'});return}
    var c=e.target.closest('input[data-cd]');if(c){CANDO[c.dataset.cd]=c.checked?1:0;if(!c.checked)delete CANDO[c.dataset.cd];lsSet('csCanDo',CANDO);railCount(r);return}
    var x=e.target.closest('[data-act]');if(!x)return;
    if(x.dataset.act==='prac'&&window.csPrac)window.csPrac.stop(p+'.'+CUR.s);
    if(x.dataset.act==='fc')openCards(p);
  });
}
function railCount(r){var n=r.querySelectorAll('input[data-cd]').length,k=r.querySelectorAll('input[data-cd]:checked').length,el=r.querySelector('.rsyl-n');if(el)el.textContent=n?k+' of '+n+' ticked':''}
function railSync(art,sid){
  var r=art&&art.querySelector('.rail');if(!r||!sid)return;
  var p=CUR.p,v=visibleSecs(art),ci=v.findIndex(function(s){return s.id===sid}),rd=READ[p]||[];
  var meta=CS.meta[p]||{},pg=PAGES[p],code=(art.querySelector('header [style*="font-size: 120px"]')||{}).textContent||'';
  var h='<div class="rbox rroute"><div class="rhead"><span class="rbadge">'+esc(code.trim()||'')+'</span><span class="rht"><b>Route</b><small>'+(MODE==='step'?'Stop '+(ci+1)+' of '+v.length:v.length+' stops')+' · '+rd.filter(function(x){return v.some(function(s){return s.id===x})}).length+' read</small></span></div><ol class="rline">';
  v.forEach(function(sec,i){
    var nm=(art.querySelector('.st[data-sec="'+sec.id+'"] .stn')||{}).textContent||sec.id,cd=(sec.querySelector('span[style*="JetBrains"]')||{}).textContent||'';
    if(!/^[AB]\d/.test(cd))cd='';
    var cls=(i===ci?' cur':'')+(i<ci?' past':'')+(rd.indexOf(sec.id)>-1?' read':'')+(sec.id==='quiz'?' term':'');
    h+='<li class="rst'+cls+'"><button type="button" data-go="'+sec.id+'"'+(i===ci?' aria-current="step"':'')+'><i class="rdot" aria-hidden="true"></i><span class="rn">'+esc(nm)+'</span>'+(cd?'<span class="rcode">'+esc(cd)+'</span>':'')+'</button>';
    if(i===ci){var hs=[].slice.call(sec.querySelectorAll(TB?'h3.tb-h':'h3')).filter(function(x){return x.offsetParent!==null&&x.textContent.trim()});
      if(hs.length>1)h+='<ul class="rsub">'+hs.slice(0,8).map(function(x,k){return '<li><button type="button" data-hd="'+[].indexOf.call(sec.querySelectorAll(TB?'h3.tb-h':'h3'),x)+'">'+esc(x.textContent.replace(/\s*\([AB]\d[^)]*\)\s*$/,''))+'</button></li>'}).join('')+'</ul>'}
    h+='</li>';
  });
  h+='</ol></div>';
  var cur=v[ci],us=cur?sylFor(p,cur.id):[];
  if(us.length){
    h+='<div class="rbox rsyl"><div class="rh4"><span>IB guide · this stop</span><span class="rsyl-n"></span></div>'+us.map(function(u){
      return '<details class="ru"><summary><span class="ruc">'+esc(u.c)+(u.h?' <em>HL</em>':'')+'</span><span class="rus">'+esc(u.s)+'</span></summary><ul>'+u.b.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul>'+
        (u.q&&u.q.length?'<div class="rulq"><b>Linking questions</b>'+u.q.map(function(x){return '<span>'+esc(x)+'</span>'}).join('')+'</div>':'')+
        '</details><label class="rcan"><input type="checkbox" data-cd="'+esc(u.c)+'"'+(CANDO[u.c]?' checked':'')+'> I can do this</label>'}).join('')+'</div>';
  }
  if(cur){var seen={},ids=[];cur.querySelectorAll('button.gl[data-t]').forEach(function(b){var id=b.dataset.t,t=CS.terms[id];if(!t||seen[id]||(isSL()&&t.h))return;seen[id]=1;ids.push(id)});
    if(ids.length)h+='<div class="rbox rterms"><div class="rh4"><span>Key terms · this stop</span><span>'+ids.length+'</span></div><div class="rchips">'+ids.slice(0,30).map(function(id){return '<button type="button" class="gl" data-t="'+esc(id)+'">'+esc(CS.terms[id].t)+'</button>'}).join('')+'</div></div>'}
  var sp=(window.CS_SPEC_Q||[]).filter(function(q){return cur&&q.n===p+'.'+cur.id&&!(isSL()&&q.hl)});
  var nq=cur?CS.prac.filter(function(q){return q.n===p+'.'+cur.id&&q.k!=='term'&&!(isSL()&&q.h)}).length:0;
  if(pg&&cur&&cur.id!=='quiz')h+='<div class="rbox ract">'+(nq?'<button type="button" class="ract-b" data-act="prac"><b>'+nq+'</b> exam-style question'+(nq>1?'s':'')+' on this stop<span aria-hidden="true">→</span></button>':'')+
    (sp.length?sp.slice(0,4).map(function(q){return '<a class="ract-b spec" href="#specimen.'+q.id+'"><b>Specimen</b> '+esc(q.label)+' · '+q.m+' mark'+(q.m>1?'s':'')+'<span aria-hidden="true">→</span></a>'}).join(''):'')+
    '<button type="button" class="ract-b" data-act="fc">Flashcards for '+esc(pg.code)+'<span aria-hidden="true">→</span></button></div>';
  r.innerHTML=h;railCount(r);
}
function markRead(p,sid){if(!p||!sid||sid==='quiz')return;var a=READ[p]||(READ[p]=[]);if(a.indexOf(sid)<0){a.push(sid);lsSet('csRead',READ)}}
function initLine(art){
  var hd=art.querySelector('header'),sts=art.querySelector('.sts');if(!hd||!sts)return;
  var bg=(hd.getAttribute('style')||'').match(/background:\s*([^;]+)/),st=sts.querySelector('.st'),fg=st&&st.style.color;
  if(bg)sts.style.setProperty('--hb',bg[1].trim());
  if(fg)sts.style.setProperty('--fg',fg);
  if(!sts.querySelector('.trk-fill')){var f=document.createElement('div');f.className='trk-fill';f.setAttribute('aria-hidden','true');var t=sts.querySelector('.trk');sts.insertBefore(f,t?t.nextSibling:sts.firstChild)}
}
function lineFill(art){
  var sts=art&&art.querySelector('.sts'),f=sts&&sts.querySelector('.trk-fill'),c=sts&&sts.querySelector('.st.cur .dot');if(!f)return;
  if(!c){f.style.width='0';return}
  var r=sts.getBoundingClientRect(),d=c.getBoundingClientRect();f.style.width=Math.max(0,d.left+d.width/2-r.left)+'px';
  var w=art.querySelector('.stw');if(w&&w.scrollWidth>w.clientWidth){var x=d.left-r.left-w.clientWidth/2;w.scrollLeft=Math.max(0,x)}
}
/* whole-line layout: follow the reader down the page so the stepper and route sidebar stay in step */
var SPYT=0;window.addEventListener('scroll',function(){if(SPYT||MODE==='step'||CUR.v!=='page')return;SPYT=requestAnimationFrame(function(){SPYT=0;
  var art=$('view-page').querySelector('.pg');if(!art||!art.querySelector('.rail,.sts'))return;var v=visibleSecs(art),id=null;
  v.forEach(function(s){if(s.getBoundingClientRect().top<window.innerHeight*0.4)id=s.id});id=id||(v[0]&&v[0].id);
  if(id&&id!==CUR.s)showSec(art,id,false)})},{passive:true});
window.addEventListener('resize',function(){var a=$('view-page')&&$('view-page').querySelector('.pg');if(a)lineFill(a)});
function showSec(art,id,scroll){
  var v=visibleSecs(art);if(!v.length)return;
  var cur=v.filter(function(s){return s.id===id})[0]||v[0];
  if(art._cur&&art._cur!==cur.id)markRead(CUR.p,art._cur);art._cur=cur.id;
  CUR.s=cur.id;LASTSEC[CUR.p]=cur.id;lsSet('csLast',LASTSEC);lsSet('csLastRoute',{p:CUR.p,s:cur.id});
  art.querySelectorAll('.secs>section').forEach(function(s){s.classList.toggle('cur',s===cur)});
  var vis=[].filter.call(art.querySelectorAll('.st'),function(b){return b.offsetParent!==null}),ci=-1;
  vis.forEach(function(b,k){if(b.dataset.sec===cur.id)ci=k});
  art.querySelectorAll('.st').forEach(function(b){var on=b.dataset.sec===cur.id;b.classList.toggle('cur',on);b.classList.toggle('done',vis.indexOf(b)>-1&&vis.indexOf(b)<ci);b.setAttribute('aria-current',on?'step':'false')});
  lineFill(art);railSync(art,cur.id);
  var i=v.indexOf(cur),name=(art.querySelector('.st[data-sec="'+cur.id+'"] .stn')||{}).textContent||'';
  var lab=$('steplabel');if(lab)lab.textContent=MODE==='step'?'Stop '+(i+1)+' of '+v.length+' · '+name:v.length+' stops on this page';
  var pv=$('st-prev'),nx=$('st-next');
  if(pv){pv.hidden=i===0;pv.textContent=i>0?'← '+((art.querySelector('.st[data-sec="'+v[i-1].id+'"] .stn')||{}).textContent||'Back'):''}
  if(nx){nx.hidden=i===v.length-1;nx.textContent=i<v.length-1?'Next: '+((art.querySelector('.st[data-sec="'+v[i+1].id+'"] .stn')||{}).textContent||'')+' →':''}
  art.classList.toggle('last',i===v.length-1);
  if(scroll){
    var target=MODE==='step'?art.querySelector('.pgtools'):cur;
    if(target){var r=target.getBoundingClientRect();if(MODE!=='step'||r.top<0||r.top>window.innerHeight*0.6)target.scrollIntoView({block:'start'})}
  }
}
function openCards(p){
  var pg=PAGES[p];if(!window.csFc)return;
  var tops=CS.fc.topics.filter(function(t){return t.pg&&t.pg.indexOf(p)>-1}).map(function(t){return t.id});
  if(tops.length)window.csFc.openTopics(tops,'flash');
  nav('flashcards');
}
window.csOpenCards=openCards;

/* in-page links (#section) and term buttons */
document.addEventListener('click',function(e){
  var g=e.target.closest('button.gl');
  if(g){e.preventDefault();openTerm(g.dataset.t,g);return}
  var a=e.target.closest('a[href^="#"]');
  if(a&&CUR.v==='page'){
    var id=a.getAttribute('href').slice(1),art=$('view-page').querySelector('.pg');
    if(art&&art.querySelector('.secs>section[id="'+id+'"]')){e.preventDefault();showSec(art,id,true)}
  }
});

/* ---------- term sheet ---------- */
var SHEET={open:false,ret:null};
function topicName(g){var t=CS.fc.topics.filter(function(x){return x.id===g})[0];return t?t.name:''}
function openTerm(tid,from){
  var t=CS.terms[tid];if(!t)return;
  SHEET.ret=from||document.activeElement;
  var line=t.g.slice(0,2),q=t.q.replace(/\s*\[(\d+)\]\s*$/,''),mk=(t.q.match(/\[(\d+)\]\s*$/)||[])[1];
  var h='<div class="sh-top th-'+line+'"><span class="sh-code">'+esc(t.g)+' · '+esc(topicName(t.g))+(t.h?' <span class="hltag">HL</span>':'')+'</span><button type="button" class="sh-close" id="sh-close" aria-label="Close">✕</button></div>'+
    '<div class="th-'+line+'" style="display:flex;flex-direction:column;gap:14px"><h2 id="sheet-title">'+esc(t.t)+'</h2>'+(t.f?'<p class="full">'+esc(t.f)+'</p>':'')+
    '<div class="sh-def"><span class="lab">Exam definition · learn it word for word</span><p>'+esc(t.ib)+'</p></div>';
  if(t.fig&&tplOf('fig-'+t.fig))h+='<div class="sh-fig"><span class="lab">Picture it</span><div id="sh-figbox"></div></div>';
  if(t.q)h+='<div class="sh-prac"><b class="q">Full-mark practice: '+esc(q)+(mk?' <span class="mono" style="font-size:12px;color:var(--well-muted)">['+mk+']</span>':'')+'</b><details><summary>Show the marking points</summary><ul style="margin-top:8px">'+t.a.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul></details></div>';
  h+='<div class="sh-links">'+(t.p?'<a class="minibtn" href="#'+routeOf(t.p)+(t.s?'.'+t.s:'')+'">Open in the notes →</a>':'')+'<button type="button" class="minibtn" id="sh-fc">Flashcards for '+esc(t.g)+'</button></div></div>';
  $('sheet-in').innerHTML=h;
  if(t.fig){var fb=$('sh-figbox'),tp=tplOf('fig-'+t.fig);if(fb&&tp)fb.appendChild(tp.content.cloneNode(true))}
  $('sheet').hidden=false;$('sheet-scrim').hidden=false;SHEET.open=true;
  $('sh-close').onclick=function(){closeSheet()};
  $('sh-fc').onclick=function(){closeSheet(true);if(window.csFc)window.csFc.openTopics([t.g],'flash');nav('flashcards')};
  var link=$('sheet-in').querySelector('a.minibtn');if(link)link.addEventListener('click',function(e){e.preventDefault();closeSheet(true);findReq({t:tid,q:t.t,label:t.t});nav(link.getAttribute('href').slice(1))});
  $('sheet-in').scrollTop=0;$('sh-close').focus();
}
function closeSheet(silent){
  if(!SHEET.open)return;SHEET.open=false;$('sheet').hidden=true;$('sheet-scrim').hidden=true;
  if(!silent&&SHEET.ret&&SHEET.ret.focus){try{SHEET.ret.focus({preventScroll:true})}catch(e){}}
}
window.csOpenTerm=openTerm;
$('sheet-scrim').addEventListener('click',function(){closeSheet()});
$('sheet-in').addEventListener('click',function(e){var g=e.target.closest('button.gl');if(g){e.stopPropagation();openTerm(g.dataset.t)}},true);

/* ---------- glossary ---------- */
var GLOSS={ready:false,line:'all',q:'',lines:[]};
function renderGloss(){
  var el=$('view-glossary'),sl=isSL();
  if(!GLOSS.ready){
    el.innerHTML='<div class="vhead th-IA"><div class="vh-in"><div class="eyebrow">Look it up</div><h1>Glossary</h1><p>Every term in the notes with its exam definition. Tap a term for a picture, a full-mark practice question and a link back to the notes. Learn the definitions word for word: “define” questions reward the precise wording.</p></div></div>'+
      '<div class="vbody"><div class="gl-filters" id="gl-filters"><div class="gl-bar"><input type="search" id="gl-q" placeholder="Filter terms" aria-label="Filter terms" autocomplete="off"><span class="gl-count" id="gl-count"></span><button type="button" class="ftog" id="gl-ftog" aria-expanded="false" aria-controls="gl-chips">Units</button></div><div class="fsum" id="gl-fsum"></div><div class="fbody"><div class="chips" id="gl-chips" role="group" aria-label="Line"></div></div></div><div id="gl-body"></div></div>';
    $('gl-q').addEventListener('input',function(){GLOSS.q=this.value;drawGloss()});
    GLOSS.fopen=!!lsGet('csGlFOpen',false);
    $('gl-ftog').addEventListener('click',function(){GLOSS.fopen=!GLOSS.fopen;lsSet('csGlFOpen',GLOSS.fopen);drawGloss()});
    $('gl-fsum').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;if(b.dataset.a==='fclear')GLOSS.lines=[];else{GLOSS.fopen=true;lsSet('csGlFOpen',true)}drawGloss()});
    $('gl-chips').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;var l=b.dataset.l;
      if(l==='all')GLOSS.lines=[];else{var i=GLOSS.lines.indexOf(l);if(i>-1)GLOSS.lines.splice(i,1);else GLOSS.lines.push(l)}drawGloss()});
    $('gl-body').addEventListener('click',function(e){var a=e.target.closest('[data-gm]');
      if(a){if(window.csFc){window.csFc.openTopics([a.dataset.g],a.dataset.gm);nav('flashcards')}return}
      var b=e.target.closest('.gl-item');if(b)openTerm(b.dataset.t,b)});
    GLOSS.ready=true;
  }
  drawGloss();
}
function drawGloss(){
  var sl=isSL(),ql=GLOSS.q.trim().toLowerCase();
  var lines=[['all','All']].concat(CS.lines.filter(function(l){return !(sl&&l.pages.every(function(p){return p.hl}))}).map(function(l){return [l.id,l.id]})).concat([['CS','Case study'],['EX','Command terms']]);
  $('gl-chips').innerHTML=lines.map(function(l){return '<button type="button" class="chip'+(l[0]!=='all'?' th-'+l[0]:'')+'" data-l="'+l[0]+'" aria-pressed="'+(l[0]==='all'?!GLOSS.lines.length:GLOSS.lines.indexOf(l[0])>-1)+'">'+(l[0]!=='all'?'<i></i>':'')+l[1]+'</button>'}).join('');
  var ids=Object.keys(CS.terms).filter(function(k){var t=CS.terms[k];if(sl&&t.h)return false;if(GLOSS.lines.length&&GLOSS.lines.indexOf(t.g.slice(0,2))<0)return false;if(ql&&(t.t+' '+t.f+' '+(t.k||'')+' '+t.ib).toLowerCase().indexOf(ql)<0)return false;return true});
  var groups={};ids.forEach(function(k){var g=CS.terms[k].g;(groups[g]=groups[g]||[]).push(k)});
  var keys=Object.keys(groups).sort(function(a,b){return a.localeCompare(b,undefined,{numeric:true})});
  $('gl-count').textContent=ids.length+' term'+(ids.length===1?'':'s');
  var gn=GLOSS.lines.length,gf=$('gl-filters');gf.classList.toggle('open',!!GLOSS.fopen);
  $('gl-ftog').setAttribute('aria-expanded',String(!!GLOSS.fopen));$('gl-ftog').innerHTML='Units'+(gn?' <b class="fnum">'+gn+'</b>':'')+'<span class="fchev" aria-hidden="true">'+(GLOSS.fopen?'▴':'▾')+'</span>';
  var lname=function(l){return l==='CS'?'Case study':l==='EX'?'Command terms':l};
  $('gl-fsum').innerHTML=GLOSS.fopen?'':'<button type="button" class="fsum-t">'+esc(gn?GLOSS.lines.map(lname).join(' + '):'All units')+'</button>'+(gn?'<button type="button" class="fsum-x" data-a="fclear">Clear</button>':'');
  $('gl-body').innerHTML=keys.map(function(g){
    var items=groups[g].sort(function(a,b){return CS.terms[a].t.localeCompare(CS.terms[b].t)});
    var hasCards=CS.fc.topics.some(function(x){return x.id===g});
    return '<div class="gl-group th-'+g.slice(0,2)+'"><h3><span class="c">'+esc(g)+'</span>'+esc(topicName(g))+(hasCards?'<span class="gl-acts"><button type="button" class="minibtn" data-gm="learn" data-g="'+esc(g)+'">Learn these</button><button type="button" class="minibtn" data-gm="test" data-g="'+esc(g)+'">Test me</button></span>':'')+'</h3><div class="gl-list">'+items.map(function(k){var t=CS.terms[k];
      return '<button type="button" class="gl-item" data-t="'+k+'"><b>'+esc(t.t)+(t.f?' <small>'+esc(t.f)+'</small>':'')+(t.h?' <span class="hltag">HL</span>':'')+'</b><span>'+esc(t.ib)+'</span></button>'}).join('')+'</div></div>';
  }).join('')||'<p class="note">No terms match. Try fewer letters, or pick “All”.</p>';
}

/* ---------- resources ---------- */
var RES={ready:false};
function secs(t){var p=t.split(':').map(Number);return p.length===3?p[0]*3600+p[1]*60+p[2]:p[0]*60+p[1]}
function chapters(url,note){
  var out=[];String(note).split(' · ').forEach(function(part){var m=part.match(/^(.*?)\s+(\d{1,2}:\d{2}(?::\d{2})?)/);if(m)out.push([m[1],m[2]])});
  if(!out.length)return '';
  return '<div class="chap">'+out.map(function(c){return '<a href="'+esc(url)+'&t='+secs(c[1])+'s" target="_blank" rel="noopener"><b>'+esc(c[1])+'</b>'+esc(c[0])+'</a>'}).join('')+'</div>';
}
function renderRes(){
  if(RES.ready)return;RES.ready=true;
  var R=CS.res,h='<div class="vhead th-IA"><div class="vh-in"><div class="eyebrow">Go further</div><h1>Resources</h1><p>The videos, books, websites and practice tools used to check these notes. Video chapter links jump straight to the right minute. Everything opens in a new tab.</p></div></div><div class="vbody">';
  h+='<div class="res-sec"><h2>Video courses</h2><p>Topic lectures with chapter links that jump to the right minute. Most follow the 2027 syllabus; the ones marked “old syllabus” still teach the same ideas, so use the chapters that match your notes. Watch with the matching line open, and pause to do each example yourself. Every stop in the notes also has its own <b>Watch</b> box: a short video for that exact syllabus point (Mr. Rhed CS) and links that jump straight to the right minute of these lectures.</p><div class="res-grid">';
  R.videos.forEach(function(v){
    var line=v[0].slice(0,2),th=/^[AB][1-4]$/.test(line)?' th-'+line:' th-IA';
    h+='<div class="res'+th+(v[5]?' hl-only':'')+'"><div class="top"><span class="tp">'+esc(v[0])+'</span><span class="ch">'+esc(v[2])+'</span>'+(v[5]?'<span class="hltag">HL</span>':'')+'</div><a class="t" href="'+esc(v[3])+'" target="_blank" rel="noopener">'+esc(v[1])+'</a>'+(chapters(v[3],v[4])||'<p>'+esc(v[4])+'</p>')+'</div>';
  });
  h+='</div></div>';
  R.groups.forEach(function(g){
    h+='<div class="res-sec"><h2>'+esc(g[0])+'</h2><div class="res-grid">';
    g[1].forEach(function(r){
      h+='<div class="res th-IA'+(r[1]?'':' nolink')+'">'+(r[1]?'<a class="t" href="'+esc(r[1])+'" target="_blank" rel="noopener">'+esc(r[0])+'</a>':'<a class="t">'+esc(r[0])+'</a>')+'<p>'+esc(r[2])+'</p>'+(r[1]?'<span class="url">'+esc(r[1].replace(/^https?:\/\//,'').replace(/\/$/,''))+'</span>':'')+'</div>';
    });
    h+='</div></div>';
  });
  h+='<div class="res-sec"><h2>Using them well</h2><div class="howto"><div><b>Notes first, video second</b>Read the station here, then watch the video chapter. You will spot what you missed instead of passively watching.</div><div><b>Past-paper style</b>Use the “Test yourself” questions at the end of each line and the model answers: the 2027 papers are new, so older past papers only partly match.</div><div><b>Code every day</b>For Paper 2, trace and write code on paper, then check it in Python Tutor.</div></div></div>';
  $('view-resources').innerHTML=h+'</div>';
}

/* ---------- search ---------- */
var IDX=null;
/* text is normalised 1:1 (same length): lower case, every non-letter/digit becomes a space, so "text-to-image" = "text to image" */
function nrm(t){return String(t).toLowerCase().replace(/[^a-z0-9²³%#+]/g,' ')}
var STOP={};('a an the of to in on at by for with from and or is are was were be been it its this that these those what which who whom how why when where does do did can could should would will shall may might must vs versus between difference differences different compare compared comparing comparison contrast contrasting explain explaining describe outline define definition discuss evaluate evaluation identify state suggest justify distinguish role roles use uses used using about give giving example examples meaning mean means question answer marks mark one two three each other its their there them some any more most less than into within also why way ways type types kind kinds help helps happen happens work works').split(' ').forEach(function(w){STOP[w]=1});
function stem(w){if(w.length>5)w=w.replace(/(ations|ation|ings|ing|ions|ion|ments|ment|ness|ities|ity|ies|ied|ers|er|ed|es|ly|s)$/,'');else if(w.length>3)w=w.replace(/s$/,'');return w}
function txtOf(el){var w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),n,out=[];while((n=w.nextNode())){if(n.parentNode&&/^(SCRIPT|STYLE)$/.test(n.parentNode.nodeName))continue;out.push(n.nodeValue)}return out.join(' ').replace(/\s+/g,' ').replace(/ ([.,;:!?)’”])/g,'$1').replace(/([(‘“]) /g,'$1').trim()}
var HEADSEL='h3,p>b:first-child,div[style*="text-transform: uppercase"],tr:first-child>th:first-child';
function buildIdx(){
  if(IDX)return IDX;IDX=[];
  CS.index.forEach(function(e){
    var tpl=tplOf('pg-'+e.p),txt='',heads=[];
    if(tpl){var s=tpl.content.querySelector('section[id="'+e.s+'"]');if(s){txt=txtOf(s);
      var from=0;s.querySelectorAll(HEADSEL).forEach(function(h){var t=txtOf(h);if(t.length<4||t.length>90||/^(in short|what it means|exam angle|exam definition|the idea|think of it like|tip|trap|why it scores|model answer)\b/i.test(t))return;var at=txt.indexOf(t,from);if(at<0)at=txt.indexOf(t);if(at>-1){var clean=t.replace(/(Python|Java|Pseudocode)$/,'').replace(/[.:]$/,'');heads.push([at,clean,nrm(clean),h.tagName==='H3'||h.tagName==='DIV']);from=at+1}});
      heads.sort(function(a,b){return a[0]-b[0]})}}
    IDX.push({e:e,title:nrm(e.t||''),txt:txt,n:' '+nrm(txt)+' ',heads:heads,hn:nrm(heads.map(function(h){return h[1]}).join(' | '))});
  });
  if(!TPL_READY){var tmp=IDX;IDX=null;return tmp}
  return IDX;
}
function parseQ(q){
  var all=nrm(q).split(/\s+/).filter(Boolean),toks=[];
  all.forEach(function(w){if(!STOP[w]&&toks.indexOf(w)<0)toks.push(w)});
  if(!toks.length)toks=all.filter(function(w,i){return all.indexOf(w)===i});
  var grams=[];for(var n=Math.min(5,all.length);n>=2;n--)for(var i=0;i+n<=all.length;i++){var g=all.slice(i,i+n);if(g.some(function(w){return !STOP[w]})&&!STOP[g[0]]&&!STOP[g[n-1]])grams.push(g)}
  return {all:all,toks:toks,stems:toks.map(stem),grams:grams};
}
var INTENT={role:'role purpose function job',cmp:'difference differences different compare compared comparing comparison versus vs distinguish contrast or',risk:'risk risks danger dangers problem problems limitation limitations disadvantage disadvantages drawback drawbacks weakness weaknesses',value:'value valuable benefit benefits advantage advantages useful strengths strength'};
var INTENT_OF={};Object.keys(INTENT).forEach(function(k){INTENT[k].split(' ').forEach(function(w){INTENT_OF[w]=k})});
function intents(words){var o={};words.forEach(function(w){var k=INTENT_OF[w];if(k&&!(k==='cmp'&&w==='or'&&words.length>12))o[k]=1});return o}
function gramRx(g){return new RegExp(' '+g.map(function(w,i){return i===g.length-1?w.replace(/s$/,'')+'[a-z]*':w}).join(' +')+'(?![a-z0-9])')}
function cnt(hay,needle){var c=0,i=hay.indexOf(needle);while(i>-1&&c<6){c++;i=hay.indexOf(needle,i+needle.length)}return c}
function scoreSec(x,Q){
  var sc=0,hit=0;
  Q.stems.forEach(function(st){var k=' '+st,inT=(' '+x.title).indexOf(k)>-1,c=cnt(x.n,k);if(inT||c){hit++;sc+=(inT?6:0)+Math.min(4,c)+((' '+x.hn).indexOf(k)>-1?3:0)}});
  var need=Q.stems.length<=2?Q.stems.length:Math.ceil(Q.stems.length*0.6);
  if(!hit||hit<need)return null;
  var best=null,bestAt=-1;
  Q.grams.forEach(function(g){var m=gramRx(g).exec(x.n);if(m){sc+=3*(g.length-1);if(!best||g.length>best.length){best=g;bestAt=m.index}}});
  if(hit===Q.stems.length)sc+=4;
  var dense=null;
  if(!best){var pos=[];Q.stems.forEach(function(st,si){var i=x.n.indexOf(' '+st),c=0;while(i>-1&&c<40){pos.push([i,si]);c++;i=x.n.indexOf(' '+st,i+1)}});
    var bestN=0;pos.forEach(function(pp){var seen={};pos.forEach(function(qq){if(Math.abs(qq[0]-pp[0])<=160)seen[qq[1]]=1});var n=Object.keys(seen).length;if(n>bestN||(n===bestN&&pp[0]<bestAt)){bestN=n;bestAt=pp[0]}});
    dense=Q.stems.slice()}
  // prefer a sub-heading of the section that matches the question
  var hd=null,hdScore=0,qi=intents(Q.all);
  x.heads.forEach(function(h){var hn=' '+h[2]+' ',hs=0,wt=0,hg=0,lg=null;
    Q.stems.forEach(function(st){if(hn.indexOf(' '+st)>-1){hs++;wt+=0.5+2/Math.max(1,cnt(x.n,' '+st))}});
    Q.grams.forEach(function(g){if(gramRx(g).test(hn)){hg++;if(!lg||g.length>lg.length)lg=g}});
    var im=0,hi=intents(h[2].split(/\s+/));Object.keys(qi).forEach(function(k){if(hi[k])im++});
    var v=wt+2*hg+4*im;if(hs>=1&&(hg||hs>=2||im||Q.stems.length===1)&&v>hdScore){hdScore=v;hd=[h,lg]}});
  if(hd){sc+=2+hdScore;if(hd[1])return {sc:sc,phrase:hd[1].join(' '),at:hd[0][0],head:hd[0][1]};
    var inH=Q.stems.filter(function(st){return (' '+hd[0][2]+' ').indexOf(' '+st)>-1});return {sc:sc,phrase:(inH.length?inH:Q.stems).join('|'),at:hd[0][0],head:hd[0][1],multi:true}}
  if(dense)return {sc:sc,phrase:dense.join('|'),at:Math.max(0,bestAt),multi:true};
  return {sc:sc,phrase:best.join(' '),at:Math.max(0,bestAt)};
}
function openSearch(){$('search').hidden=false;var i=$('search-in');i.value='';drawSearch('');setTimeout(function(){i.focus()},20)}
function closeSearch(){$('search').hidden=true}
$('btn-search').addEventListener('click',openSearch);
$('search-close').addEventListener('click',closeSearch);
$('search').addEventListener('click',function(e){if(e.target===$('search'))closeSearch()});
$('search-in').addEventListener('input',function(){drawSearch(this.value)});
function hl(text,words){var t=esc(text);words.forEach(function(w){if(w.length<2)return;t=t.replace(new RegExp('(^|[^a-z0-9])('+w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'[a-z]*)','ig'),'$1<mark>$2</mark>')});return t}
function drawSearch(q){
  var box=$('search-res'),sl=isSL();q=q.trim();
  if(q.length<2){box.innerHTML='<div class="sr-none">Type a word, a phrase or a whole question. Try “cache”, “binary search”, “role of prompt engineering” or “text-to-image vs image-to-image”.</div>';return}
  var Q=parseQ(q),words=Q.stems;
  var terms=Object.keys(CS.terms).map(function(k){var t=CS.terms[k];if(sl&&t.h)return null;var tt=' '+nrm(t.t+' '+t.f+' '+(t.k||''))+' ',all=' '+nrm(t.t+' '+t.f+' '+(t.k||'')+' '+t.ib)+' ',hit=0,inTitle=0;
      Q.stems.forEach(function(st){if(all.indexOf(' '+st)>-1)hit++;if(tt.indexOf(' '+st)>-1)inTitle++});
      var need=Q.stems.length<=2?Q.stems.length:Math.ceil(Q.stems.length*0.6);if(hit<need||!inTitle)return null;
      return [inTitle*10+hit-(nrm(t.t).length/100),k]}).filter(Boolean).sort(function(a,b){return b[0]-a[0]}).slice(0,Q.stems.length>=3?3:6).map(function(x){return x[1]});
  var idx=buildIdx(),secs=[];
  idx.forEach(function(x){if(sl&&(x.e.h||(CS.meta[x.e.p]||{}).hl))return;var r=scoreSec(x,Q);if(r)secs.push([r.sc,x,r])});
  secs.sort(function(a,b){return b[0]-a[0]});secs=secs.slice(0,12);
  var h='';
  if(terms.length)h+='<div class="sr-h">Terms</div>'+terms.map(function(k){var t=CS.terms[k];return '<button type="button" class="sr-i th-'+t.g.slice(0,2)+'" data-t="'+k+'"><span class="k">'+esc(t.g)+(t.h?' · HL':'')+'</span><b>'+hl(t.t,words)+'</b><span>'+hl(t.ib,words)+'</span></button>'}).join('');
  if(secs.length)h+='<div class="sr-h">In the notes <small>opens the page and highlights it</small></div>'+secs.map(function(s){var x=s[1],r=s[2],i=r.at,snip=x.txt.slice(Math.max(0,i-60),i+150),sub='';
    if(r.head)sub=r.head;else x.heads.forEach(function(hd){if(hd[3]&&hd[0]<=i+1)sub=hd[1]});
    var m=CS.meta[x.e.p]||{};return '<button type="button" class="sr-i th-'+(m.line||'IA')+'" data-h="'+routeOf(x.e.p)+'.'+x.e.s+'" data-f="'+esc(r.phrase)+'" data-head="'+esc(r.head||'')+'"'+(r.multi?' data-multi="1"':'')+'><span class="k">'+esc((x.e.c||'')+' · '+(m.title||''))+(x.e.h?' · HL':'')+'</span><b>'+hl(x.e.t,words)+(sub?' <span class="sr-sub">› '+hl(sub,words)+'</span>':'')+'</b><span>'+(i>60?'… ':'')+hl(snip,words)+' …</span></button>'}).join('');
  box.innerHTML=h||'<div class="sr-none">Nothing found for “'+esc(q)+'”. Try fewer or different words, for example the key term on its own.'+(sl?' Some topics are HL only: switch to HL to search them too.':'')+'</div>';
}
$('search-res').addEventListener('click',function(e){var b=e.target.closest('.sr-i');if(!b)return;var q=$('search-in').value.trim();closeSearch();if(b.dataset.t)openTerm(b.dataset.t);else{findReq({q:b.dataset.f||q,label:q,stem:1,head:b.dataset.head||'',multi:!!b.dataset.multi});nav(b.dataset.h)}});
$('search-in').addEventListener('keydown',function(e){
  var items=[].slice.call($('search-res').querySelectorAll('.sr-i'));if(!items.length)return;
  var i=items.findIndex(function(x){return x.classList.contains('sel')});
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(i>-1)items[i].classList.remove('sel');i=e.key==='ArrowDown'?Math.min(items.length-1,i+1):Math.max(0,i-1);items[i].classList.add('sel');items[i].scrollIntoView({block:'nearest'})}
  if(e.key==='Enter'){e.preventDefault();(items[i>-1?i:0]).click()}
});
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){if(!$('search').hidden){closeSearch();return}if(SHEET.open){closeSheet();return}if(FIND.hits.length){clearFind();return}}
  var tag=(e.target.tagName||'').toLowerCase();if(tag==='input'||tag==='textarea'||tag==='select')return;
  if(e.key==='/'||((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k')){e.preventDefault();openSearch()}
});

/* ---------- start ---------- */
function tbh(){var t=$('topbar');if(t)ROOTEL.style.setProperty('--tbh',t.offsetHeight+'px')}
tbh();window.addEventListener('resize',tbh);
setTB(TB);
renderHome();
go(parse(location.hash),true);
loadTpl(0);
})();

(function(){
var BM=window.CS.fc, $=function(id){return document.getElementById(id)};
function esc(t){return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function isSL(){return document.body.getAttribute('data-level')==='sl'}
function lsGet(k,d){try{var v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
window.csEsc=esc;

/* ---------- topics & cards ---------- */
var TOP={};BM.topics.forEach(function(t){TOP[t.id]=t});
var CARDS=BM.cards;
CARDS.forEach(function(c){c.top=TOP[c.t]});
function visibleCards(){var sl=isSL();return CARDS.filter(function(c){return !(sl&&c.h)})}

/* ---------- progress (device + account sync) ---------- */
var P=lsGet('csFcProg',{cards:{},best:{}});
if(!P.cards)P.cards={};if(!P.best)P.best={};
function pc(id){return P.cards[id]||[0,0,0]}           // [level 0-3, starred 0/1, time]
function lvl(id){return pc(id)[0]}
function setLv(id,l){var e=pc(id).slice();e[0]=Math.max(0,Math.min(3,l));e[2]=Date.now();P.cards[id]=e;dirty()}
function star(id){return !!pc(id)[1]}
function toggleStar(id){var e=pc(id).slice();e[1]=e[1]?0:1;e[2]=Date.now();P.cards[id]=e;dirty()}
function setBest(k,v,lower){var b=P.best[k];if(b==null||(lower?v<b:v>b)){P.best[k]=v;dirty();return true}return false}
var Sync={ref:null,ok:false,busy:false,again:false,timer:null,started:false};
function dirty(){lsSet('csFcProg',P);if(Sync.ok){clearTimeout(Sync.timer);Sync.timer=setTimeout(pushSync,2500)}}
function mergeIn(r){
  if(!r||typeof r!=='object')return;
  var rc=r.cards||{};Object.keys(rc).forEach(function(id){var a=P.cards[id],b=rc[id];if(!Array.isArray(b))return;if(!a||(b[2]||0)>(a[2]||0))P.cards[id]=b});
  var rb=r.best||{};Object.keys(rb).forEach(function(k){if(P.best[k]==null)P.best[k]=rb[k];else if(/^match/.test(k))P.best[k]=Math.min(P.best[k],rb[k]);else P.best[k]=Math.max(P.best[k],rb[k])});
  lsSet('csFcProg',P);
}
function pushSync(){
  if(!Sync.ok||!Sync.ref)return;
  if(Sync.busy){Sync.again=true;return}
  Sync.busy=true;
  Sync.ref.set({v:1,cards:P.cards,best:P.best,updated:Date.now()}).then(function(){Sync.busy=false;if(Sync.again){Sync.again=false;pushSync()}},function(e){Sync.busy=false;if(e&&(e.code==='revoked'||e.code==='invalid_argument'||e.code==='not_granted')){Sync.ok=false;syncBadge()}});
}
function syncInit(){
  if(Sync.started)return;Sync.started=true;
  if(!window.claude||typeof window.claude.use!=='function')return;
  Promise.all([window.claude.use('db'),window.claude.use('user')]).then(function(r){
    var db=r[0],user=r[1];if(!db||!user||!user.id)return null;
    return user.id().then(function(uid){
      if(!uid)return null;
      Sync.ref=db.doc('data/users/'+uid+'/progress');
      return Sync.ref.get().then(function(s){if(s&&s.exists)mergeIn(s.data());Sync.ok=true;syncBadge();renderDeck();if(Object.keys(P.cards).length)pushSync()});
    });
  }).catch(function(){Sync.ok=false;syncBadge()});
}
function syncBadge(){var b=$('fcx-sync');if(!b)return;b.classList.toggle('on',Sync.ok);b.lastChild.textContent=Sync.ok?'Progress saved to your account':'Progress saved on this device'}

/* ---------- selection ---------- */
var S=lsGet('csFcSel',{unit:'all',topics:[],starred:false,hideM:false,mode:'flash'});
if(!S.topics)S.topics=[];
function saveSel(){lsSet('csFcSel',S)}
function selCards(opts){
  opts=opts||{};
  var vis=visibleCards(),set={};S.topics.forEach(function(t){set[t]=1});
  var all=!S.topics.length;
  return vis.filter(function(c){
    if(!all&&!set[c.t])return false;
    if(S.starred&&!star(c.i))return false;
    if(S.hideM&&!opts.keepMastered&&lvl(c.i)>=3)return false;
    return true;
  });
}
function mastery(list){var m=[0,0,0,0];list.forEach(function(c){m[lvl(c.i)]++});return m}
function mbar(m){var n=m[0]+m[1]+m[2]+m[3]||1;return '<div class="mbar" aria-hidden="true"><i class="m3" style="width:'+(m[3]/n*100)+'%"></i><i class="m2" style="width:'+(m[2]/n*100)+'%"></i><i class="m1" style="width:'+(m[1]/n*100)+'%"></i></div>'}
var LVN=['New','Learning','Familiar','Mastered'];

/* ---------- deck chooser ---------- */
var UNITS=[['all','All'],['A1','A1'],['A2','A2'],['A3','A3'],['A4','A4'],['B1','B1'],['B2','B2'],['B3','B3'],['B4','B4'],['X','Exam and case study']];
function renderDeck(){
  var root=$('fc-deck');if(!root)return;
  var vis=visibleCards(),sl=isSL();
  var tops=BM.topics.filter(function(t){return !(sl&&t.hl)&&(S.unit==='all'||String(t.u)===S.unit)});
  var sel0=selCards({keepMastered:true}),open=!!S.deckOpen;
  var dsum=(S.topics.length?sel0.length+' cards from '+S.topics.length+' topic'+(S.topics.length>1?'s':''):'All '+sel0.length+' cards')+(S.starred?' · starred only':'')+(S.hideM?' · skipping mastered':'');
  var h='<div class="deck-top"><h3>Choose cards</h3><button type="button" class="fsum-t deck-sum" id="fc-dsum">'+esc(dsum)+'</button><button type="button" class="ftog" id="fc-dtog" aria-expanded="'+open+'">'+(open?'Done':'Change')+'<span class="fchev" aria-hidden="true">'+(open?'▴':'▾')+'</span></button></div><div class="fbody"><div class="deck-units" role="group" aria-label="Unit">';
  UNITS.forEach(function(u){if(sl&&u[0]==='B4')return;h+='<button data-u="'+u[0]+'" class="'+(S.unit===u[0]?'on':'')+(u[0]!=='all'&&u[0]!=='X'?' th-'+u[0]:'')+'">'+(u[0]!=='all'&&u[0]!=='X'?'<i></i>':'')+u[1]+(u[0]==='B4'?' <span class="tagg hl">HL</span>':'')+'</button>'});
  h+='</div>';
  h+='<div class="deck-body">';
  if(S.unit==='all'){
    if(S.topics.length)h+='<div class="deck-sel"><span>Selected:</span>'+S.topics.map(function(id){var t=TOP[id];return t?'<button data-t="'+id+'" title="Remove">'+esc(t.n+' '+t.name)+' ×</button>':''}).join('')+'</div>';
    else h+='<p class="deck-hint">No topics picked, so every card in the course is in play. Pick a unit above to choose specific topics.</p>';
    tops=[];
  }
  h+='<div class="deck-topics">';
  tops.forEach(function(t){
    var cs=vis.filter(function(c){return c.t===t.id});if(!cs.length)return;
    var on=S.topics.indexOf(t.id)>-1,m=mastery(cs);
    h+='<button class="tp'+(on?' on':'')+'" data-t="'+t.id+'" aria-pressed="'+on+'"><span class="tpt"><span class="ck">'+(on?'✓':'')+'</span><span class="tpn">'+esc(t.n)+'</span><span>'+esc(t.name)+'</span>'+(t.hl?'<span class="tagg hl">HL</span>':'')+'<span class="tpc">'+cs.length+'</span></span>'+mbar(m)+'</button>';
  });
  h+='</div></div>';
  var sel=selCards({keepMastered:true}),m=mastery(sel);
  h+='<div class="deck-foot">'+(S.unit!=='all'?'<button class="minibtn" id="fc-all">Select every topic in this unit</button>':'')+(S.topics.length?'<button class="minibtn" id="fc-none">Clear selection</button>':'')+
     '<button class="minibtn" id="fc-p1">All Paper 1 topics</button><button class="minibtn" id="fc-p2">All Paper 2 topics</button>'+
     '<label><input type="checkbox" id="fc-star"'+(S.starred?' checked':'')+'> Starred only</label>'+
     '<label><input type="checkbox" id="fc-hidem"'+(S.hideM?' checked':'')+'> Skip mastered cards</label>'+
     '<span class="sum">'+(S.topics.length?sel.length+' cards from '+S.topics.length+' topic'+(S.topics.length>1?'s':''):'All '+sel.length+' cards')+'</span></div></div>';
  root.innerHTML=h;root.classList.toggle('open',open);
  // header stats
  var all=visibleCards(),ma=mastery(all);
  $('fcx-total').textContent=all.length;
  $('fcx-mast').textContent=ma[3];
  $('fcx-sel').textContent=sel.length;
  $('fcx-selm').textContent=sel.length?Math.round(m[3]/sel.length*100)+'%':'0%';
}
function deckClick(e){
  var b=e.target.closest('button,input');if(!b)return;
  if(b.dataset.u){S.unit=b.dataset.u;S.collapsed=false;saveSel();renderDeck();return}
  if(b.dataset.t){var i=S.topics.indexOf(b.dataset.t);if(i>-1)S.topics.splice(i,1);else S.topics.push(b.dataset.t);saveSel();renderDeck();resetMode();return}
  if(b.id==='fc-all'){var sl=isSL();BM.topics.forEach(function(t){if(!(sl&&t.hl)&&(S.unit==='all'||String(t.u)===S.unit)&&S.topics.indexOf(t.id)<0)S.topics.push(t.id)});saveSel();renderDeck();resetMode();return}
  if(b.id==='fc-none'){S.topics=[];saveSel();renderDeck();resetMode();return}
  if(b.id==='fc-p1'||b.id==='fc-p2'){var sl2=isSL(),p1=b.id==='fc-p1';S.topics=BM.topics.filter(function(t){var u=String(t.u);return !(sl2&&t.hl)&&(p1?(u.charAt(0)==='A'||t.id==='CS'):u.charAt(0)==='B')}).map(function(t){return t.id});S.unit='all';saveSel();renderDeck();resetMode();return}
  if(b.id==='fc-dtog'||b.id==='fc-dsum'){S.deckOpen=!S.deckOpen;saveSel();renderDeck();return}
  if(b.id==='fc-star'){S.starred=b.checked;saveSel();renderDeck();resetMode();return}
  if(b.id==='fc-hidem'){S.hideM=b.checked;saveSel();renderDeck();resetMode();return}
}

/* ---------- answer checking ---------- */
function norm(s){return String(s).toLowerCase().replace(/²/g,'2').replace(/&/g,' and ').replace(/[’']/g,'').replace(/\s\(.*?\)/g,' ').replace(/[^a-z0-9%+\-. ]/g,' ').replace(/\b(the|a|an)\b/g,' ').replace(/\s+/g,' ').trim()}
function lev(a,b){if(a===b)return 0;var m=a.length,n=b.length;if(!m)return n;if(!n)return m;var p=[],q;for(var j=0;j<=n;j++)p[j]=j;for(var i=1;i<=m;i++){q=[i];for(j=1;j<=n;j++)q[j]=Math.min(p[j]+1,q[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=q}return p[n]}
function grade(input,answers){
  var u=norm(input);if(!u)return 'no';
  var best=99,bl=1;
  for(var i=0;i<answers.length;i++){var a=norm(answers[i]);if(!a)continue;if(u===a)return 'ok';var d=lev(u,a);if(d<best){best=d;bl=a.length}}
  if(best<=Math.max(1,Math.floor(bl*0.15)))return 'near';
  return 'no';
}
window.csGrade=grade;

/* ---------- question builders ---------- */
function shape(v){v=String(v);return (v.length<=45?'s':'l')+(/^[−\-+$€]?\s?\d/.test(v)?'n':'t')}
function pool(c,field){
  // cards from a set ("Which sector?", "Which Ansoff strategy?") take their wrong options from the same set
  if(field==='b'&&c.o&&c.o.length){var g=shuffle(c.o.filter(function(x){return x!==c.b})).slice(0,3);if(g.length)return g}
  var sh=shape(c[field]),sl=isSL();
  var base=CARDS.filter(function(x){return x!==c&&x.k===c.k&&!(sl&&x.h)});
  var same=base.filter(function(x){return x.t===c.t}),unit=base.filter(function(x){return x.top.u===c.top.u&&x.t!==c.t});
  var out=[],seen={};seen[norm(c[field])]=1;
  function take(arr,strict){shuffle(arr).forEach(function(x){if(out.length>=3)return;if(strict&&shape(x[field])!==sh)return;var v=x[field],k=norm(v);if(!seen[k]){seen[k]=1;out.push(v)}})}
  take(same,true);take(unit,true);take(base,true);take(same,false);take(unit,false);take(base,false);
  return out;
}
// direction: for term cards ask definition -> pick term; for question/formula cards ask front -> pick back
function mcq(c,reverse){
  var askFront=c.k!=='d'||!!reverse;
  var prompt=askFront?c.f:c.b, ans=askFront?c.b:c.f, field=askFront?'b':'f';
  var opts=shuffle([ans].concat(pool(c,field)));
  return {type:'mc',c:c,prompt:prompt,big:askFront&&c.k!=='q',ask:askFront?(c.k==='f'?'Choose the formula':(c.k==='q'?'Choose the answer':'Choose the definition')):'Choose the matching term',opts:opts,ans:ans};
}
function wq(c){return {type:'w',c:c,prompt:c.k==='d'||c.k==='f'?c.b:c.f,ask:c.k==='d'?'Type the term':(c.k==='f'?'Name this formula':'Type the answer'),ans:c.ta}}
function tfq(c){
  var truth=Math.random()<0.5,shown=c.b;
  if(!truth){var p=pool(c,'b');if(p.length)shown=p[0];else truth=true}
  return {type:'tf',c:c,term:c.f,def:shown,truth:truth};
}

/* ---------- mode framework ---------- */
var MODES=[['flash','Flashcards','Flip and sort'],['learn','Learn','4 levels up to mastered'],['write','Write','Define or name terms'],['test','Test','Mixed, graded'],['match','Match','Race the clock'],['memory','Memory','Flip to find pairs'],['gravity','Gravity','Type before it lands'],['blitz','Blitz','60-second true/false'],['drill','Number drill','Paper 1 calculations']];
var M={};
function renderModes(){
  var r=$('fc-modes');if(!r)return;
  r.innerHTML=MODES.map(function(m){return '<button data-m="'+m[0]+'" class="'+(S.mode===m[0]?'on':'')+'"><b>'+m[1]+'</b><span>'+m[2]+'</span></button>'}).join('');
}
function setMode(m){S.mode=m;saveSel();renderModes();focus(true);resetMode();if(window.csStudyBar)window.csStudyBar()}
var FOCUS_NEXT=false;
/* focus mode: once a mode is chosen, only that mode shows until you leave with the arrow (or Esc) */
function focus(on){
  var v=$('view-flashcards'),bar=$('fc-focusbar');if(!v||!bar)return;
  v.classList.toggle('fc-focus',!!on);
  if(on){var mm=MODES.filter(function(x){return x[0]===S.mode})[0]||MODES[0],n=selCards({keepMastered:true}).length;
    bar.innerHTML='<button type="button" class="pill fb-back" id="fc-leave">← Back to Practice</button><b>'+esc(mm[1])+'</b><span>'+n+' card'+(n===1?'':'s')+(S.topics.length?' · '+S.topics.length+' topic'+(S.topics.length>1?'s':''):' · whole course')+'</span>';
    $('fc-leave').onclick=function(){focus(false)};
    var top=v.getBoundingClientRect().top+window.scrollY-((parseInt(getComputedStyle(document.documentElement).getPropertyValue('--tbh'))||0));if(window.scrollY>top)window.scrollTo(0,top);
  }else{bar.innerHTML='';var mo=$('fc-modes');if(mo)mo.scrollIntoView({block:'center'})}
}
function resetMode(){var st=$('fc-stage');if(!st)return;M={};keyH=null;var fn=MODEFN[S.mode]||MODEFN.flash;fn(st)}
var keyH=null;
document.addEventListener('keydown',function(e){
  var fv=$('view-flashcards');
  if(e.key==='Escape'&&fv&&fv.classList.contains('on')&&fv.classList.contains('fc-focus')&&!document.querySelector('.sheet:not([hidden]),.search:not([hidden])')){var tg=(e.target.tagName||'').toLowerCase();if(tg!=='input'&&tg!=='textarea'){e.preventDefault();focus(false);return}}
  if(!keyH)return;if(!fv||!fv.classList.contains('on'))return;
  var tag=(e.target.tagName||'').toLowerCase();
  if(tag==='input'||tag==='select'||tag==='textarea'){if(e.key==='Enter'&&keyH.enter){keyH.enter(e)}return}
  if(keyH[e.key]){e.preventDefault();keyH[e.key](e)}
});
function emptyMsg(st,extra){st.innerHTML='<div class="empty"><b>No cards to show</b>'+(extra||'Pick at least one topic above, or untick "Starred only" or "Skip mastered cards".')+'</div>'}
function head(title,right){return '<div class="st-head"><h3>'+title+'</h3><div class="rt">'+(right||'')+'</div></div>'}
function metaRow(c){return '<div class="qmeta"><span class="tpn">'+esc(c.top.n)+'</span><span>'+esc(c.top.name)+'</span>'+(c.h?'<span class="tagg hl">HL</span>':'')+'<span class="lvlpill lv'+lvl(c.i)+'">'+LVN[lvl(c.i)]+'</span></div>'}

function fxp(c,t){t=String(t==null?'':t);if(c&&c.sc&&t===c.f){var i=t.indexOf('? ');if(i>0)return '<span class="qx">'+esc(t.slice(0,i+1))+'</span><span class="qs">'+esc(t.slice(i+2))+'</span>'}return esc(t)}
/* ---------- FLASHCARDS ---------- */
function modeFlash(st){
  var list=selCards();if(!list.length)return emptyMsg(st);
  var opt=lsGet('csFcFlash',{shuffle:true,defFirst:false});
  M={list:opt.shuffle?shuffle(list):list,i:0,know:0,learn:[],flipped:false,opt:opt};
  drawFlash(st);
}
function drawFlash(st){
  st=st||$('fc-stage');
  if(M.i>=M.list.length){
    var h=head('Round complete')+'<div class="donepanel"><div class="big">'+M.know+' / '+M.list.length+'</div><p>cards you knew this round</p>';
    if(M.learn.length)h+='<div class="fl-ctrl"><button class="btn pri" id="fl-again">Study the '+M.learn.length+' still-learning card'+(M.learn.length>1?'s':'')+'</button><button class="btn" id="fl-restart">Restart all</button></div>';
    else h+='<div class="fl-ctrl"><button class="btn pri" id="fl-restart">Go again</button><button class="btn" id="fl-tolearn">Try Learn mode</button></div>';
    st.innerHTML=h+'</div>';keyH=null;
    st.onclick=function(e){var b=e.target.closest('button');if(!b)return;if(b.id==='fl-again'){M.list=shuffle(M.learn);M.i=0;M.know=0;M.learn=[];drawFlash()}else if(b.id==='fl-restart')modeFlash(st);else if(b.id==='fl-tolearn')setMode('learn')};
    return;
  }
  var c=M.list[M.i],front=M.opt.defFirst?c.b:c.f,back=M.opt.defFirst?c.f:c.b;
  var pct=M.i/M.list.length*100;
  var h=head('Flashcards','<label class="pnum" style="display:flex;gap:5px;align-items:center"><input type="checkbox" id="fl-shuf"'+(M.opt.shuffle?' checked':'')+'> Shuffle</label><label class="pnum" style="display:flex;gap:5px;align-items:center"><input type="checkbox" id="fl-def"'+(M.opt.defFirst?' checked':'')+'> Definition first</label>')+
    '<div style="display:flex;gap:10px;align-items:center;margin-bottom:12px"><div class="prog"><i style="width:'+pct+'%"></i></div><span class="pnum">'+(M.i+1)+' / '+M.list.length+'</span></div>'+
    '<div class="flip'+(M.flipped?' flipped':'')+'" id="fl-card" tabindex="0" role="button" aria-label="Flip card"><div class="flip-in">'+
    '<div class="face front"><div class="fmeta"><span>'+esc(c.top.n+' '+c.top.name)+'</span>'+(c.h?'<span class="tagg hl">HL</span>':'')+'<button class="star'+(star(c.i)?' on':'')+'" data-star="1" aria-label="Star this card">★</button></div><div class="ftxt">'+fxp(c,front)+'</div><div class="fhint">Tap or press Space to flip</div></div>'+
    '<div class="face back"><div class="fmeta"><span>'+(M.opt.defFirst?(c.k==='d'?'Term':'Question'):(c.k==='f'?'Formula':(c.k==='d'?'Definition':'Answer')))+'</span><span class="lvlpill lv'+lvl(c.i)+'">'+LVN[lvl(c.i)]+'</span></div><div class="ftxt">'+esc(back)+'</div>'+(c.x&&!M.opt.defFirst?'<div class="fwhy"><b>Why</b> '+esc(c.x)+'</div>':'')+'<div class="fhint">How did you do?</div></div>'+
    '</div></div>'+
    '<div class="fl-ctrl"><button class="btn bad" id="fl-no">Still learning<span class="kbd">←</span></button><button class="btn" id="fl-flip">Flip<span class="kbd">Space</span></button><button class="btn good" id="fl-yes">Know it<span class="kbd">→</span></button></div>'+
    '<div class="fl-ctrl" style="margin-top:6px"><button class="minibtn" id="fl-back"'+(M.i?'':' disabled')+'>Previous card</button></div>';
  st.innerHTML=h;
  function flip(){M.flipped=!M.flipped;var fc=$('fl-card');if(fc)fc.classList.toggle('flipped',M.flipped)}
  function answer(k){var cc=M.list[M.i];if(k){M.know++;if(lvl(cc.i)<2)setLv(cc.i,2)}else{M.learn.push(cc);setLv(cc.i,Math.min(lvl(cc.i),1)||1)}M.i++;M.flipped=false;drawFlash()}
  st.onclick=function(e){
    var b=e.target.closest('button,input');
    if(b&&b.dataset.star){e.stopPropagation();toggleStar(c.i);b.classList.toggle('on',star(c.i));return}
    if(b&&b.id==='fl-shuf'){M.opt.shuffle=b.checked;lsSet('csFcFlash',M.opt);return}
    if(b&&b.id==='fl-def'){M.opt.defFirst=b.checked;lsSet('csFcFlash',M.opt);M.flipped=false;drawFlash();return}
    if(b&&b.id==='fl-no')return answer(false);
    if(b&&b.id==='fl-yes')return answer(true);
    if(b&&b.id==='fl-back'){if(M.i){M.i--;M.flipped=false;drawFlash()}return}
    if((b&&b.id==='fl-flip')||e.target.closest('#fl-card'))flip();
  };
  keyH={' ':flip,'ArrowLeft':function(){answer(false)},'ArrowRight':function(){answer(true)},'ArrowUp':flip,'ArrowDown':flip};
}

/* ---------- LEARN (levels) ---------- */
function modeLearn(st){
  var list=selCards({keepMastered:true});if(!list.length)return emptyMsg(st);
  M={all:list,round:null,qi:0,correct:0,roundNo:0};
  nextRound(st);
}
function nextRound(st){
  st=st||$('fc-stage');
  var todo=M.all.filter(function(c){return lvl(c.i)<3});
  if(!todo.length){
    var m=mastery(M.all);
    st.innerHTML=head('Everything mastered')+'<div class="donepanel"><div class="big">'+M.all.length+'</div><h4>All cards in this selection are at Mastered</h4><p>Keep them fresh with Test or Blitz, or reset these cards to practise again.</p><div class="fl-ctrl"><button class="btn pri" id="ln-test">Take a test</button><button class="btn" id="ln-reset">Reset these cards to New</button></div></div>';
    keyH=null;
    st.onclick=function(e){var b=e.target.closest('button');if(!b)return;if(b.id==='ln-test')setMode('test');if(b.id==='ln-reset'){M.all.forEach(function(c){setLv(c.i,0)});renderDeck();modeLearn(st)}};
    return;
  }
  todo=shuffle(todo).sort(function(a,b){return lvl(a.i)-lvl(b.i)});
  M.round=todo.slice(0,7);M.qi=0;M.correct=0;M.roundNo++;M.queue=M.round.slice();
  askLearn();
}
function askLearn(){
  var st=$('fc-stage');
  if(!M.queue.length)return roundEnd();
  var c=M.queue[0],L=lvl(c.i);
  var q=(L>=2&&c.ta)?wq(c):mcq(c,L>=2&&c.k==='d');
  M.q=q;M.answered=false;
  var m=mastery(M.all),done=M.round.length-M.queue.length;
  var h=head('Learn · round '+M.roundNo,'<span class="pnum">'+m[3]+' of '+M.all.length+' mastered</span>')+
    '<div style="display:flex;gap:10px;align-items:center;margin-bottom:12px"><div class="prog"><i style="width:'+(done/M.round.length*100)+'%"></i></div><span class="pnum">'+done+' / '+M.round.length+'</span></div>'+
    '<div class="qbox">'+metaRow(c)+renderQ(q)+'<div id="ln-fb"></div></div>';
  st.innerHTML=h;
  bindQ(st,q,function(ok,res){
    var before=lvl(c.i);
    if(ok){setLv(c.i,before+1);M.correct++;M.queue.shift()}
    else{setLv(c.i,1);var cc=M.queue.shift();M.queue.splice(Math.min(M.queue.length,2),0,cc)}
    var fb=$('ln-fb'),after=lvl(c.i);
    var msg=ok?(res==='near'?'<div class="fb near"><b>Accepted, but check the spelling.</b><span class="ans">'+esc(q.ans[0]||q.ans)+'</span>':'<div class="fb ok"><b>Correct.</b> '+(after>before?'Level up: '+LVN[after]+'.':''))
       :'<div class="fb no"><b>Not quite.</b> The answer is:<span class="ans">'+esc(q.type==='w'?q.ans[0]:q.ans)+'</span>';
    if(c.x)msg+='<div class="fwhy"><b>Why</b> '+esc(c.x)+'</div>';
    var row='<div class="row"><button class="btn pri" id="ln-next">Continue<span class="kbd">Enter</span></button>'+(!ok&&q.type==='w'?'<button class="btn" id="ln-over">I was right</button>':'')+'</div></div>';
    fb.innerHTML=msg+row;
    var nb=$('ln-next');if(nb)nb.focus();
    fb.onclick=function(e){var b=e.target.closest('button');if(!b)return;if(b.id==='ln-next')askLearn();if(b.id==='ln-over'){setLv(c.i,before+1);M.correct++;var k=M.queue.indexOf(c);if(k>-1)M.queue.splice(k,1);askLearn()}};
    keyH={'Enter':askLearn,enter:function(e){e.preventDefault();askLearn()}};
    if(ok&&res==='ok'&&q.type==='mc')M.auto=setTimeout(function(){if(M.q===q)askLearn()},900);
  });
}
function roundEnd(){
  var st=$('fc-stage'),m=mastery(M.all);
  st.innerHTML=head('Round '+M.roundNo+' done')+'<div class="donepanel"><p>Your progress in this selection</p><div class="lvbars">'+
    LVN.map(function(n,i){return '<div><b>'+m[i]+'</b><span>'+n+'</span></div>'}).join('')+'</div>'+mbar(m)+
    '<div class="fl-ctrl"><button class="btn pri" id="ln-cont">Next round<span class="kbd">Enter</span></button></div></div>';
  renderDeck();
  st.onclick=function(e){var b=e.target.closest('button');if(b&&b.id==='ln-cont')nextRound()};
  keyH={'Enter':function(){nextRound()}};
}

/* shared question rendering for learn */
function renderQ(q){
  if(q.type==='mc'){
    return '<p class="qask">'+esc(q.ask)+'</p><div class="qprompt'+(q.big?' term':'')+'">'+fxp(q.c,q.prompt)+'</div><div class="opts">'+
      q.opts.map(function(o,i){return '<button class="opt" data-o="'+i+'"><span class="on">'+(i+1)+'</span><span>'+esc(o)+'</span></button>'}).join('')+'</div>';
  }
  return '<p class="qask">'+esc(q.ask)+'</p><div class="qprompt">'+fxp(q.c,q.prompt)+'</div><form class="typein" id="wq-form" autocomplete="off"><input id="wq-in" type="text" aria-label="Your answer" placeholder="Type your answer" autocapitalize="off" spellcheck="false"><button class="btn pri" type="submit">Check</button><button class="btn" type="button" id="wq-skip">Don\'t know</button></form>';
}
function bindQ(st,q,done){
  clearTimeout(M.auto);
  if(q.type==='mc'){
    function choose(i){if(M.answered)return;M.answered=true;var ok=q.opts[i]===q.ans;
      st.querySelectorAll('.opt').forEach(function(b,k){b.disabled=true;if(q.opts[k]===q.ans)b.classList.add('right');else if(k===i)b.classList.add('wrong')});
      done(ok,ok?'ok':'no')}
    st.querySelector('.opts').onclick=function(e){var b=e.target.closest('.opt');if(b)choose(+b.dataset.o)};
    keyH={'1':function(){choose(0)},'2':function(){choose(1)},'3':function(){choose(2)},'4':function(){choose(3)}};
  }else{
    var f=$('wq-form'),inp=$('wq-in');setTimeout(function(){inp&&inp.focus()},30);
    f.onsubmit=function(e){e.preventDefault();if(M.answered)return;if(!inp.value.trim())return;M.answered=true;inp.disabled=true;var r=grade(inp.value,q.ans);done(r!=='no',r)};
    $('wq-skip').onclick=function(){if(M.answered)return;M.answered=true;inp.disabled=true;done(false,'no')};
    keyH=null;
  }
}

/* ---------- WRITE: "Define it" (term → your definition, marked like an examiner) or "Name it" (definition → term) ---------- */
var SAMPLE=null;try{if(window.claude&&window.claude.use)window.claude.use('sample').then(function(s){SAMPLE=s||null}).catch(function(){})}catch(e){}
var WSTOP={};('a an the and or of to in on at by for with from as is are was were be been being it its this that these those which who whom whose what when where how than then so such into onto over under about after before between within without through during per each every any all some more most less least other another same own can could may might must will would should do does did done has have had not no only also very just but if their there them they he she his her you your we our us one two three usually often mainly often used use uses using made make makes making way ways part parts kind type types such e g eg ie etc both either neither while whereas instead rather around up down out off back still even well like based related called known something thing things given whether itself themselves').split(' ').forEach(function(w){WSTOP[w]=1});
function wstem(w){w=String(w).toLowerCase().replace(/[’']/g,'');if(w.length>5)w=w.replace(/(ations|ation|ings|ing|ments|ment|nesses|ness|ities|ity|ies|ied|ers|er|ed|es|ly|s)$/,'');else if(w.length>3)w=w.replace(/(es|s)$/,'');return w}
var WSYN={};[['computer','system','device','machine','hardware'],['data','information'],['program','software','application','app','code'],['store','save','hold','keep','storage'],['user','person','people','human'],['instruction','command','statement'],['process','processing','execute','run','perform','carry'],['fast','quick','speed','faster','quickly'],['send','transmit','transfer','transmission','pass'],['receive','get','obtain'],['error','mistake','fault','bug'],['identify','recognise','recognize','find','detect'],['unique','uniquely','distinct'],['value','number'],['increase','rise','grow','more','higher'],['decrease','reduce','fall','less','lower','fewer'],['connect','link','join','connection'],['network','internet','lan','wan'],['memory','ram'],['table','relation'],['record','row','tuple'],['field','attribute','column'],['function','method','procedure','subroutine'],['object','instance'],['model','algorithm'],['label','labelled','labeled','tag']].forEach(function(g,i){g.forEach(function(w){WSYN[wstem(w)]=i})});
function wcanon(s){return WSYN[s]!=null?'#'+WSYN[s]:s}
function wwords(t){return String(t).toLowerCase().replace(/[’']/g,'').match(/[a-z0-9%]+/g)||[]}
function wkeys(c){
  var term={};wwords(c.f.replace(/\(.*?\)/g,' ')).forEach(function(w){term[wstem(w)]=1});
  var out=[],seen={};
  wwords(c.b).forEach(function(w){if(WSTOP[w]||(w.length<3&&w!=='%'))return;var s=wstem(w);if(term[s]||seen[s])return;seen[s]=1;out.push(s)});
  return out;
}
function wscore(ans,c){
  var keys=wkeys(c),have={};wwords(ans).forEach(function(w){have[wcanon(wstem(w))]=1});
  var hit={},n=0;keys.forEach(function(k){if(have[wcanon(k)]){hit[k]=1;n++}});
  var words=wwords(ans).length,cov=keys.length?n/keys.length:0;
  var sug=words<3?0:cov>=0.6?2:cov>=0.3?1:0;
  return {keys:keys,hit:hit,n:n,cov:cov,sug:sug};
}
function wmark(c,r,mode){
  var keys={};r.keys.forEach(function(k){keys[k]=1});
  return String(c.b).split(/([A-Za-z0-9%’']+)/).map(function(p,i){
    if(i%2===0)return esc(p);var s=wstem(p);if(!keys[s])return esc(p);
    if(mode==='cloze')return '<span class="kw gap">'+esc(p.charAt(0))+'<span aria-hidden="true">'+Array(Math.max(2,p.length)).join('_')+'</span></span>';
    return '<span class="kw '+(r.hit[s]?'hit':'miss')+'">'+esc(p)+'</span>';
  }).join('');
}
function modeWrite(st){
  var o=lsGet('csFcWrite',{dir:'define',n:10});
  var all=selCards(),nd=all.filter(function(c){return c.k==='d'}).length,nn=all.filter(function(c){return c.ta}).length;
  function opt(v,t,d,n){return '<label class="wdir'+(o.dir===v?' on':'')+'"><input type="radio" name="wdir" value="'+v+'"'+(o.dir===v?' checked':'')+'><b>'+t+'</b><span>'+d+'</span><em>'+n+' cards in your selection</em></label>'}
  st.innerHTML=head('Write')+'<div class="wsetup"><div class="wdirs" role="radiogroup" aria-label="What do you want to write?">'+
    opt('define','Define it','You see a term and write its definition in your own words. Then you mark it the IB way: 2 for a full, clear definition, 1 for a partial one, 0 if the key idea is missing.',nd)+
    opt('name','Name it','You see a definition or a situation and type the term it describes. Small spelling slips are accepted.',nn)+
    '</div><fieldset class="wn"><legend>How many cards</legend>'+[10,20,40,0].map(function(n){return '<label><input type="radio" name="wn" value="'+n+'"'+(o.n===n?' checked':'')+'> '+(n||'All')+'</label>'}).join('')+'</fieldset>'+
    '<button class="btn pri" id="w-go">Start</button></div>';
  st.onchange=function(e){if(e.target.name==='wdir'){o.dir=e.target.value;st.querySelectorAll('.wdir').forEach(function(l){l.classList.toggle('on',l.querySelector('input').checked)})}if(e.target.name==='wn')o.n=+e.target.value;lsSet('csFcWrite',o)};
  st.onclick=function(e){if(!e.target.closest('#w-go'))return;
    var list=selCards().filter(function(c){return o.dir==='define'?c.k==='d':!!c.ta});
    if(!list.length)return emptyMsg(st,o.dir==='define'?'None of the selected topics have definition cards. Choose more topics.':'None of the selected cards have a short typed answer. Choose more topics.');
    list=shuffle(list);if(o.n)list=list.slice(0,o.n);
    st.onclick=null;st.onchange=null;
    M={dir:o.dir,list:list,i:0,score:0,marks:0,max:0,miss:[]};
    if(o.dir==='define')askDefine();else askWrite();
  };
  keyH={'Enter':function(){var b=$('w-go');if(b)b.click()}};
}
function wprog(){return '<div style="display:flex;gap:10px;align-items:center;margin-bottom:12px"><div class="prog"><i style="width:'+(M.i/M.list.length*100)+'%"></i></div><span class="pnum">'+(M.i+1)+' / '+M.list.length+'</span></div>'}
function askDefine(){
  var st=$('fc-stage');st.onclick=null;
  if(M.i>=M.list.length)return defineResults();
  var c=M.list[M.i];M.answered=false;M.ans='';
  st.innerHTML=head('Write · Define it','<span class="pnum">'+M.marks+' / '+M.max+' marks</span>')+wprog()+'<div class="qbox">'+metaRow(c)+
    '<p class="qask">Define this term</p><div class="qprompt term">'+esc(c.f)+'</div>'+
    '<form id="wd-form" class="wdef" autocomplete="off"><label class="sr" for="wd-in">Your definition of '+esc(c.f)+'</label><textarea id="wd-in" rows="3" placeholder="Write the definition in your own words…" spellcheck="true"></textarea>'+
    '<div class="wd-row"><button class="btn pri" type="submit">Check<span class="kbd">Ctrl Enter</span></button><button class="btn" type="button" id="wd-hint">Hint</button><button class="btn" type="button" id="wd-skip">Show the answer</button></div><div id="wd-hintbox" class="wd-hint" hidden></div></form>'+
    '<div id="wd-fb"></div></div>';
  var f=$('wd-form'),inp=$('wd-in');setTimeout(function(){inp&&inp.focus()},30);
  inp.addEventListener('input',function(){inp.style.height='auto';inp.style.height=Math.min(260,inp.scrollHeight+2)+'px'});
  function submit(){if(M.answered)return;M.answered=true;M.ans=inp.value.trim();inp.disabled=true;f.querySelectorAll('button').forEach(function(b){b.disabled=true});defineFeedback(c)}
  f.onsubmit=function(e){e.preventDefault();if(!inp.value.trim()){inp.focus();return}submit()};
  $('wd-skip').onclick=function(){inp.value='';submit()};
  $('wd-hint').onclick=function(){var r=wscore('',c),hb=$('wd-hintbox');hb.hidden=false;hb.innerHTML='<b>Hint:</b> the model answer with its key words blanked out. '+wmark(c,r,'cloze');inp.focus()};
  keyH={enter:function(e){if(e.ctrlKey||e.metaKey){e.preventDefault();if(inp.value.trim())submit()}}};
}
function defineFeedback(c){
  var r=wscore(M.ans,c),pct=Math.round(r.cov*100);M.r=r;
  var h='<div class="wfb"><div class="wfb-cols"><div class="wcol"><h5>Your answer</h5><p class="wyour">'+(M.ans?esc(M.ans):'<i>No answer</i>')+'</p></div>'+
    '<div class="wcol"><h5>Model answer</h5><p class="wmodel">'+wmark(c,r)+'</p></div></div>'+
    (r.keys.length?'<div class="wcov"><div class="wbar" role="img" aria-label="'+r.n+' of '+r.keys.length+' key words used"><i style="width:'+pct+'%"></i></div><span>You used <b>'+r.n+' of '+r.keys.length+'</b> key words. <span class="kw hit">used</span> <span class="kw miss">missing</span></span></div>':'')+
    '<p class="qask" style="margin-top:14px">Mark your answer like an examiner would</p><div class="wbtns">'+
    [[2,'Full, clear definition'],[1,'Partial: right idea, but vague or incomplete'],[0,'Wrong, or the key idea is missing']].map(function(m){return '<button class="mk mk'+m[0]+(r.sug===m[0]?' sug':'')+'" data-mk="'+m[0]+'"><b>'+m[0]+'</b><span>'+m[1]+'</span></button>'}).join('')+'</div>'+
    '<p class="wsug">Suggested from the key words: <b>'+r.sug+' / 2</b>. You decide: the key words are a guide, not the markscheme.</p>'+
    (SAMPLE&&M.ans?'<div class="wai"><button class="btn" id="wd-ask"><span aria-hidden="true">✦</span> Ask Claude to mark it</button><div id="wd-ai" aria-live="polite"></div></div>':'')+'</div>';
  var fb=$('wd-fb');fb.innerHTML=h;
  var sb=fb.querySelector('.mk.sug');if(sb)sb.focus({preventScroll:true});
  fb.scrollIntoView({behavior:'smooth',block:'nearest'});
  fb.onclick=function(e){var b=e.target.closest('button');if(!b)return;if(b.dataset.mk!=null){recordMark(c,+b.dataset.mk);return}if(b.id==='wd-ask')askClaude(c,b)};
  keyH={'0':function(){recordMark(c,0)},'1':function(){recordMark(c,1)},'2':function(){recordMark(c,2)}};
}
function askClaude(c,btn){
  var out=$('wd-ai');if(!SAMPLE||!out)return;btn.disabled=true;out.innerHTML='<span class="wai-wait">Claude is marking your answer…</span>';
  var prompt='You are an IB Diploma Computer Science examiner marking a "Define" question worth 2 marks.\n'+
    'Markscheme: award 2 for a full, clear definition that conveys knowledge and understanding similar or equal to the model answer; award 1 for a basic definition that conveys partial knowledge and understanding; award 0 if the key idea is wrong or missing. Do not penalise spelling or wording when the meaning is right, and do not reward copying the term itself.\n\n'+
    'Term: '+c.f+'\nModel answer: '+c.b+'\nStudent answer: '+M.ans.slice(0,1500)+'\n\n'+
    'Reply with only JSON: {"mark": 0, 1 or 2, "feedback": "one short sentence to the student saying what earned the mark or what exactly is missing"}';
  SAMPLE.json(prompt,{modelTier:'quick'}).then(function(res){
    var mk=res&&[0,1,2].indexOf(+res.mark)>-1?+res.mark:null;if(mk==null)throw {code:'invalid_json'};
    if(!$('wd-ai'))return;
    out.innerHTML='<div class="wai-res"><b>Claude: '+mk+' / 2.</b> '+esc(String(res.feedback||''))+' <button class="btn sm" data-mk="'+mk+'">Use this mark</button></div>';
  }).catch(function(e){
    var code=e&&e.code;if(!$('wd-ai'))return;
    if(code==='not_granted'){SAMPLE=null;out.innerHTML='<span class="wai-wait">Claude marking is switched off for this page. Mark it yourself above.</span>';return}
    out.innerHTML='<span class="wai-wait">'+(code==='rate_limited'?'Claude is busy right now. Mark it yourself above.':'Claude couldn\'t mark this one. Mark it yourself above.')+'</span>';
    btn.disabled=false;
  });
}
function recordMark(c,mk){
  if(M.marked===M.i)return;M.marked=M.i;
  M.max+=2;M.marks+=mk;
  var l=lvl(c.i);
  if(mk===2)setLv(c.i,Math.min(3,Math.max(2,l+1)));else if(mk===1)setLv(c.i,Math.max(1,Math.min(l,2)));else setLv(c.i,1);
  if(mk<2)M.miss.push({c:c,a:M.ans,mk:mk});
  M.i++;askDefine();
}
function defineResults(){
  var st=$('fc-stage'),pct=M.max?Math.round(M.marks/M.max*100):0;keyH=null;
  var h=head('Write: results')+'<div class="donepanel"><div class="big">'+M.marks+' / '+M.max+'</div><p>marks ('+pct+'%) across '+M.list.length+' definitions</p>';
  if(M.miss.length){
    h+='<div class="fl-ctrl"><button class="btn pri" id="wd-again">Redo the '+M.miss.length+' without full marks</button><button class="btn" id="wd-setup">Change settings</button></div>';
    h+='<div class="wmiss">'+M.miss.map(function(x){return '<div class="wm"><div class="wm-h"><b>'+esc(x.c.f)+'</b><span class="mkpill mk'+x.mk+'">'+x.mk+' / 2</span></div>'+(x.a?'<p class="wm-a"><span>You wrote</span>'+esc(x.a)+'</p>':'')+'<p class="wm-m"><span>Model answer</span>'+esc(x.c.b)+'</p></div>'}).join('')+'</div>';
  }else h+='<div class="fl-ctrl"><button class="btn pri" id="wd-setup">Go again</button></div>';
  st.innerHTML=h+'</div>';
  st.onclick=function(e){var b=e.target.closest('button');if(!b)return;
    if(b.id==='wd-again'){M.list=shuffle(M.miss.map(function(x){return x.c}));M.i=0;M.marks=0;M.max=0;M.miss=[];M.marked=-1;askDefine()}
    if(b.id==='wd-setup'){st.onclick=null;modeWrite(st)}};
}
function askWrite(){
  var st=$('fc-stage');
  if(M.i>=M.list.length){
    var pct=Math.round(M.score/M.list.length*100);
    var h=head('Write: results')+'<div class="donepanel"><div class="big">'+pct+'%</div><p>'+M.score+' of '+M.list.length+' correct</p>';
    if(M.miss.length){h+='<div class="fl-ctrl"><button class="btn pri" id="wr-again">Retype the '+M.miss.length+' you missed</button><button class="btn" id="wr-all">Change settings</button></div><div class="misslist">'+M.miss.map(function(c){return '<div><b>'+esc(c.ta[0])+'</b> · '+esc(c.k==='q'?c.f:c.b)+'</div>'}).join('')+'</div>'}
    else h+='<div class="fl-ctrl"><button class="btn pri" id="wr-all">Go again</button></div>';
    st.innerHTML=h+'</div>';keyH=null;
    st.onclick=function(e){var b=e.target.closest('button');if(!b)return;if(b.id==='wr-again'){M.list=shuffle(M.miss);M.i=0;M.score=0;M.miss=[];askWrite()}if(b.id==='wr-all'){st.onclick=null;modeWrite(st)}};
    return;
  }
  st.onclick=null;
  var c=M.list[M.i],q=wq(c);M.q=q;M.answered=false;
  st.innerHTML=head('Write · Name it','<span class="pnum">Score '+M.score+'</span>')+wprog()+'<div class="qbox">'+metaRow(c)+renderQ(q)+'<div id="wr-fb"></div></div>';
  bindQ(st,q,function(ok,res){
    if(ok){M.score++;setLv(c.i,Math.max(lvl(c.i),3))}else{M.miss.push(c);setLv(c.i,1)}
    var fb=$('wr-fb');
    fb.innerHTML=(ok?'<div class="fb '+(res==='near'?'near':'ok')+'"><b>'+(res==='near'?'Accepted, check the spelling:':'Correct.')+'</b>'+(res==='near'?'<span class="ans">'+esc(q.ans[0])+'</span>':'')
      :'<div class="fb no"><b>The answer is:</b><span class="ans">'+esc(q.ans[0])+'</span>')+'<div class="row"><button class="btn pri" id="wr-next">Next<span class="kbd">Enter</span></button>'+(!ok?'<button class="btn" id="wr-over">I was right</button>':'')+'</div></div>';
    $('wr-next').focus();
    fb.onclick=function(e){var b=e.target.closest('button');if(!b)return;if(b.id==='wr-over'){M.score++;M.miss.pop();setLv(c.i,3)}M.i++;askWrite()};
    keyH={'Enter':function(){M.i++;askWrite()},enter:function(e){e.preventDefault();M.i++;askWrite()}};
  });
}

/* ---------- TEST ---------- */
function modeTest(st){
  var list=selCards({keepMastered:true});if(!list.length)return emptyMsg(st);
  var o=lsGet('csFcTest',{n:20,mc:true,tf:true,w:true,mt:true});
  M={list:list,o:o};
  var max=list.length;
  st.innerHTML=head('Test: set up')+'<div class="tsetup"><fieldset><legend>Questions</legend>'+[10,20,30,50].map(function(n){return '<label><input type="radio" name="tn" value="'+n+'"'+(o.n===n?' checked':'')+'> '+n+'</label>'}).join('')+'<span class="pnum">('+max+' cards available)</span></fieldset>'+
    '<fieldset><legend>Question types</legend><label><input type="checkbox" id="t-mc"'+(o.mc?' checked':'')+'> Multiple choice</label><label><input type="checkbox" id="t-tf"'+(o.tf?' checked':'')+'> True / false</label><label><input type="checkbox" id="t-w"'+(o.w?' checked':'')+'> Written</label><label><input type="checkbox" id="t-mt"'+(o.mt?' checked':'')+'> Matching</label></fieldset>'+
    '<div><button class="btn pri" id="t-go">Start test</button></div></div>';
  keyH=null;
  st.onclick=function(e){var b=e.target.closest('button');if(!b||b.id!=='t-go')return;
    var n=+((st.querySelector('input[name=tn]:checked')||{}).value||20);
    o={n:n,mc:$('t-mc').checked,tf:$('t-tf').checked,w:$('t-w').checked,mt:$('t-mt').checked};
    if(!o.mc&&!o.tf&&!o.w&&!o.mt)o.mc=true;lsSet('csFcTest',o);buildTest(o)};
}
function buildTest(o){
  var st=$('fc-stage'),cards=shuffle(M.list).slice(0,Math.min(o.n,M.list.length));
  var types=[];if(o.mc)types.push('mc');if(o.tf)types.push('tf');if(o.w)types.push('w');
  var qs=[],matchSet=[];
  if(o.mt&&cards.length>=8){matchSet=cards.splice(0,Math.min(5,Math.max(4,Math.round(cards.length*0.2))))}
  else if(o.mt&&!types.length){types.push('mc')}
  cards.forEach(function(c,i){
    var t=types[i%types.length];
    if(t==='w'&&!c.ta)t=types.indexOf('mc')>-1?'mc':(types.indexOf('tf')>-1?'tf':'mc');
    qs.push(t==='mc'?mcq(c):t==='tf'?tfq(c):wq(c));
  });
  qs=shuffle(qs);M.qs=qs;M.matchSet=matchSet;
  var h=head('Test','<span class="pnum">'+(qs.length+matchSet.length)+' questions</span>');
  qs.forEach(function(q,n){
    h+='<div class="tq" id="tq'+n+'"><div class="qn">'+(n+1)+' · '+esc(q.c.top.n)+(q.type==='tf'?' · True or false':q.type==='w'?' · Written':' · Multiple choice')+'</div>';
    if(q.type==='mc')h+='<div class="qprompt'+(q.big?' term':'')+'">'+fxp(q.c,q.prompt)+'</div><div class="opts">'+q.opts.map(function(op,i){return '<button class="opt" data-q="'+n+'" data-o="'+i+'"><span class="on">'+'ABCD'[i]+'</span><span>'+esc(op)+'</span></button>'}).join('')+'</div>';
    else if(q.type==='tf')h+='<div class="qprompt"><b>'+esc(q.term)+'</b><br>'+esc(q.def)+'</div><div class="tfrow"><button class="opt" data-q="'+n+'" data-tf="1">True</button><button class="opt" data-q="'+n+'" data-tf="0">False</button></div>';
    else h+='<div class="qprompt">'+fxp(q.c,q.prompt)+'</div><div class="typein"><input type="text" id="tw'+n+'" aria-label="Answer to question '+(n+1)+'" placeholder="Type the '+(q.c.k==='d'?'term':'answer')+'" autocomplete="off" autocapitalize="off" spellcheck="false"></div>';
    h+='</div>';
  });
  if(matchSet.length){
    var terms=shuffle(matchSet.map(function(c){return c.f}));
    h+='<div class="tq" id="tqm"><div class="qn">Matching · choose the term for each description</div><div class="mtable">'+matchSet.map(function(c,i){return '<div class="mrow" id="mr'+i+'"><span>'+esc(c.b)+'</span><select id="ms'+i+'" aria-label="Term for description '+(i+1)+'"><option value="">Choose…</option>'+terms.map(function(t){return '<option>'+esc(t)+'</option>'}).join('')+'</select></div>'}).join('')+'</div></div>';
  }
  h+='<div class="fl-ctrl"><button class="btn pri" id="t-submit">Submit test</button></div>';
  st.innerHTML=h;M.ans={};
  st.onclick=function(e){
    var b=e.target.closest('button');if(!b)return;
    if(b.id==='t-submit')return gradeTest();
    if(b.id==='t-retake')return buildTest(M.o||o);
    if(b.id==='t-setup')return modeTest(st);
    if(b.id==='t-missed'){S.mode='learn';saveSel();renderModes();var miss=M.missed||[];M={};var stg=$('fc-stage');M={all:miss,round:null,roundNo:0};miss.forEach(function(c){if(lvl(c.i)>=3)setLv(c.i,1)});nextRound(stg);return}
    if(b.dataset.q==null||M.graded)return;
    var n=+b.dataset.q;
    st.querySelectorAll('#tq'+n+' .opt').forEach(function(x){x.classList.remove('sel')});b.classList.add('sel');
    M.ans[n]=b.dataset.o!=null?+b.dataset.o:(b.dataset.tf==='1');
  };
  M.o=o;keyH=null;st.scrollIntoView({block:'start',behavior:'smooth'});
}
function gradeTest(){
  var st=$('fc-stage'),score=0,total=M.qs.length,missed=[];
  M.graded=true;
  M.qs.forEach(function(q,n){
    var box=$('tq'+n),ok=false,correctTxt='';
    if(q.type==='mc'){ok=M.ans[n]!=null&&q.opts[M.ans[n]]===q.ans;correctTxt=q.ans;
      box.querySelectorAll('.opt').forEach(function(b,k){b.disabled=true;if(q.opts[k]===q.ans)b.classList.add('right');else if(k===M.ans[n])b.classList.add('wrong')})}
    else if(q.type==='tf'){ok=M.ans[n]!=null&&M.ans[n]===q.truth;correctTxt=q.truth?'True':'False. The correct description is: '+q.c.b;
      box.querySelectorAll('.opt').forEach(function(b){b.disabled=true;var v=b.dataset.tf==='1';if(v===q.truth)b.classList.add('right');else if(M.ans[n]===v)b.classList.add('wrong')})}
    else{var inp=$('tw'+n);inp.disabled=true;var r=grade(inp.value,q.ans);ok=r!=='no';correctTxt=q.ans[0]}
    if(ok){score++;if(lvl(q.c.i)<2)setLv(q.c.i,2)}else{missed.push(q.c);setLv(q.c.i,1)}
    box.classList.add(ok?'res-ok':'res-no');
    if(!ok)box.insertAdjacentHTML('beforeend','<div class="fb no" style="margin-top:8px"><b>Correct answer:</b> '+esc(correctTxt)+(q.c.x?'<div class="fwhy"><b>Why</b> '+esc(q.c.x)+'</div>':'')+'</div>');
  });
  M.matchSet.forEach(function(c,i){total++;var s=$('ms'+i),ok=s.value===c.f;s.disabled=true;if(ok)score++;else{missed.push(c);$('mr'+i).insertAdjacentHTML('beforeend','<span class="fb no" style="margin:0;padding:6px 10px;grid-column:1/-1">'+esc(c.f)+'</span>')}$('mr'+i).classList.add(ok?'ok':'no')});
  M.missed=missed;
  var pct=Math.round(score/total*100);
  var sub=$('t-submit').parentNode;
  sub.outerHTML='<div class="donepanel" style="border-top:1px solid var(--bd);margin-top:10px;padding-top:16px"><div class="big">'+pct+'%</div><p>'+score+' of '+total+' correct'+(pct>=85?'. Excellent.':pct>=60?'. Good, keep going.':'. Worth another round in Learn.')+'</p><div class="fl-ctrl">'+(missed.length?'<button class="btn pri" id="t-missed">Learn the '+missed.length+' you missed</button>':'')+'<button class="btn" id="t-retake">New test, same settings</button><button class="btn" id="t-setup">Change settings</button></div></div>';
  var top=st.querySelector('.st-head');if(top)top.insertAdjacentHTML('afterend','<div class="fb '+(pct>=60?'ok':'no')+'" style="margin:0 0 10px"><b>Score: '+pct+'% ('+score+' / '+total+').</b> Scroll down to see the corrections.</div>');
  setBest('test',pct);renderDeck();
}

/* ---------- MATCH ---------- */
function modeMatch(st){
  var list=selCards({keepMastered:true}).filter(function(c){return c.k!=='q'&&c.b.length<=110});
  if(list.length<4)return emptyMsg(st,'Match needs at least four cards with short definitions. Choose more topics.');
  var key='match:'+(S.topics.slice().sort().join(',')||'all');
  var best=P.best[key];
  st.innerHTML=head('Match','<span class="pnum">Best time: '+(best!=null?best.toFixed(1)+' s':'none yet')+'</span>')+'<div class="donepanel"><h4>Match each term to its definition</h4><p>Tap a term, then its definition. Wrong pairs add one second.</p><div class="fl-ctrl"><button class="btn pri" id="mg-go">Start game</button></div></div>';
  keyH={'Enter':function(){startMatch(list,key)}};
  st.onclick=function(e){var b=e.target.closest('button');if(b&&b.id==='mg-go')startMatch(list,key)};
}
function startMatch(list,key){
  var st=$('fc-stage'),n=Math.min(6,list.length),cs=shuffle(list).slice(0,n);
  var tiles=[];cs.forEach(function(c,i){tiles.push({p:i,txt:c.f,term:1});tiles.push({p:i,txt:c.b,term:0})});
  tiles=shuffle(tiles);
  M={key:key,t0:performance.now(),pen:0,left:n,sel:null,timer:null,cs:cs};
  st.innerHTML=head('Match','<span class="timer" id="mg-t">0.0</span>')+'<div class="mgrid">'+tiles.map(function(t,i){return '<button class="tile'+(t.term?' term':'')+'" data-p="'+t.p+'" data-i="'+i+'">'+esc(t.txt)+'</button>'}).join('')+'</div>';
  st.scrollIntoView({block:'start',behavior:'smooth'});
  M.timer=setInterval(function(){var el=$('mg-t');if(!el){clearInterval(M.timer);return}el.textContent=((performance.now()-M.t0)/1000+M.pen).toFixed(1)},100);
  keyH=null;
  st.onclick=function(e){
    var b=e.target.closest('.tile');if(!b||b.classList.contains('gone'))return;
    if(!M.sel){M.sel=b;b.classList.add('sel');return}
    if(M.sel===b){b.classList.remove('sel');M.sel=null;return}
    var a=M.sel;M.sel=null;a.classList.remove('sel');
    if(a.dataset.p===b.dataset.p&&a.classList.contains('term')!==b.classList.contains('term')){
      a.classList.add('gone');b.classList.add('gone');M.left--;
      if(!M.left){clearInterval(M.timer);var t=(performance.now()-M.t0)/1000+M.pen;var rec=setBest(M.key,Math.round(t*10)/10,true);
        M.cs.forEach(function(c){if(lvl(c.i)<1)setLv(c.i,1)});
        setTimeout(function(){st.innerHTML=head('Match')+'<div class="donepanel"><div class="big">'+t.toFixed(1)+' s</div><h4>'+(rec?'New best time':'Best: '+P.best[M.key].toFixed(1)+' s')+'</h4><div class="fl-ctrl"><button class="btn pri" id="mg-again">Play again<span class="kbd">Enter</span></button></div></div>';keyH={'Enter':function(){startMatch(list,key)}};st.onclick=function(ev){var bb=ev.target.closest('button');if(bb&&bb.id==='mg-again')startMatch(list,key)}},350)}
    }else{
      M.pen+=1;a.classList.add('bad');b.classList.add('bad');setTimeout(function(){a.classList.remove('bad');b.classList.remove('bad')},350);
    }
  };
}

/* ---------- BLITZ ---------- */
function modeBlitz(st){
  var list=selCards({keepMastered:true});if(list.length<4)return emptyMsg(st,'Blitz needs at least four cards. Choose more topics.');
  var best=P.best.blitz;
  st.innerHTML=head('Blitz','<span class="pnum">Best score: '+(best!=null?best:'none yet')+'</span>')+'<div class="donepanel"><h4>60 seconds of true or false</h4><p>Does the description match the term? Streaks of 5 double your points; streaks of 10 triple them.</p><p class="pnum">Keys: ← false · → true</p><div class="fl-ctrl"><button class="btn pri" id="bz-go">Start<span class="kbd">Enter</span></button></div></div>';
  keyH={'Enter':function(){startBlitz(list)}};
  st.onclick=function(e){var b=e.target.closest('button');if(b&&b.id==='bz-go')startBlitz(list)};
}
function startBlitz(list){
  var st=$('fc-stage');
  M={list:list,score:0,streak:0,bestStreak:0,n:0,ok:0,miss:[],end:performance.now()+60000,q:null,timer:null};
  function next(){M.q=tfq(pick(M.list));draw()}
  function mult(){return M.streak>=10?3:M.streak>=5?2:1}
  function draw(){
    var left=Math.max(0,(M.end-performance.now())/1000);
    st.innerHTML=head('Blitz')+'<div class="blitz-card" id="bz-card"><div class="blitz-hud"><span><b id="bz-time">'+left.toFixed(0)+'</b>seconds</span><span><b>'+M.score+'</b>score</span><span><b>×'+mult()+'</b>streak '+M.streak+'</span></div>'+
      '<div class="blitz-term">'+esc(M.q.term)+'</div><div class="blitz-def">'+esc(M.q.def)+'</div><div class="blitz-btns"><button class="btn bad" id="bz-f">False<span class="kbd">←</span></button><button class="btn good" id="bz-t">True<span class="kbd">→</span></button></div></div>';
  }
  function answer(v){
    if(!M.q)return;var ok=v===M.q.truth;M.n++;
    if(ok){M.ok++;M.streak++;M.bestStreak=Math.max(M.bestStreak,M.streak);M.score+=mult()}else{M.streak=0;M.miss.push(M.q)}
    var card=$('bz-card');next();var c2=$('bz-card');if(c2)c2.classList.add(ok?'flash-ok':'flash-no');
  }
  function finish(){clearInterval(M.timer);M.q=null;keyH=null;var rec=setBest('blitz',M.score);
    var h=head('Blitz: time up')+'<div class="donepanel"><div class="big">'+M.score+'</div><h4>'+(rec?'New best score':'Best: '+P.best.blitz)+'</h4><p>'+M.ok+' of '+M.n+' right · longest streak '+M.bestStreak+'</p><div class="fl-ctrl"><button class="btn pri" id="bz-again">Play again<span class="kbd">Enter</span></button></div>';
    var seen={},ms=M.miss.filter(function(q){if(seen[q.c.i])return false;seen[q.c.i]=1;return true}).slice(0,10);
    if(ms.length)h+='<div class="misslist"><p class="qask" style="margin:0">Cards to review</p>'+ms.map(function(q){return '<div><b>'+esc(q.c.f)+'</b> · '+esc(q.c.b)+'</div>'}).join('')+'</div>';
    st.innerHTML=h+'</div>';
    st.onclick=function(e){var b=e.target.closest('button');if(b&&b.id==='bz-again')startBlitz(list)};
    keyH={'Enter':function(){startBlitz(list)}};
  }
  next();st.scrollIntoView({block:'start',behavior:'smooth'});
  st.onclick=function(e){var b=e.target.closest('button');if(!b)return;if(b.id==='bz-t')answer(true);if(b.id==='bz-f')answer(false)};
  keyH={'ArrowRight':function(){answer(true)},'ArrowLeft':function(){answer(false)},'t':function(){answer(true)},'f':function(){answer(false)}};
  M.timer=setInterval(function(){var el=$('bz-time');var left=(M.end-performance.now())/1000;if(left<=0)return finish();if(el)el.textContent=left.toFixed(0)},200);
}

/* ---------- GRAVITY (type the answer before it lands; levels speed up) ---------- */
function gvPrompt(c){return c.k==='q'?c.f:c.b}
function gvHearts(n){var h='';for(var i=0;i<3;i++)h+='<i class="'+(i<n?'on':'')+'" aria-hidden="true">♥</i>';return h+'<span class="sr">'+n+' lives</span>'}
function modeGravity(st){
  var list=selCards({keepMastered:true}).filter(function(c){return c.ta&&c.ta.length&&gvPrompt(c).length<=170});
  if(list.length<4)return emptyMsg(st,'Gravity needs at least four cards with a short typed answer. Choose more topics.');
  var best=P.best.gravity;
  st.innerHTML=head('Gravity','<span class="pnum">Best score: '+(best!=null?best:'none yet')+'</span>')+
    '<div class="donepanel"><h4>Type the answer before it lands</h4><p>A definition or question falls from the top. Type the term and press Enter before it hits the ground. Every 6 right answers takes you up a level, and cards fall faster. A card that lands costs one of your three lives, and you retype its answer before carrying on.</p>'+
    '<div class="gv-lv"><span class="pnum">Start at</span>'+[[1,'Level 1 · calm'],[4,'Level 4 · quick'],[7,'Level 7 · frantic']].map(function(x,i){return '<button class="btn'+(i?'':' pri')+'" data-gl="'+x[0]+'">'+x[1]+'</button>'}).join('')+'</div>'+
    '<p class="pnum">'+list.length+' cards in play</p></div>';
  keyH={'Enter':function(){startGravity(list,1)}};
  st.onclick=function(e){var b=e.target.closest('button');if(b&&b.dataset.gl)startGravity(list,+b.dataset.gl)};
}
function startGravity(list,startLv){
  var st=$('fc-stage'),tok={};
  M={g:tok,list:list,deck:shuffle(list),di:0,lv:startLv,score:0,lives:3,right:0,lvRight:0,miss:[],cur:null,retype:false};
  st.innerHTML=head('Gravity','<div class="gv-hud"><span>Level <b id="gv-lv">'+M.lv+'</b></span><span>Score <b id="gv-sc">0</b></span><span class="gv-lives" id="gv-lives">'+gvHearts(3)+'</span></div>')+
    '<div class="gv-sky" id="gv-sky"><div class="gv-stars" aria-hidden="true"></div><div class="gv-ground" aria-hidden="true"></div></div>'+
    '<form class="typein gv-form" id="gv-form" autocomplete="off"><input id="gv-in" type="text" placeholder="Type your answer, then press Enter" aria-label="Your answer" autocapitalize="off" autocomplete="off" spellcheck="false"><button class="btn pri" type="submit">Enter</button><button class="btn" type="button" id="gv-quit">End game</button></form>'+
    '<div id="gv-msg" class="gv-msg" aria-live="polite"></div>';
  keyH=null;
  var sky=$('gv-sky'),inp=$('gv-in');
  st.scrollIntoView({block:'start',behavior:'smooth'});
  function msg(h,cls){var m=$('gv-msg');if(m){m.className='gv-msg '+(cls||'');m.innerHTML=h}}
  function dur(c){return Math.max(5,16-(M.lv-1)*1.5)+Math.min(6,gvPrompt(c).length*0.035)}
  function spawn(){
    if(M.g!==tok)return;
    if(M.di>=M.deck.length){M.deck=shuffle(M.list);M.di=0}
    var c=M.deck[M.di++];
    var el=document.createElement('div');el.className='gv-rock';
    el.innerHTML='<span class="gv-tp">'+esc(c.top.n)+(c.h?' · HL':'')+'</span>'+esc(gvPrompt(c));
    sky.appendChild(el);
    var maxX=Math.max(0,sky.clientWidth-el.offsetWidth-16);
    el.style.left=(8+Math.random()*maxX)+'px';
    M.cur={c:c,el:el,t0:performance.now(),d:dur(c)*1000,paused:0,lastSeen:performance.now()};
    inp.value='';inp.disabled=false;inp.focus();
    requestAnimationFrame(tick);
  }
  function tick(now){
    if(M.g!==tok||!M.cur||M.retype)return;
    var page=$('view-flashcards');
    if(document.hidden||!page||!page.classList.contains('on')){M.cur.paused+=now-M.cur.lastSeen;M.cur.lastSeen=now;requestAnimationFrame(tick);return}
    M.cur.lastSeen=now;
    var p=(now-M.cur.t0-M.cur.paused)/M.cur.d,el=M.cur.el;
    var floor=sky.clientHeight-28-el.offsetHeight;
    el.style.transform='translateY('+(Math.min(1,p)*floor)+'px)';
    el.classList.toggle('gv-warn',p>0.75);
    if(p>=1)return landed();
    requestAnimationFrame(tick);
  }
  function landed(){
    var c=M.cur.c;M.lives--;M.miss.push(c);setLv(c.i,1);
    M.cur.el.classList.add('gv-crash');
    $('gv-lives').innerHTML=gvHearts(M.lives);
    if(M.lives<=0){setTimeout(finish,700);msg('<b>Out of lives.</b> The answer was <b>'+esc(c.ta[0])+'</b>.','no');inp.disabled=true;return}
    M.retype=true;
    msg('<b>It landed.</b> The answer was <b>'+esc(c.ta[0])+'</b>. Type it to carry on.','no');
    inp.value='';inp.focus();
  }
  function hit(){
    var c=M.cur.c,el=M.cur.el,p=(performance.now()-M.cur.t0-M.cur.paused)/M.cur.d;
    var pts=10*M.lv+Math.round(Math.max(0,1-p)*10*M.lv);
    M.score+=pts;M.right++;M.lvRight++;
    if(lvl(c.i)<3)setLv(c.i,lvl(c.i)+1);
    el.classList.add('gv-hit');el.insertAdjacentHTML('beforeend','<span class="gv-pts">+'+pts+'</span>');
    setTimeout(function(){el.remove()},420);
    M.cur=null;
    $('gv-sc').textContent=M.score;
    if(M.lvRight>=6){M.lv++;M.lvRight=0;$('gv-lv').textContent=M.lv;msg('<b>Level '+M.lv+'!</b> Cards now fall faster.','ok')}
    else msg('<b>+'+pts+'</b> '+esc(c.ta[0]),'ok');
    setTimeout(spawn,450);
  }
  $('gv-form').onsubmit=function(e){
    e.preventDefault();if(M.g!==tok)return;
    var v=inp.value;if(!v.trim()||!M.cur)return;
    var r=grade(v,M.cur.c.ta);
    if(M.retype){
      if(r!=='no'){M.retype=false;M.cur.el.remove();M.cur=null;msg('');spawn()}
      else{inp.select();msg('Type <b>'+esc(M.cur.c.ta[0])+'</b> to carry on.','no')}
      return;
    }
    if(r!=='no')hit();
    else{var el=M.cur.el;el.classList.remove('gv-shake');void el.offsetWidth;el.classList.add('gv-shake');inp.select();msg('Not quite. Keep trying.','no')}
  };
  $('gv-quit').onclick=finish;
  function finish(){
    if(M.g!==tok)return;
    M.g=null;var rec=setBest('gravity',M.score);
    var seen={},ms=M.miss.filter(function(c){if(seen[c.i])return false;seen[c.i]=1;return true});
    var h=head('Gravity: game over')+'<div class="donepanel"><div class="big">'+M.score+'</div><h4>'+(rec&&M.score?'New best score':'Best: '+(P.best.gravity||0))+'</h4><p>Reached level '+M.lv+' · '+M.right+' typed correctly</p><div class="fl-ctrl"><button class="btn pri" id="gv-again">Play again<span class="kbd">Enter</span></button>'+(ms.length?'<button class="btn" id="gv-learn">Learn the '+ms.length+' you missed</button>':'')+'</div>';
    if(ms.length)h+='<div class="misslist"><p class="qask" style="margin:0">Cards that landed</p>'+ms.map(function(c){return '<div><b>'+esc(c.ta[0])+'</b> · '+esc(gvPrompt(c))+'</div>'}).join('')+'</div>';
    st.innerHTML=h+'</div>';
    renderDeck();
    st.onclick=function(e){var b=e.target.closest('button');if(!b)return;if(b.id==='gv-again')startGravity(list,startLv);if(b.id==='gv-learn'){S.mode='learn';saveSel();renderModes();M={all:ms,round:null,roundNo:0};nextRound(st)}};
    keyH={'Enter':function(){startGravity(list,startLv)}};
  }
  st.onclick=null;
  setTimeout(spawn,300);
}

/* ---------- MEMORY (flip two tiles to find a term and its meaning) ---------- */
function modeMemory(st){
  var list=selCards({keepMastered:true}).filter(function(c){return c.f.length<=80&&c.b.length<=100});
  if(list.length<6)return emptyMsg(st,'Memory needs at least six cards with short answers. Choose more topics.');
  var key='memory:'+(S.topics.slice().sort().join(',')||'all'),best=P.best[key];
  st.innerHTML=head('Memory','<span class="pnum">Fewest moves: '+(best!=null?best:'none yet')+'</span>')+
    '<div class="donepanel"><h4>Find each term and its meaning</h4><p>All tiles start face down. Turn over two at a time. A term and its meaning (or a question and its answer) stay face up when they match. Fewer moves is better.</p><div class="gv-lv"><button class="btn pri" data-mp="6">6 pairs</button><button class="btn" data-mp="8">8 pairs</button><button class="btn" data-mp="10">10 pairs</button></div></div>';
  keyH={'Enter':function(){startMemory(list,key,6)}};
  st.onclick=function(e){var b=e.target.closest('button');if(b&&b.dataset.mp)startMemory(list,key+':'+b.dataset.mp,+b.dataset.mp)};
}
function startMemory(list,key,n){
  var st=$('fc-stage'),seen={},cs=[];
  shuffle(list).forEach(function(c){if(cs.length>=n)return;var a=norm(c.f),b=norm(c.b);if(seen[a]||seen[b])return;seen[a]=seen[b]=1;cs.push(c)});
  n=cs.length;
  var LB={d:['Term','Meaning'],q:['Question','Answer'],f:['Formula','Working']};
  var tiles=[];cs.forEach(function(c,i){var lb=LB[c.k]||LB.d;tiles.push({p:i,txt:c.f,t:1,lb:lb[0]});tiles.push({p:i,txt:c.b,t:0,lb:lb[1]})});
  tiles=shuffle(tiles);
  var tok={};M={mem:tok,open:[],moves:0,left:n,busy:false,t0:performance.now(),cs:cs};
  st.innerHTML=head('Memory','<div class="gv-hud"><span>Moves <b id="mm-mv">0</b></span><span>Pairs left <b id="mm-left">'+n+'</b></span></div>')+
    '<div class="memgrid'+(n>8?' wide':'')+'">'+tiles.map(function(t,i){return '<button class="mtile" data-i="'+i+'" data-p="'+t.p+'" data-t="'+t.t+'" aria-label="Hidden tile '+(i+1)+'"><span class="mt-in"><span class="mt-b" aria-hidden="true"><b>'+(i+1)+'</b></span><span class="mt-f'+(t.t?' term':'')+'"><small>'+t.lb+'</small>'+esc(t.txt)+'</span></span></button>'}).join('')+'</div>';
  keyH=null;st.scrollIntoView({block:'start',behavior:'smooth'});
  st.onclick=function(e){
    var b=e.target.closest('.mtile');if(!b||M.mem!==tok||M.busy||b.classList.contains('up'))return;
    b.classList.add('up');var sm=b.querySelector('.mt-f small');b.setAttribute('aria-label',sm.textContent+': '+b.querySelector('.mt-f').textContent.slice(sm.textContent.length));
    M.open.push(b);
    if(M.open.length<2)return;
    M.moves++;$('mm-mv').textContent=M.moves;
    var a=M.open[0],c=M.open[1];M.open=[];
    if(a.dataset.p===c.dataset.p&&a.dataset.t!==c.dataset.t){
      a.classList.add('done');c.classList.add('done');M.left--;$('mm-left').textContent=M.left;
      var card=M.cs[+a.dataset.p];if(lvl(card.i)<1)setLv(card.i,1);
      if(!M.left){var t=(performance.now()-M.t0)/1000,rec=setBest(key,M.moves,true);
        setTimeout(function(){
          st.innerHTML=head('Memory')+'<div class="donepanel"><div class="big">'+M.moves+' moves</div><h4>'+(rec?'New record':'Fewest moves: '+P.best[key])+'</h4><p>'+n+' pairs in '+t.toFixed(0)+' seconds. A perfect game is '+n+' moves.</p><div class="fl-ctrl"><button class="btn pri" id="mm-again">Play again<span class="kbd">Enter</span></button></div></div>';
          renderDeck();keyH={'Enter':function(){startMemory(list,key,n)}};
          st.onclick=function(ev){var bb=ev.target.closest('button');if(bb&&bb.id==='mm-again')startMemory(list,key,n)};
        },500)}
    }else{
      M.busy=true;a.classList.add('miss');c.classList.add('miss');
      setTimeout(function(){a.classList.remove('up','miss');c.classList.remove('up','miss');a.setAttribute('aria-label','Hidden tile');c.setAttribute('aria-label','Hidden tile');M.busy=false},1100);
    }
  };
}

var MODEFN={flash:modeFlash,learn:modeLearn,write:modeWrite,test:modeTest,match:modeMatch,memory:modeMemory,gravity:modeGravity,blitz:modeBlitz,drill:function(st){window.csDrill&&window.csDrill(st)}};
window.csFc={
  total:function(){return visibleCards().length},
  init:function(){
    if(this.ready){renderDeck();return}
    this.ready=true;
    $('fc-deck').addEventListener('click',deckClick);
    $('fc-modes').addEventListener('click',function(e){var b=e.target.closest('button');if(b&&b.dataset.m)setMode(b.dataset.m)});
    renderDeck();renderModes();resetMode();syncBadge();syncInit();if(FOCUS_NEXT){FOCUS_NEXT=false;focus(true)}
  },
  openUnit:function(u){var sl=isSL();S.unit=String(u);S.topics=BM.topics.filter(function(t){return String(t.u)===String(u)&&!(sl&&t.hl)}).map(function(t){return t.id});S.collapsed=false;saveSel();if(this.ready){renderDeck();resetMode()}},
  openMode:function(m){S.mode=m;saveSel();if(this.ready){renderModes();resetMode()}},
  start:function(m){S.mode=m;saveSel();if(this.ready){renderModes();focus(true);resetMode()}else FOCUS_NEXT=true},
  mode:function(){return S.mode},modes:function(){return MODES},
  openTopics:function(ids,mode){FOCUS_NEXT=true;S.topics=ids.filter(function(id){return TOP[id]});var t=TOP[S.topics[0]];S.unit=S.topics.length===1&&t?String(t.u):(S.topics.length&&t&&S.topics.every(function(id){return TOP[id].u===t.u})?String(t.u):'all');if(mode)S.mode=mode;saveSel();if(this.ready){renderDeck();renderModes();resetMode();FOCUS_NEXT=false;focus(true)}},
  openTopic:function(tid,mode){S.topics=[tid];var t=TOP[tid];if(t)S.unit=String(t.u);if(mode)S.mode=mode;saveSel();if(this.ready){renderDeck();renderModes();resetMode()}},
  level:function(){if(this.ready){renderDeck();resetMode()}},
  isSL:isSL,lvl:lvl,setBest:setBest,best:function(k){return P.best[k]},selTopics:function(){return S.topics.slice()},head:head,esc:esc
};
/* opened straight at #flashcards: the router ran before this module existed, so start it now */
var fv=$('view-flashcards');if(fv&&fv.classList.contains('on'))window.csFc.init();
})();
/* ================= Number drill: fresh Paper 1 / Paper 2 calculations with worked answers ================= */
(function(){
var $=function(id){return document.getElementById(id)};
function esc(t){return window.csEsc(t)}
function ri(a,b){return a+Math.floor(Math.random()*(b-a+1))}
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function isSL(){return document.body.getAttribute('data-level')==='sl'}
function lsGet(k,d){try{var v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function bin(n,w){var s=n.toString(2);while(s.length<w)s='0'+s;return s}
function hex(n,w){var s=n.toString(16).toUpperCase();while(s.length<(w||2))s='0'+s;return s}
function grp(s){return s.replace(/(.{4})(?=.)/g,'$1 ')}
function fmt(n){return n.toLocaleString('en-GB')}
function cleanNum(v){return String(v).replace(/[\s,_]/g,'').replace(/bytes?$|bits?$|b$/i,'')}

var TYPES=[
 // id, name, topic, hl, generator
 ['b2d','Binary → denary','A1.2',0,function(){var n=ri(1,255),b=bin(n,8);var w=b.split('').map(function(d,i){return d==='1'?Math.pow(2,7-i):null}).filter(function(x){return x!==null});
   return {q:'Convert the binary number <b class="mono">'+grp(b)+'</b> to denary.',a:[String(n)],num:true,sol:'Add the place values of the 1s: '+w.join(' + ')+' = <b>'+n+'</b>.'}}],
 ['d2b','Denary → binary','A1.2',0,function(){var n=ri(1,255),b=bin(n,8);
   return {q:'Convert <b>'+n+'</b> to an 8-bit binary number.',a:[b,String(parseInt(b,2).toString(2))],bin:true,sol:'Take away the largest place values (128, 64, 32, 16, 8, 4, 2, 1) that fit: <b class="mono">'+grp(b)+'</b>.'}}],
 ['h2d','Hex → denary','A1.2',0,function(){var n=ri(16,255),h=hex(n);var hi=Math.floor(n/16),lo=n%16;
   return {q:'Convert the hexadecimal number <b class="mono">'+h+'</b> to denary.',a:[String(n)],num:true,sol:h[0]+' = '+hi+', '+h[1]+' = '+lo+'; so '+hi+' × 16 + '+lo+' = <b>'+n+'</b>.'}}],
 ['d2h','Denary → hex','A1.2',0,function(){var n=ri(16,255),h=hex(n);
   return {q:'Convert <b>'+n+'</b> to hexadecimal.',a:[h],hex:true,sol:n+' ÷ 16 = '+Math.floor(n/16)+' remainder '+(n%16)+', giving the digits '+h[0]+' and '+h[1]+': <b class="mono">'+h+'</b>.'}}],
 ['b2h','Binary → hex','A1.2',0,function(){var n=ri(1,255),b=bin(n,8),h=hex(n);
   return {q:'Convert <b class="mono">'+grp(b)+'</b> to hexadecimal.',a:[h],hex:true,sol:'Split into nibbles: <span class="mono">'+b.slice(0,4)+'</span> = '+h[0]+', <span class="mono">'+b.slice(4)+'</span> = '+h[1]+'. Answer <b class="mono">'+h+'</b>.'}}],
 ['h2b','Hex → binary','A1.2',0,function(){var n=ri(1,255),b=bin(n,8),h=hex(n);
   return {q:'Convert the hexadecimal number <b class="mono">'+h+'</b> to 8-bit binary.',a:[b],bin:true,sol:'Each hex digit becomes 4 bits: '+h[0]+' = <span class="mono">'+b.slice(0,4)+'</span>, '+h[1]+' = <span class="mono">'+b.slice(4)+'</span>. Answer <b class="mono">'+grp(b)+'</b>.'}}],
 ['vals','Values from bits','A1.2',0,function(){if(Math.random()<.5){var n=ri(2,16);return {q:'How many different values can be represented with <b>'+n+'</b> bits?',a:[String(Math.pow(2,n))],num:true,sol:'2<sup>'+n+'</sup> = <b>'+fmt(Math.pow(2,n))+'</b>.'}}
   var N=ri(3,5000),k=Math.ceil(Math.log2(N));return {q:'What is the minimum number of bits needed to give a unique code to <b>'+fmt(N)+'</b> items?',a:[String(k)],num:true,sol:'2<sup>'+(k-1)+'</sup> = '+fmt(Math.pow(2,k-1))+' is too few; 2<sup>'+k+'</sup> = '+fmt(Math.pow(2,k))+' is enough, so <b>'+k+' bits</b>.'}}],
 ['img','Image file size','A1.2',0,function(){var W=pick([320,640,800,1024,1280,1920]),Hh=pick([240,480,600,768,720,1080]),d=pick([1,8,16,24]);var bits=W*Hh*d,bytes=bits/8;
   return {q:'A bitmap image is <b>'+W+' × '+Hh+'</b> pixels with a colour depth of <b>'+d+' bits</b>. Calculate its file size in <b>bytes</b> (ignore any metadata).',a:[String(bytes)],num:true,sol:'pixels × colour depth = '+fmt(W)+' × '+fmt(Hh)+' × '+d+' = '+fmt(bits)+' bits; ÷ 8 = <b>'+fmt(bytes)+' bytes</b>.'}}],
 ['col','Colours from depth','A1.2',0,function(){var d=pick([1,2,4,8,16,24]);return {q:'How many different colours can be shown with a colour depth of <b>'+d+' bits</b>?',a:[String(Math.pow(2,d))],num:true,sol:'2<sup>'+d+'</sup> = <b>'+fmt(Math.pow(2,d))+'</b> colours.'}}],
 ['snd','Sound file size','A1.2',0,function(){var r=pick([8000,22050,44100,48000]),b=pick([8,16,24]),c=pick([1,2]),s=pick([5,10,30,60]);var bits=r*b*c*s;
   return {q:'Sound is sampled at <b>'+fmt(r)+' Hz</b> with a bit depth of <b>'+b+' bits</b>, in <b>'+(c===1?'mono':'stereo')+'</b>, for <b>'+s+' seconds</b>. Calculate the file size in <b>bytes</b>.',a:[String(bits/8)],num:true,sol:'sample rate × bit depth × channels × seconds = '+fmt(r)+' × '+b+' × '+c+' × '+s+' = '+fmt(bits)+' bits; ÷ 8 = <b>'+fmt(bits/8)+' bytes</b>.'}}],
 ['hosts','Hosts in a subnet','A2.2',0,function(){var p=ri(20,30),n=Math.pow(2,32-p)-2;return {q:'How many usable host addresses are there in a <b>/'+p+'</b> subnet?',a:[String(n)],num:true,sol:'Host bits = 32 − '+p+' = '+(32-p)+'; 2<sup>'+(32-p)+'</sup> − 2 (network and broadcast addresses) = <b>'+fmt(n)+'</b>.'}}],
 ['bsearch','Binary search steps','B2.4',0,function(){var n=pick([10,50,100,500,1000,5000,10000,100000,1000000]),k=Math.ceil(Math.log2(n+1));return {q:'What is the <b>maximum</b> number of comparisons a binary search needs to find an item in a sorted list of <b>'+fmt(n)+'</b> items?',a:[String(k)],num:true,sol:'Each comparison halves the list: the smallest k with 2<sup>k</sup> − 1 ≥ '+fmt(n)+' is <b>'+k+'</b> (2<sup>'+k+'</sup> = '+fmt(Math.pow(2,k))+').'}}],
 ['lsearch','Linear search steps','B2.4',0,function(){var n=pick([10,50,100,500,1000,5000]);return {q:'What is the <b>maximum</b> number of comparisons a linear search makes in an unsorted list of <b>'+fmt(n)+'</b> items?',a:[String(n)],num:true,sol:'In the worst case (last item or not present) it checks every item: <b>'+fmt(n)+'</b>.'}}],
 ['bubble','Bubble sort comparisons','B2.4',0,function(){var n=ri(5,12);return {q:'A bubble sort makes one fewer comparison on each pass and does not stop early. How many comparisons does it make in total to sort <b>'+n+'</b> items?',a:[String(n*(n-1)/2)],num:true,sol:'Pass 1 makes '+(n-1)+' comparisons, pass 2 makes '+(n-2)+', … the last pass makes 1: ('+n+' × '+(n-1)+') ÷ 2 = <b>'+(n*(n-1)/2)+'</b>.'}}],
 ['rle','Run-length encoding','A1.1',0,function(){var cs='ABWX'.split(''),s='',runs=[];var k=ri(3,5);for(var i=0;i<k;i++){var c=pick(cs.filter(function(x){return !runs.length||x!==runs[runs.length-1][1]})),n=ri(1,6);runs.push([n,c]);s+=Array(n+1).join(c)}
   var enc=runs.map(function(r){return r[0]+r[1]}).join('');return {q:'Encode <b class="mono">'+s+'</b> with run-length encoding, writing each run as count then character (e.g. 3X).',a:[enc],code:true,sol:'Runs: '+runs.map(function(r){return Array(r[0]+1).join(r[1])+' → '+r[0]+r[1]}).join(', ')+'. Answer <b class="mono">'+enc+'</b> ('+enc.length+' characters instead of '+s.length+').'}}],
 ['hash','Hash table index','B4.1',1,function(){var m=pick([7,10,11,13]),k=ri(12,199);return {q:'A hash table has <b>'+m+'</b> slots (0 to '+(m-1)+') and uses <b>h(key) = key mod '+m+'</b>. At which index is key <b>'+k+'</b> stored, if there is no collision?',a:[String(k%m)],num:true,sol:k+' ÷ '+m+' = '+Math.floor(k/m)+' remainder '+(k%m)+', so index <b>'+(k%m)+'</b>.'}}],
 ['load','Load factor','B4.1',1,function(){var m=pick([8,10,16,20,50]),n=ri(2,m);return {q:'A hash table has <b>'+m+'</b> slots and holds <b>'+n+'</b> items. Calculate its load factor (to 2 decimal places).',a:[(n/m).toFixed(2),String(+(n/m).toFixed(2))],dec:true,sol:'load factor = items ÷ slots = '+n+' ÷ '+m+' = <b>'+(n/m).toFixed(2)+'</b>.'}}],
 ['lin','Linear regression','A4.3',1,function(){var m=pick([2,3,5,0.5,1.5]),c=pick([1,4,10,20]),x=ri(2,20);return {q:'A linear regression model is <b>y = '+m+'x + '+c+'</b>. Predict y when <b>x = '+x+'</b>.',a:[String(+(m*x+c).toFixed(2))],dec:true,sol:'y = '+m+' × '+x+' + '+c+' = <b>'+(+(m*x+c).toFixed(2))+'</b>. The slope '+m+' is the change in y for each 1 added to x; the intercept '+c+' is y when x = 0.'}}],
 ['prec','Precision and recall','A4.3',1,function(){var tp=ri(20,90),fp=ri(2,30),fn=ri(2,30),which=pick(['precision','recall','accuracy']),tn=ri(40,200);var v=which==='precision'?tp/(tp+fp):which==='recall'?tp/(tp+fn):(tp+tn)/(tp+tn+fp+fn);
   return {q:'A classifier gives <b>TP = '+tp+'</b>, <b>FP = '+fp+'</b>, <b>FN = '+fn+'</b>, <b>TN = '+tn+'</b>. Calculate its <b>'+which+'</b> to 2 decimal places.',a:[v.toFixed(2)],dec:true,
     sol:which==='precision'?'precision = TP ÷ (TP + FP) = '+tp+' ÷ '+(tp+fp)+' = <b>'+v.toFixed(2)+'</b>.':which==='recall'?'recall = TP ÷ (TP + FN) = '+tp+' ÷ '+(tp+fn)+' = <b>'+v.toFixed(2)+'</b>.':'accuracy = (TP + TN) ÷ total = '+(tp+tn)+' ÷ '+(tp+tn+fp+fn)+' = <b>'+v.toFixed(2)+'</b>.'}}]
];
var BYID={};TYPES.forEach(function(t){BYID[t[0]]=t});

function check(q,v){
  var raw=String(v).trim();if(!raw)return false;
  if(q.num){return q.a.indexOf(cleanNum(raw))>-1}
  if(q.dec){var x=parseFloat(raw.replace(',','.'));return q.a.some(function(a){return Math.abs(parseFloat(a)-x)<0.006})}
  if(q.bin){var b=raw.replace(/\s/g,'');if(!/^[01]+$/.test(b))return false;return parseInt(b,2)===parseInt(q.a[0],2)}
  if(q.hex){var h=raw.replace(/\s|^0x|h$/gi,'').toUpperCase();return h===q.a[0]||h.replace(/^0+/,'')===q.a[0].replace(/^0+/,'')}
  if(q.code){return raw.replace(/\s/g,'').toUpperCase()===q.a[0]}
  return q.a.indexOf(raw)>-1;
}

var D={};
window.csDrill=function(st){
  var sl=isSL(),o=lsGet('csDrill',{on:['b2d','d2b','h2d','d2h','b2h','h2b','img','snd','hosts','bsearch']});
  var avail=TYPES.filter(function(t){return !(sl&&t[3])});
  var h=window.csFc.head('Number drill','<span class="pnum">Best streak: '+(window.csFc.best('drill')||0)+'</span>')+
    '<p class="cd-unit" style="margin:0 0 10px">Fresh numbers every time, with the working shown after you answer. Tick the kinds of question you want.</p>'+
    '<div class="cd-types">'+avail.map(function(t){return '<label class="cd-t"><input type="checkbox" value="'+t[0]+'"'+(o.on.indexOf(t[0])>-1?' checked':'')+'> <span>'+esc(t[1])+'</span><em>'+t[2]+(t[3]?' · HL':'')+'</em></label>'}).join('')+'</div>'+
    '<div class="fl-ctrl" style="justify-content:flex-start"><button class="btn pri" id="cd-go">Start</button><button class="minibtn" id="cd-all">Tick all</button><button class="minibtn" id="cd-none">Untick all</button></div>';
  st.innerHTML=h;st.onchange=null;
  st.onclick=function(e){var b=e.target.closest('button');if(!b)return;
    if(b.id==='cd-all'||b.id==='cd-none'){st.querySelectorAll('.cd-t input').forEach(function(i){i.checked=b.id==='cd-all'});return}
    if(b.id!=='cd-go')return;
    var on=[].map.call(st.querySelectorAll('.cd-t input:checked'),function(i){return i.value});if(!on.length)return;
    lsSet('csDrill',{on:on});D={on:on,n:0,ok:0,streak:0,best:0};ask(st)};
};
function ask(st){
  var t=BYID[pick(D.on)],q=t[4]();D.q=q;D.done=false;
  st.innerHTML=window.csFc.head('Number drill','<span class="pnum">'+D.ok+' / '+D.n+' · streak '+D.streak+'</span><button class="minibtn" id="cd-set">Change</button>')+
    '<div class="cd-q"><span class="fname">'+esc(t[1])+' · '+t[2]+(t[3]?' · HL':'')+'</span>'+q.q+'</div>'+
    '<form class="typein" id="cd-form" autocomplete="off"><input id="cd-in" type="text" inputmode="'+(q.num||q.dec?'decimal':'text')+'" aria-label="Your answer" placeholder="Your answer" autocapitalize="off" spellcheck="false"><button class="btn pri" type="submit">Check</button><button class="btn" type="button" id="cd-show">Show me</button></form><div id="cd-fb"></div>';
  var inp=$('cd-in');setTimeout(function(){inp&&inp.focus()},30);
  function done(ok){
    if(D.done)return;D.done=true;D.n++;inp.disabled=true;
    if(ok){D.ok++;D.streak++;if(window.csFc.setBest('drill',D.streak))D.best=D.streak}else D.streak=0;
    $('cd-fb').innerHTML='<div class="fb '+(ok?'ok':'no')+'"><b>'+(ok?'Correct.':'Not this time.')+'</b>'+(ok?'':' The answer is <b class="mono">'+esc(q.a[0])+'</b>.')+'<div class="cd-sol">'+q.sol+'</div><div class="row"><button class="btn pri" id="cd-next">Next<span class="kbd">Enter</span></button></div></div>';
    var nb=$('cd-next');if(nb)nb.focus();
  }
  $('cd-form').onsubmit=function(e){e.preventDefault();if(D.done){ask(st);return}if(!inp.value.trim())return;done(check(q,inp.value))};
  st.onclick=function(e){var b=e.target.closest('button');if(!b)return;if(b.id==='cd-show')done(false);if(b.id==='cd-next')ask(st);if(b.id==='cd-set')window.csDrill(st)};
}
document.addEventListener('keydown',function(e){var v=$('view-flashcards');if(!v||!v.classList.contains('on'))return;if(e.key==='Enter'&&D.done&&$('cd-next')&&document.activeElement&&document.activeElement.tagName!=='INPUT'){e.preventDefault();ask($('fc-stage'))}});
})();
