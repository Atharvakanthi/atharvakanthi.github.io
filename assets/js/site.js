/* Shared behaviour: theme, motion (anime.js), counters, radar, chart theme helpers */
(function(){
  var root=document.documentElement;
  var A=window.anime||null;
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $=function(s,c){return (c||document).querySelector(s)};
  var $$=function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))};

  /* ---------- Theme ---------- */
  function cssv(n){return getComputedStyle(root).getPropertyValue(n).trim()}
  function setTheme(t){
    root.setAttribute('data-theme',t);
    try{localStorage.setItem('theme',t)}catch(e){}
    document.dispatchEvent(new CustomEvent('themechange',{detail:t}));
  }
  var tb=$('.tbtn');
  if(tb)tb.addEventListener('click',function(){setTheme(root.getAttribute('data-theme')==='light'?'dark':'light')});

  /* ---------- Helpers exposed to pages ---------- */
  window.SITE={
    cssv:cssv,
    colors:function(){return{ink:cssv('--ink'),muted:cssv('--muted'),line:cssv('--line'),surface:cssv('--surface'),accent:cssv('--accent'),blue:cssv('--blue'),green:cssv('--green'),red:cssv('--red'),violet:cssv('--violet')}},
    palette:function(){var c=this.colors();return[c.accent,c.blue,c.green,c.violet,c.red,'#7FB7B0','#C98A5B','#8C99AA']},
    onTheme:function(fn){document.addEventListener('themechange',fn)},
    chartDefaults:function(){
      if(!window.Chart)return;var c=this.colors();
      Chart.defaults.color=c.muted;Chart.defaults.borderColor=c.line;
      Chart.defaults.font.family=getComputedStyle(document.body).fontFamily;Chart.defaults.font.size=12;
      Chart.defaults.plugins.legend.labels.boxWidth=10;Chart.defaults.plugins.legend.labels.usePointStyle=true;
      Chart.defaults.animation.duration=reduce?0:900;
    },
    fmt:function(n,d){return Number(n).toLocaleString('en-IN',{maximumFractionDigits:d==null?0:d,minimumFractionDigits:d==null?0:d})}
  };

  /* ---------- Progress bar + nav state ---------- */
  var prog=$('.progress');
  function onScroll(){
    if(prog){var h=document.documentElement.scrollHeight-innerHeight;prog.style.transform='scaleX('+(h>0?scrollY/h:0)+')'}
  }
  addEventListener('scroll',onScroll,{passive:true});onScroll();
  var secs=$$('section[id]'),navA=$$('.links a[href^="#"],.links a[href^="index.html#"],.links a[href^="/#"]');
  if(secs.length&&'IntersectionObserver' in window){
    var so=new IntersectionObserver(function(es){es.forEach(function(e){
      if(e.isIntersecting){navA.forEach(function(a){a.classList.toggle('on',a.getAttribute('href').split('#')[1]===e.target.id)})}
    })},{rootMargin:'-45% 0px -50% 0px'});
    secs.forEach(function(s){so.observe(s)});
  }

  /* ---------- Reveal on scroll ---------- */
  function reveal(el,i){
    if(!A||reduce){el.style.opacity=1;return}
    A.animate(el,{opacity:[0,1],translateY:[10,0],duration:520,delay:i||0,ease:'outCubic'});
  }
  function initReveal(){
    var els=$$('[data-reveal]');
    if(!('IntersectionObserver' in window)){els.forEach(function(e){e.style.opacity=1});return}
    var io=new IntersectionObserver(function(es){
      var batch=es.filter(function(e){return e.isIntersecting});
      batch.forEach(function(e,i){reveal(e.target,i*90);io.unobserve(e.target)});
    },{threshold:.12,rootMargin:'0px 0px -6% 0px'});
    els.forEach(function(e){io.observe(e)});
    /* safety: never leave content hidden */
    setTimeout(function(){els.forEach(function(e){if(getComputedStyle(e).opacity==='0'&&e.getBoundingClientRect().top<innerHeight*1.5){e.style.opacity=1}})},3500);
  }

  /* ---------- Counters + bars ---------- */
  function initCounters(){
    var els=$$('[data-count]');
    function run(el){
      var to=parseFloat(el.getAttribute('data-count')),dec=parseInt(el.getAttribute('data-dec')||0,10),pre=el.getAttribute('data-pre')||'',suf=el.getAttribute('data-suf')||'';
      if(!A||reduce){el.textContent=pre+SITE.fmt(to,dec)+suf;return}
      var o={v:0};
      A.animate(o,{v:to,duration:1600,ease:'outExpo',onUpdate:function(){el.textContent=pre+SITE.fmt(o.v,dec)+suf}});
    }
    function bar(el){
      var w=el.getAttribute('data-w')+'%';
      if(!A||reduce){el.style.width=w;return}
      A.animate(el,{width:['0%',w],duration:1200,ease:'outExpo'});
    }
    if(!('IntersectionObserver' in window)){els.forEach(run);$$('.fi[data-w]').forEach(bar);return}
    var io=new IntersectionObserver(function(es){es.forEach(function(e){
      if(!e.isIntersecting)return;
      if(e.target.hasAttribute('data-count'))run(e.target);else bar(e.target);
      io.unobserve(e.target);
    })},{threshold:.4});
    els.forEach(function(e){io.observe(e)});$$('.fi[data-w]').forEach(function(e){io.observe(e)});
  }

  /* ---------- Hero headline split + canvas ---------- */
  function initHero(){
    var h=$('.hero h1');if(!h)return;
    if(!h.dataset.split){
      h.dataset.split=1;
      var walk=function(node){
        $$(':scope > *',node);
      };
      var out=[];
      Array.prototype.slice.call(h.childNodes).forEach(function(n){
        if(n.nodeType===3){
          n.textContent.split(/(\s+)/).forEach(function(t){
            if(!t)return;
            if(/^\s+$/.test(t)){out.push(document.createTextNode(' '));return}
            var w=document.createElement('span');w.className='w';var s=document.createElement('span');s.textContent=t;w.appendChild(s);out.push(w);
          });
        }else if(n.nodeType===1){
          var em=n.cloneNode(false);
          n.textContent.split(/(\s+)/).forEach(function(t){
            if(!t)return;
            if(/^\s+$/.test(t)){em.appendChild(document.createTextNode(' '));return}
            var w=document.createElement('span');w.className='w';var s=document.createElement('span');s.textContent=t;w.appendChild(s);em.appendChild(w);
          });
          out.push(em);
        }
      });
      h.textContent='';out.forEach(function(n){h.appendChild(n)});
    }
    var ws=$$('.w>span',h);
    if(A&&!reduce){
      ws.forEach(function(s){s.style.transform='translateY(110%)'});
      A.animate(ws,{translateY:['110%','0%'],duration:900,delay:A.stagger(70,{start:150}),ease:'outExpo'});
      var rest=$$('.hero [data-hero]');rest.forEach(function(e){e.style.opacity=0});
      A.animate(rest,{opacity:[0,1],translateY:[18,0],duration:800,delay:A.stagger(110,{start:650}),ease:'outCubic'});
    }

    var cv=$('.hero canvas');if(!cv||reduce)return;
    var ctx=cv.getContext('2d'),W,H,pts=[],mx=-999,my=-999,run=true,dpr=Math.min(devicePixelRatio||1,2);
    function size(){var r=cv.getBoundingClientRect();W=r.width;H=r.height;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
      var n=Math.round(Math.min(90,W*H/14000));pts=[];for(var i=0;i<n;i++)pts.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.25,vy:(Math.random()-.5)*.25,r:Math.random()*1.6+.6})}
    size();addEventListener('resize',size);
    cv.parentNode.addEventListener('mousemove',function(e){var r=cv.getBoundingClientRect();mx=e.clientX-r.left;my=e.clientY-r.top});
    cv.parentNode.addEventListener('mouseleave',function(){mx=my=-999});
    if('IntersectionObserver' in window)new IntersectionObserver(function(e){run=e[0].isIntersecting;if(run)loop()}).observe(cv);
    function loop(){
      if(!run)return;var c=SITE.colors();ctx.clearRect(0,0,W,H);
      for(var i=0;i<pts.length;i++){
        var p=pts[i];p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1;
        var dx=p.x-mx,dy=p.y-my,d=Math.sqrt(dx*dx+dy*dy);if(d<110){p.x+=dx/d*1.2;p.y+=dy/d*1.2}
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.283);ctx.fillStyle=c.accent;ctx.globalAlpha=.7;ctx.fill();
        for(var j=i+1;j<pts.length;j++){var q=pts[j],ex=p.x-q.x,ey=p.y-q.y,dd=ex*ex+ey*ey;
          if(dd<9000){ctx.globalAlpha=(1-dd/9000)*.35;ctx.strokeStyle=c.blue;ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke()}}
      }
      ctx.globalAlpha=1;requestAnimationFrame(loop);
    }
    loop();
  }

  /* ---------- SVG line draw ---------- */
  function initDraw(){
    var els=$$('[data-draw]');if(!els.length||!A||reduce||!A.svg)return;
    els.forEach(function(g){
      var paths=$$('path.e,path.rb',g);
      try{var d=A.svg.createDrawable(paths);paths.forEach(function(p){p.style.opacity=1});
        if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){if(es[0].isIntersecting){A.animate(d,{draw:['0 0','0 1'],duration:1800,delay:A.stagger(110),ease:'inOutSine'});io.disconnect()}},{threshold:.25});io.observe(g)}
      }catch(e){}
    });
  }

  /* ---------- Radar explorer ---------- */
  /* cfg: {el, axes:[str], max:100, series:[{id,name,color,values:[..], title, sub, kv:[[val,label]], read}], panel: el} */
  window.Radar=function(cfg){
    var NS='http://www.w3.org/2000/svg',n=cfg.axes.length,R=150,C=200,sel=null;
    var host=cfg.el;host.innerHTML='';
    var svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox','-30 -14 460 428');svg.setAttribute('class','radar');svg.setAttribute('role','img');svg.setAttribute('aria-label',cfg.label||'Radar chart');
    function pt(i,v){var a=-Math.PI/2+i*2*Math.PI/n;return[C+Math.cos(a)*R*v/100,C+Math.sin(a)*R*v/100]}
    function el(t,a,p){var e=document.createElementNS(NS,t);for(var k in a)e.setAttribute(k,a[k]);(p||svg).appendChild(e);return e}
    var g=el('g',{});
    [25,50,75,100].forEach(function(v){var s=cfg.axes.map(function(_,i){return pt(i,v).join(',')}).join(' ');el('polygon',{points:s,class:'ring'},g)});
    cfg.axes.forEach(function(a,i){var p=pt(i,100);el('line',{x1:C,y1:C,x2:p[0],y2:p[1],class:'axis'},g);
      var q=pt(i,118),t=el('text',{x:q[0],y:q[1],class:'alab','text-anchor':Math.abs(q[0]-C)<8?'middle':(q[0]>C?'start':'end'),'dominant-baseline':'middle'},g);t.textContent=a});
    var polys={},dots={};
    cfg.series.forEach(function(s,si){
      var pts=s.values.map(function(v,i){return pt(i,v).join(',')}).join(' ');
      var poly=el('polygon',{points:pts,class:'poly',fill:s.color,'fill-opacity':.16,stroke:s.color,'stroke-width':2,'stroke-linejoin':'round'},g);
      poly.setAttribute('tabindex',0);poly.setAttribute('role','button');poly.setAttribute('aria-label',s.name);
      polys[s.id]=poly;dots[s.id]=[];
      s.values.forEach(function(v,i){var p=pt(i,v),d=el('circle',{cx:p[0],cy:p[1],r:3.6,class:'dot',fill:s.color},g);dots[s.id].push(d);
        var tt=document.createElementNS(NS,'title');tt.textContent=s.name+' · '+cfg.axes[i]+': '+v;d.appendChild(tt)});
      poly.addEventListener('click',function(){select(s.id)});
      poly.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();select(s.id)}});
    });
    host.appendChild(svg);
    /* legend pills */
    var lg=document.createElement('div');lg.className='radar-legend';
    var pills={};
    cfg.series.forEach(function(s){var b=document.createElement('button');b.className='pill';b.type='button';b.innerHTML='<i style="background:'+s.color+'"></i>'+s.name;b.addEventListener('click',function(){select(s.id)});lg.appendChild(b);pills[s.id]=b});
    host.appendChild(lg);
    var hint=document.createElement('div');hint.className='hint';hint.textContent='Click a shape or a label to zoom in. Click again to reset.';host.appendChild(hint);

    function render(s){
      var p=cfg.panel;if(!p)return;
      if(!s){p.innerHTML=cfg.intro||'';return}
      p.innerHTML='<div class="eyebrow">'+(cfg.kicker||'Overview')+'</div><h3>'+s.title+'</h3><div class="sub">'+s.sub+'</div><div class="kv">'+s.kv.map(function(k){return'<div><b>'+k[0]+'</b><span>'+k[1]+'</span></div>'}).join('')+'</div><p class="read">'+s.read+'</p>';
      if(A&&!reduce)A.animate(p.children,{opacity:[0,1],translateX:[18,0],duration:500,delay:A.stagger(60),ease:'outCubic'});
    }
    function select(id){
      sel=(sel===id)?null:id;
      svg.classList.toggle('has-sel',!!sel);
      cfg.series.forEach(function(s){
        var on=sel===s.id;polys[s.id].classList.toggle('sel',on);dots[s.id].forEach(function(d){d.classList.toggle('sel',on)});pills[s.id].classList.toggle('on',on);
        polys[s.id].setAttribute('fill-opacity',on?.34:.16);polys[s.id].setAttribute('stroke-width',on?3:2);
      });
      /* zoom: animate the viewBox towards the chart (or back) */
      var from=svg.getAttribute('viewBox').split(' ').map(Number),to=sel?[-8,0,416,392]:[-30,-14,460,428];
      if(A&&!reduce){var o={a:from[0],b:from[1],c:from[2],d:from[3]};
        A.animate(o,{a:to[0],b:to[1],c:to[2],d:to[3],duration:700,ease:'inOutCubic',onUpdate:function(){svg.setAttribute('viewBox',[o.a,o.b,o.c,o.d].map(function(x){return x.toFixed(1)}).join(' '))}});
        if(sel)A.animate(polys[sel],{scale:[.82,1],duration:700,ease:'outBack',transformOrigin:C+'px '+C+'px'});
      }else svg.setAttribute('viewBox',to.join(' '));
      render(sel?cfg.series.filter(function(s){return s.id===sel})[0]:null);
    }
    svg.addEventListener('click',function(e){if(e.target===svg&&sel)select(sel)});
    render(null);
    return{select:select};
  };

  /* ---------- Boot ---------- */
  function boot(){
    root.classList.add('js');
    initHero();initReveal();initCounters();initDraw();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

/* ---------- Hero moment + scroll-synced motion (anime.js) ---------- */
(function(){
  var A=window.anime,reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  var h=document.querySelector('.hero h1');
  if(!h||!A||reduce)return;
  var words=h.textContent.trim().split(/\s+/);
  h.innerHTML=words.map(function(w){return '<span class="hw"><span>'+w+'</span></span>'}).join(' ');
  A.animate(h.querySelectorAll('.hw>span'),{translateY:['105%','0%'],duration:900,delay:A.stagger(70,{start:150}),ease:'outExpo'});
  try{
    var hero=document.querySelector('.hero');
    A.animate(h,{translateY:[0,-70],opacity:[1,.15],ease:'linear',autoplay:A.onScroll({target:hero,enter:'top top',leave:'bottom top',sync:true})});
    var r=document.querySelector('#radar');
    if(r)A.animate(r,{scale:[.9,1],opacity:[.35,1],ease:'linear',autoplay:A.onScroll({target:r,enter:'bottom top+=100%',leave:'center center',sync:true})});
  }catch(e){}
})();
