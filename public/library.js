/* ============ Anyturn — Library page logic ============ */
(function(){
  'use strict';

  /* ---- cover palettes (on-brand, muted watercolor tones) ---- */
  const P = {
    purple:['#5b4480','#3a2c58'], plum:['#6e4a7e','#4a3057'],
    teal:['#2f6275','#1f4654'],   blue:['#3d6494','#28456a'],
    forest:['#3f7050','#274a35'], terra:['#b5663e','#8a4a2c'],
    mauve:['#8a4a5e','#5e3340'],  ochre:['#c08334','#915f1f'],
    night:['#3a4a72','#222e4c']
  };

  /* ---- the library ---- */
  const BOOKS = [
    {t:"The Dragon Who Lost His Hat", a:"Lily", age:5, ch:4, cat:"Animals", c:P.purple},
    {t:"Luna and the Underground Cave", a:"Amara", age:8, ch:5, cat:"Adventure", c:P.teal},
    {t:"The Brave Little Fox", a:"Theo", age:6, ch:3, cat:"Animals", c:P.terra},
    {t:"A Whale Named Tuesday", a:"Noah", age:7, ch:2, cat:"Friendship", c:P.blue},
    {t:"The Lighthouse That Walked", a:"Lukas", age:9, ch:6, cat:"Adventure", c:P.night},
    {t:"Pip and the Paper Moon", a:"Eve", age:6, ch:3, cat:"Magic", c:P.plum},
    {t:"The Garden That Grew Backwards", a:"Sam", age:7, ch:4, cat:"Magic", c:P.forest},
    {t:"Grandpa's Pocket Full of Stars", a:"Mia", age:5, ch:3, cat:"Family", c:P.ochre},
    {t:"The Owl Who Was Afraid of the Dark", a:"Jonah", age:4, ch:2, cat:"Bedtime", c:P.night},
    {t:"Hattie and the Honey Thieves", a:"Rosa", age:7, ch:5, cat:"Animals", c:P.mauve},
    {t:"The Boy Who Bottled the Rain", a:"Idris", age:8, ch:4, cat:"Magic", c:P.teal},
    {t:"Two Penguins and a Promise", a:"Freya", age:6, ch:3, cat:"Friendship", c:P.blue},
    {t:"The Snail Who Raced the Wind", a:"Otis", age:5, ch:3, cat:"Animals", c:P.forest},
    {t:"Moonlit Map of Nowhere", a:"Aria", age:9, ch:6, cat:"Adventure", c:P.purple},
    {t:"The Quilt of Quiet Things", a:"Béa", age:4, ch:2, cat:"Bedtime", c:P.plum},
    {t:"Dad, the Dinosaur and Me", a:"Cole", age:6, ch:4, cat:"Family", c:P.terra}
  ];

  const CATS = ["All","Bedtime","Animals","Adventure","Magic","Friendship","Family"];

  /* ---- build chips ---- */
  const chipWrap = document.getElementById('lib-chips');
  let activeCat = "All", query = "";
  CATS.forEach((cat,i)=>{
    const b=document.createElement('button');
    b.className='lib-chip'+(i===0?' active':'');
    b.textContent=cat;
    b.addEventListener('click',()=>{
      activeCat=cat;
      chipWrap.querySelectorAll('.lib-chip').forEach(c=>c.classList.toggle('active',c===b));
      render();
    });
    chipWrap.appendChild(b);
  });

  /* ---- search ---- */
  const search=document.getElementById('lib-search-input');
  if(search) search.addEventListener('input',e=>{ query=e.target.value.trim().toLowerCase(); render(); });

  /* ---- render grid ---- */
  const grid=document.getElementById('lib-grid');
  const countEl=document.getElementById('lib-count');
  const emptyEl=document.getElementById('lib-empty');

  function cardHTML(b){
    return `<article class="bk" data-cat="${b.cat}">
      <div class="bk-cover" style="background:linear-gradient(158deg, ${b.c[0]} 0%, ${b.c[1]} 100%)">
        <img class="bk-star" src="/assets/img/star.png" alt="">
        <div>
          <h3>${b.t}</h3>
          <div class="bk-by">by ${b.a}, ${b.age}</div>
        </div>
      </div>
      <div class="bk-meta"><span class="bk-cat">${b.cat}</span><span class="dot"></span><span>${b.ch} chapters</span></div>
    </article>`;
  }

  const io=new IntersectionObserver((es)=>{
    es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  },{threshold:.12});

  function render(){
    const list=BOOKS.filter(b=>{
      const okCat = activeCat==="All" || b.cat===activeCat;
      const okQ = !query || b.t.toLowerCase().includes(query) || b.a.toLowerCase().includes(query);
      return okCat && okQ;
    });
    grid.innerHTML=list.map(cardHTML).join('');
    countEl.textContent = list.length + (list.length===1?" story":" stories");
    emptyEl.classList.toggle('show', list.length===0);
    grid.querySelectorAll('.bk').forEach((el,i)=>{ el.style.transitionDelay=(Math.min(i,8)*0.05)+'s'; io.observe(el); });
  }
  render();

  /* ---- sparkles (footer) ---- */
  const sparkSVG='<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 0c.7 6.3 4 9.6 12 12-8 2.4-11.3 5.7-12 12-.7-6.3-4-9.6-12-12 8-2.4 11.3-5.7 12-12Z" fill="currentColor"/></svg>';
  document.querySelectorAll('.sparkle-layer').forEach(layer=>{
    const n=+layer.dataset.sparkles||8;
    layer.style.cssText='position:absolute;inset:0;z-index:1;pointer-events:none;';
    for(let i=0;i<n;i++){
      const s=document.createElement('div');
      s.style.cssText='position:absolute;color:rgba(214,200,150,.55);animation:twinkle 4s ease-in-out infinite;';
      s.style.left=(5+Math.random()*90)+'%'; s.style.top=(8+Math.random()*84)+'%';
      s.style.animationDelay=(Math.random()*4)+'s';
      s.style.transform='scale('+(0.7+Math.random()*0.8)+')';
      s.innerHTML=sparkSVG;
      layer.appendChild(s);
    }
  });
})();
