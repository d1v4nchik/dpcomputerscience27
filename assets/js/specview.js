/* Specimen papers view: every question of the IB specimen papers, attempted first, then broken down.
   Route: #specimen (paper 1), #specimen.p2, #specimen.<part id> (opens that paper and scrolls to the part). */
(function(){
'use strict';
function $(id){return document.getElementById(id)}
function esc(t){return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function lsGet(k,d){try{var v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
var S=window.CS_SPEC;if(!S)return;
var ST=lsGet('csSpec',{}),PAPER=lsGet('csSpecP','p1');
function save(){lsSet('csSpec',ST)}
function st(id){return ST[id]||(ST[id]={})}

/* what each IB command term asks for, in plain words */
var CT={
 'State':'Give a specific name, value or short answer. No explanation is needed.',
 'Identify':'Pick out an answer from a number of possibilities. A word or a short phrase is enough.',
 'List':'Give a sequence of brief answers with no explanation.',
 'Outline':'Give a brief account: one point, then a little more about it. Usually one mark for the point and one for the expansion.',
 'Describe':'Give a detailed account: the features or steps, in order, each one clear enough to earn its own mark.',
 'Explain':'Give a detailed account including reasons or causes. Every point needs a "because" or "so that".',
 'Construct':'Display the information in a diagram, table or code, built logically and complete.',
 'Trace':'Follow an algorithm step by step, writing down the value of every variable each time it changes.',
 'Sketch':'Draw a diagram that shows the key features clearly. Labels matter more than neatness.',
 'Discuss':'Offer a considered, balanced review: arguments for and against, in context, ending with a conclusion that follows from them.',
 'To what extent':'Weigh up how far something is true. Argue both sides with evidence and examples, then make a clear judgement.'
};
var FIG={
 halfsub:'<svg viewBox="0 0 430 180" class="spc-svg" role="img" aria-label="Logic circuit: X and Y enter an XOR gate giving Difference; X also passes through a NOT gate into an AND gate with Y, giving Borrow">'+
   '<g class="w" fill="none"><path d="M40 40H158M135 150V60H158M70 40V120H90M120 120H200M40 150H200M220 50H330M250 135H330"/>'+
   '<path d="M150 30q14 20 0 40M158 30q44 0 62 20q-18 20-62 20q14-20 0-40z"/><path d="M90 108l22 12-22 12z"/><circle cx="116" cy="120" r="4"/>'+
   '<path d="M200 110h25a25 25 0 0 1 0 50h-25z"/></g><circle class="dotf" cx="70" cy="40" r="3.5"/><circle class="dotf" cx="135" cy="150" r="3.5"/>'+
   '<text x="18" y="45" class="t">X</text><text x="18" y="155" class="t">Y</text><text x="338" y="55" class="t">Difference</text><text x="338" y="140" class="t">Borrow</text>'+
   '<text x="186" y="88" class="s c">XOR</text><text x="101" y="100" class="s c">NOT</text><text x="224" y="176" class="s c">AND</text></svg>',
 flow:'<svg viewBox="0 0 440 575" class="spc-svg spc-flow" role="img" aria-label="Flowchart: start, input N, i = 1; while i is at most N output i, set j to i + 1, and while j is at most N output j and add 1 to j; then add 1 to i; end when i is greater than N">'+
   '<defs><marker id="spcA" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8z" class="arrf"/></marker></defs>'+
   '<g class="w" fill="none"><rect x="145" y="10" width="110" height="36" rx="18"/><path d="M140 66h130l-14 36H126z"/><rect x="135" y="122" width="130" height="36" rx="4"/>'+
   '<path d="M200 178l70 34-70 34-70-34z"/><path d="M140 266h130l-14 36H126z"/><rect x="135" y="322" width="130" height="36" rx="4"/>'+
   '<path d="M200 378l70 34-70 34-70-34z"/><path d="M140 466h130l-14 36H126z"/><rect x="135" y="522" width="130" height="36" rx="4"/>'+
   '<rect x="20" y="194" width="90" height="36" rx="18"/><rect x="300" y="394" width="120" height="36" rx="4"/></g>'+
   '<g class="w" fill="none" marker-end="url(#spcA)"><path d="M200 46V66"/><path d="M200 102V122"/><path d="M200 158V178"/><path d="M200 246V266"/><path d="M200 302V322"/><path d="M200 358V378"/><path d="M200 446V466"/><path d="M200 502V522"/>'+
   '<path d="M130 212H110"/><path d="M270 412H300"/><path d="M360 394V212H270"/><path d="M135 540H95V412H130"/></g>'+
   '<text x="200" y="33" class="t c">Start</text><text x="198" y="89" class="t c">input N</text><text x="200" y="145" class="t c">i = 1</text><text x="200" y="217" class="t c">i &lt;= N?</text>'+
   '<text x="198" y="289" class="t c">output i</text><text x="200" y="345" class="t c">j = i + 1</text><text x="200" y="417" class="t c">j &lt;= N?</text><text x="198" y="489" class="t c">output j</text>'+
   '<text x="200" y="545" class="t c">j = j + 1</text><text x="360" y="417" class="t c">i = i + 1</text><text x="65" y="217" class="t c">End</text>'+
   '<text x="118" y="204" class="s c">F</text><text x="210" y="260" class="s">T</text><text x="282" y="404" class="s c">F</text><text x="210" y="460" class="s">T</text></svg>',
 bst:'',bst2:''
};
function bstSvg(extra){
  var N=[['Jeanne',230,34],['Hwang',120,104],['Martin',340,104],['Manuel',280,174],['Pedro',400,174]],E=[[0,1],[0,2],[2,3],[2,4]];
  if(extra){N.push(['Indie',170,174],['Louis',240,244]);E.push([1,5],[3,6])}
  var h='<svg viewBox="0 0 460 '+(extra?280:210)+'" class="spc-svg" role="img" aria-label="Binary search tree with root Jeanne; Hwang on the left; Martin on the right with children Manuel and Pedro'+(extra?'; Indie is now the right child of Hwang and Louis the left child of Manuel':'')+'"><g class="w">';
  E.forEach(function(e){h+='<line x1="'+N[e[0]][1]+'" y1="'+N[e[0]][2]+'" x2="'+N[e[1]][1]+'" y2="'+N[e[1]][2]+'"/>'});
  h+='</g>';N.forEach(function(n,i){var nw=extra&&i>4;h+='<g class="nd'+(nw?' nw':'')+'"><rect x="'+(n[1]-44)+'" y="'+(n[2]-17)+'" width="88" height="34" rx="17"/><text x="'+n[1]+'" y="'+(n[2]+5)+'" class="t c">'+n[0]+'</text></g>'});
  return h+'</svg>';
}
FIG.bst=bstSvg(0);FIG.bst2=bstSvg(1);
function fig(k){return FIG[k]?'<figure class="spc-fig">'+FIG[k]+'</figure>':''}

/* language-aware helpers: P2 stems and code come in Python and Java */
function langHtml(h){return String(h||'').replace(/<pre class="spc-code" data-lang="(py|java)">/g,'<pre class="spc-code lang-$1">')}
function txt(t){if(t&&typeof t==='object')return '<span class="lang-py">'+langHtml(t.py)+'</span><span class="lang-java">'+langHtml(t.java)+'</span>';return langHtml(t)}
function code(c){if(!c)return '';var h='';
  if(c.sql)h+='<pre class="spc-code" data-l="SQL">'+esc(c.sql)+'</pre>';
  if(c.py)h+='<pre class="spc-code'+(c.java?' lang-py':'')+'" data-l="Python">'+esc(c.py)+'</pre>';
  if(c.java)h+='<pre class="spc-code'+(c.py?' lang-java':'')+'" data-l="Java">'+esc(c.java)+'</pre>';
  return h}
function table(t){if(!t)return '';return '<div class="spc-tw"><table class="spc-t"><thead><tr>'+t[0].map(function(c){return '<th>'+esc(c)+'</th>'}).join('')+'</tr></thead><tbody>'+
  t.slice(1).map(function(r){return '<tr>'+r.map(function(c){return '<td>'+esc(c)+'</td>'}).join('')+'</tr>'}).join('')+'</tbody></table></div>'}
function qnum(P,g){return P.code&&g.qpy?'<span class="lang-java">'+esc(g.q)+'</span><span class="lang-py">'+esc(g.qpy)+'</span>':esc(g.q)}
function score(q){var s=st(q.id);if(q.levels)return s.lv==null?null:s.lv;if(!s.t||!s.open)return null;return Math.min(q.m,s.t.length)}

function partHtml(P,g,q){
  var s=st(q.id),open=!!s.open;
  var h='<article class="spc-p" id="spc-'+q.id+'" data-id="'+q.id+'">'+
   '<div class="spc-ph"><span class="spc-pl">'+esc(q.part)+'</span><span class="spc-ct" title="'+esc(CT[q.ct]||'')+'">'+esc(q.ct)+'</span>'+
   (q.hl?'<span class="spc-hl">HL</span>':'')+'<span class="spc-m">['+q.m+(q.m>1?' marks':' mark')+']</span></div>'+
   (q.stem?'<div class="spc-stem2">'+txt(q.stem)+'</div>':'')+(q.stemCode?code(q.stemCode):'')+(q.fig?fig(q.fig):'')+
   '<div class="spc-q">'+txt(q.text)+'</div>'+(q.code?code(q.code):'')+
   (q.recon?'<p class="spc-recon">The scan of this question page was unreadable, so the wording here is rebuilt from the official markscheme.</p>':'')+
   '<label class="spc-al" for="spa-'+q.id+'">Your answer</label><textarea class="spc-a" id="spa-'+q.id+'" data-a="'+q.id+'" rows="'+Math.min(10,Math.max(3,q.m+1))+'" placeholder="Answer as you would in the exam, then open the breakdown to mark it.">'+esc(s.a||'')+'</textarea>'+
   '<div class="spc-act">'+(q.hint?'<button type="button" class="spc-b ghost" data-hint="'+q.id+'" aria-expanded="'+(!!s.hint)+'">'+(s.hint?'Hide hint':'Need a nudge?')+'</button>':'')+
   '<button type="button" class="spc-b" data-open="'+q.id+'" aria-expanded="'+open+'">'+(open?'Hide the breakdown':'I\'ve tried it · show the full breakdown')+'</button>'+
   '<span class="spc-sc" data-sc="'+q.id+'"></span></div>'+
   (q.hint?'<div class="spc-hint"'+(s.hint?'':' hidden')+'><b>Hint.</b> '+q.hint+'</div>':'')+
   '<div class="spc-sol"'+(open?'':' hidden')+'>'+
    (CT[q.ct]?'<div class="spc-blk ct"><h4>What “'+esc(q.ct)+'” wants</h4><p>'+CT[q.ct]+' Here that means about <b>'+q.m+' separate point'+(q.m>1?'s':'')+'</b>.</p></div>':'')+
    (q.steps&&q.steps.length?'<div class="spc-blk"><h4>Break it down</h4><ol class="spc-steps">'+q.steps.map(function(x){return '<li>'+x+'</li>'}).join('')+'</ol></div>':'')+
    '<div class="spc-blk mod"><h4>Model answer</h4>'+(q.ansTable?table(q.ansTable):'')+(q.ans?'<div class="spc-ans">'+txt(q.ans)+'</div>':'')+code(q.ansCode)+(q.fig2?fig(q.fig2):'')+'</div>'+
    '<div class="spc-blk ms"><h4>Mark yourself against the markscheme</h4>'+(q.levels?'<p class="spc-note">Level-marked: use the points below as a checklist, then award the level that fits.</p>':'<p class="spc-note">Tick each point your answer makes. Marks are capped at '+q.m+'.</p>')+
     '<ul class="spc-ms">'+q.ms.map(function(x,i){var on=s.t&&s.t.indexOf(i)>-1;return '<li><label><input type="checkbox" data-t="'+q.id+'" value="'+i+'"'+(on?' checked':'')+'><span>'+x+'</span></label></li>'}).join('')+'</ul>'+
     (q.levels?'<div class="spc-lv" role="group" aria-label="Award a mark">Award: '+Array.apply(null,Array(q.m+1)).map(function(_,i){return '<button type="button" data-lv="'+q.id+'" value="'+i+'" aria-pressed="'+(s.lv===i)+'">'+i+'</button>'}).join('')+'</div>':'')+
     (q.msNote?'<p class="spc-note">'+q.msNote+'</p>':'')+'</div>'+
    (q.trap?'<div class="spc-blk trap"><h4>Where marks slip</h4><p>'+q.trap+'</p></div>':'')+
    (q.n?'<a class="spc-rev" href="#'+esc(q.n)+'">Revise this in the notes →</a>':'')+
   '</div></article>';
  return h;
}
function render(u){
  var el=$('view-specimen');if(!el)return;
  if(u){if(u==='p1'||u==='p2')PAPER=u;else S.papers.forEach(function(P){P.groups.forEach(function(g){g.parts.forEach(function(q){if(q.id===u)PAPER=P.id})})})}
  lsSet('csSpecP',PAPER);
  var P=S.papers.filter(function(x){return x.id===PAPER})[0]||S.papers[0];
  var h='<div class="vhead plain th-IA"><div class="vh-in"><h1>Practice</h1><p>Exam-style questions with markschemes, flashcards for every term, and the IB specimen papers broken down. Choose what to practise on the side; your progress is saved on this device.</p></div></div>'+
   '<div class="vbody pxv"><div class="studybar" id="sb-specimen"></div><div class="fcl"><aside class="fcl-side"><div class="fcl-box"><span class="fcl-bh">Specimen papers</span>'+
   '<div class="spc-tabs" role="tablist">'+S.papers.map(function(x){return '<button type="button" role="tab" data-paper="'+x.id+'" aria-selected="'+(x.id===P.id)+'"><b>'+esc(x.name)+'</b><span>'+esc(x.sub)+'</span></button>'}).join('')+'</div>'+
   '<div class="spc-tot" id="spc-tot"></div>'+
   '<p class="spc-intro">'+P.intro+'</p>'+
   '<div class="fcl-foot"><button type="button" class="minibtn" data-reset="'+P.id+'">Clear my answers on '+esc(P.name)+'</button></div></div></aside>'+
   '<div class="fcl-main spc"><div class="pmh"><div class="pmh-top"><h2>'+esc(P.name)+'</h2><div class="pmh-stats"><span>'+esc(P.time)+'</span><span><b>'+P.marks+'</b> marks</span></div></div></div>';
  var sec='';
  P.groups.forEach(function(g){
    if(g.sec&&g.sec!==sec){sec=g.sec;h+='<h2 class="spc-sec">'+esc(g.sec)+'</h2>'}
    else if(!sec&&P.id==='p1'){sec='A';h+='<h2 class="spc-sec">Section A</h2>'}
    h+='<section class="spc-g"><h3 class="spc-gh">Question '+qnum(P,g)+'</h3>'+(g.stem?'<div class="spc-stem">'+txt(g.stem)+'</div>':'')+code(g.stemCode)+(g.fig?fig(g.fig):'')+
      g.parts.map(function(q){return partHtml(P,g,q)}).join('')+'</section>';
  });
  el.innerHTML=h+'</div></div></div>';if(window.csStudyBar)window.csStudyBar();
  P.groups.forEach(function(g){g.parts.forEach(function(q){scoreUi(q)})});tot(P);
  if(u&&u!=='p1'&&u!=='p2'){var t=$('spc-'+u);if(t)setTimeout(function(){t.scrollIntoView({block:'start'});t.classList.add('spc-flash')},60)}
}
function find(id){var r=null;S.papers.forEach(function(P){P.groups.forEach(function(g){g.parts.forEach(function(q){if(q.id===id)r=q})})});return r}
function scoreUi(q){var b=document.querySelector('[data-sc="'+q.id+'"]');if(!b)return;var v=score(q);b.textContent=v==null?(st(q.id).a?'Answered':''):v+' / '+q.m;b.className='spc-sc'+(v==null?'':v>=q.m?' full':v>0?' part':' zero')}
function tot(P){P=P||S.papers.filter(function(x){return x.id===PAPER})[0];var got=0,max=0,n=0,all=0;
  P.groups.forEach(function(g){g.parts.forEach(function(q){all++;var v=score(q);if(v!=null){got+=v;max+=q.m;n++}})});
  var e=$('spc-tot');if(e)e.innerHTML=n?'<b>'+got+' / '+max+'</b> on the '+n+' part'+(n>1?'s':'')+' you\'ve marked <i style="--p:'+Math.round(got*100/max)+'%"></i>':'Mark a part to see your score here ('+all+' parts)';}
document.addEventListener('click',function(e){
  var v=e.target.closest('#view-specimen');if(!v)return;
  var b=e.target.closest('button');if(!b)return;
  if(b.dataset.paper){window.csNav('specimen.'+b.dataset.paper);return}
  if(b.dataset.hint){var s=st(b.dataset.hint);s.hint=!s.hint;save();var a=b.closest('.spc-p');a.querySelector('.spc-hint').hidden=!s.hint;b.textContent=s.hint?'Hide hint':'Need a nudge?';b.setAttribute('aria-expanded',s.hint);return}
  if(b.dataset.open){var q=find(b.dataset.open),s2=st(q.id);s2.open=!s2.open;if(!s2.t)s2.t=[];save();var p=b.closest('.spc-p');p.querySelector('.spc-sol').hidden=!s2.open;
    b.textContent=s2.open?'Hide the breakdown':'I\'ve tried it · show the full breakdown';b.setAttribute('aria-expanded',s2.open);scoreUi(q);tot();return}
  if(b.dataset.lv){var q2=find(b.dataset.lv),s3=st(q2.id);s3.lv=+b.value;save();b.parentNode.querySelectorAll('button').forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});scoreUi(q2);tot();return}
  if(b.dataset.reset){var P=S.papers.filter(function(x){return x.id===b.dataset.reset})[0];P.groups.forEach(function(g){g.parts.forEach(function(q){delete ST[q.id]})});save();render(P.id);return}
});
document.addEventListener('change',function(e){
  var c=e.target;if(!c.dataset||!c.dataset.t)return;var q=find(c.dataset.t),s=st(q.id),i=+c.value;s.t=s.t||[];
  if(c.checked){if(s.t.indexOf(i)<0)s.t.push(i)}else s.t=s.t.filter(function(x){return x!==i});save();scoreUi(q);tot();
});
var tmr=null;
document.addEventListener('input',function(e){var a=e.target;if(!a.dataset||!a.dataset.a)return;st(a.dataset.a).a=a.value;clearTimeout(tmr);tmr=setTimeout(function(){save();scoreUi(find(a.dataset.a))},400)});
window.csSpec={render:render};
/* app.js routes before this file loads: catch a direct visit to #specimen */
var m0=/^#specimen(?:\.(.+))?$/.exec(location.hash);if(m0)render(m0[1]||'');
})();
