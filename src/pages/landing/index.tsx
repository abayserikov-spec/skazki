import { useEffect, useRef } from "react";
import "./index.css";

// New Anyturn landing (from the Claude Design handoff). The markup is the
// designed page verbatim; interactions are ported from the design's anyturn.js
// into a single scoped effect. CTAs are wired into the app flow:
//   primary "start" CTAs -> /app/register, "I already have an account" -> /app/login
const REGISTER_URL = "/app/register";
const LOGIN_URL = "/app/login";
const LIBRARY_URL = "/library";

// Enable reveal animations as early as the module loads (mirrors the design's
// inline <script> in <head>) so there is no first-paint flash.
if (typeof document !== "undefined") {
  document.documentElement.classList.add("ranim");
}

const MARKUP = `
<!-- ============ STICKY HEADER ============ -->
<header class="nav" id="nav">
  <div class="nav-inner">
    <a href="/" class="logo nav-logo">
      <img class="logo-mark" src="/assets/img/logo.png" alt="">
      <span>anyturn</span>
    </a>
    <a href="${REGISTER_URL}" class="btn nav-cta">Get Started</a>
  </div>
</header>

<!-- ============ HERO ============ -->
<section class="hero-frame" data-screen-label="Hero">
  <div class="hero">
    <div class="hero-clouds"></div>
    <img class="hero-mascot" src="/assets/img/hero-mascot.png" alt="A storybook full of animal characters with a mother and child">
    <div class="hero-inner">
      <a href="/" class="logo hero-logo">
        <img class="logo-mark" src="/assets/img/logo.png" alt="">
        <span>anyturn</span>
      </a>
      <h1 class="hero-h1">A Book You Make<br>Together With<br>Your Child <span class="hero-accent" id="hero-type"></span><span class="cursor" id="hero-cursor"></span></h1>
      <p class="hero-sub">They imagine the hero. They decide what happens next.<br>The pages come to life in front of you - words, pictures,<br>plot twists and all.</p>
      <div class="hero-cta">
        <a href="${REGISTER_URL}" class="btn btn-primary">Start Your First Story For Free</a>
        <a href="${LOGIN_URL}" class="btn btn-ghost">I Already Have An Account</a>
      </div>
    </div>
  </div>
</section>

<!-- ============ dark socproof ============ -->
<section class="band-dark" data-screen-label="Social proof">
  <div class="sparkle-layer" data-sparkles="8" data-nolines="1"></div>
  <div class="soc reveal">
    <div class="soc-eyebrow">Loved by 1100+ families</div>
    <div class="stars"><img src="/assets/img/star.png" alt=""><img src="/assets/img/star.png" alt=""><img src="/assets/img/star.png" alt=""><img src="/assets/img/star.png" alt=""><img src="/assets/img/star.png" alt=""></div>
    <blockquote class="soc-quote">“My daughter asks for 'our story' every single night now.<br>It's become our favorite bedtime ritual.”</blockquote>
    <div class="soc-person">
      <img src="/assets/img/av-sarah.png" alt="Sarah">
      <span>Sarah, mum of two, London</span>
    </div>
  </div>
</section>

<!-- ============ ONE STEP + STEPS ============ -->
<section class="steps" data-screen-label="How it works">
  <div class="steps-head reveal">
    <img class="steps-cloud" src="/assets/img/cloud.png" alt="">
    <h2>One Step To Begin<br>Your Own Story</h2>
    <p>No setup, no rules, no right answer. Just sit down together and start.</p>
  </div>
  <div class="steps-wrap">

    <div class="step reveal">
      <div class="step-text">
        <h3 class="step-title"><span class="dc">C</span>hoose a story idea or create your own</h3>
        <p class="step-body">Choose from a few starters or invent your own — a brave fox, a shy dragon, your child's favourite stuffed bear. Whoever they fancy tonight.</p>
      </div>
      <div class="step-media reveal pop">
        <div class="ph ph-tall">
          <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2.5" stroke="currentColor" stroke-width="1.5"/><path d="M3 15l4.5-4 3.5 3 4-5 6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="9" r="1.6" stroke="currentColor" stroke-width="1.5"/></svg>
          <span>Story idea picker</span>
          <em>Product preview coming soon</em>
        </div>
      </div>
    </div>

    <div class="step flip reveal">
      <div class="step-text">
        <h3 class="step-title"><span class="dc">Y</span>our child decides what happens next</h3>
        <p class="step-body">They tell you, you type. The story unfolds with pictures and plot twists — surprising even you. No script, no right answer, no homework.</p>
      </div>
      <div class="step-media reveal pop">
        <div class="ph ph-wide">
          <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2.5" stroke="currentColor" stroke-width="1.5"/><path d="M3 15l4.5-4 3.5 3 4-5 6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="9" r="1.6" stroke="currentColor" stroke-width="1.5"/></svg>
          <span>Illustrated story page</span>
          <em>Product preview coming soon</em>
        </div>
      </div>
    </div>

    <div class="step reveal">
      <div class="step-text">
        <h3 class="step-title"><span class="dc">S</span>ave it. Read it again. Carry on tomorrow.</h3>
        <p class="step-body">Every story lives in your library. Loved last night's adventure? Open it again — or pick up where you left off and write the next chapter.</p>
      </div>
      <div class="step-media reveal pop">
        <div class="ph ph-wide">
          <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="7" height="16" rx="1.5" stroke="currentColor" stroke-width="1.5"/><rect x="14" y="4" width="7" height="16" rx="1.5" stroke="currentColor" stroke-width="1.5"/></svg>
          <span>Your story library</span>
          <em>Product preview coming soon</em>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ============ READY CTA ============ -->
<section class="ready" data-screen-label="Ready CTA">
  <div class="sparkle-layer" data-sparkles="16" data-white="1" data-nolines="1"></div>
  <h2 class="reveal">Now You Are Ready To Start<br>Your First Interactive<br><span class="accent" id="ready-type"></span><span class="cursor" style="background:#3c4a63"></span></h2>
  <a href="${REGISTER_URL}" class="btn btn-primary reveal d1">Start Your First Free Journey <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 12h15M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
</section>

<!-- ============ ONCE UPON (purple band) ============ -->
<section class="once" data-screen-label="Once upon">
  <div class="sparkle-layer" data-sparkles="6" data-nolines="1"></div>
  <div class="once-head reveal">
    <h2 class="once-title">Once Upon Their Time…</h2>
    <p class="once-sub">Every decision has a consequence. Just like real life,<br>but in a safe, magical world</p>
  </div>
  <div class="once-stage">
    <div class="book-spread reveal pop">
      <div class="book-page">
        <div class="ph ph-page">
          <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2.5" stroke="currentColor" stroke-width="1.5"/><path d="M3 15l4.5-4 3.5 3 4-5 6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="9" r="1.6" stroke="currentColor" stroke-width="1.5"/></svg>
          <span>Story illustration</span>
        </div>
      </div>
      <div class="book-page">
        <div class="ph ph-page">
          <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2.5" stroke="currentColor" stroke-width="1.5"/><path d="M3 15l4.5-4 3.5 3 4-5 6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="9" r="1.6" stroke="currentColor" stroke-width="1.5"/></svg>
          <span>Story illustration</span>
        </div>
      </div>
    </div>
    <div class="choice-panel">
      <div class="q">What to do<br>with a trapped little Woolfy?</div>
      <div class="choice-btns">
        <button class="btn-choice" data-choice="help">Help Wolfy</button>
        <button class="btn-choice" data-choice="leave">Leave Wolfy</button>
      </div>
    </div>
  </div>
</section>

<!-- ============ STORIES (cream) ============ -->
<section class="stories" data-screen-label="Stories">
  <div class="stories-head reveal">
    <h2 class="stories-title">Stories From Real Families</h2>
    <p class="stories-sub">Every one of these is a real book made by a real child.<br>No two are the same - that's rather the point</p>
  </div>
  <div class="stories-stage">
    <div class="feature-book reveal">
      <div class="fb-cover-wrap">
        <img class="fb-cover bob" src="/assets/img/cover-dragon.png" alt="The Dragon Who Lost His Hat">
      </div>
      <div class="fb-info">
        <div class="fb-chaps">4 chapters</div>
        <h3 class="fb-title">The Dragon Who<br>Lost His Hat</h3>
        <div class="fb-tags">
          <span class="fb-tag"><i></i>Created by&nbsp;<b class="fb-author">Lily</b></span>
          <span class="fb-tag"><i></i><span class="fb-age">5 years old</span></span>
        </div>
        <div class="fb-quote">"The dragon looked everywhere. Under the clouds, behind the moon, even inside a volcano…"</div>
      </div>
    </div>
    <div class="carousel reveal" id="carousel">
      <div class="ci"><img src="/assets/img/book-blue.png" alt=""></div>
      <div class="ci"><img src="/assets/img/book-blue.png" alt=""></div>
      <div class="ci active"><img src="/assets/img/book-blue.png" alt=""></div>
      <div class="ci"><img src="/assets/img/book-blue.png" alt=""></div>
      <div class="ci"><img src="/assets/img/book-blue.png" alt=""></div>
      <div class="ci"><img src="/assets/img/book-blue.png" alt=""></div>
      <div class="ci"><img src="/assets/img/book-blue.png" alt=""></div>
    </div>
    <div class="stories-cta">
      <a href="${LIBRARY_URL}" class="btn btn-primary">Check Out Other Books <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 12h15M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
    </div>
  </div>
  <div class="video reveal">
    <img src="/assets/img/video-thumb.png" alt="Family making a story together">
    <div class="play"></div>
  </div>
</section>

<!-- ============ WHY HEADER (own section) ============ -->
<section class="why-intro" data-screen-label="Why parents love it">
  <div class="why-head reveal">
    <img class="why-cloud" src="/assets/img/cloud.png" alt="">
    <h2 class="why-h2">Why Parents Love It</h2>
    <p class="why-sub">Made for the moments that matter</p>
  </div>
</section>

<!-- ============ WHY ROWS (own section, owns the menu) ============ -->
<section class="why" data-screen-label="Why rows">
  <div class="why-inner">
    <nav class="why-nav" id="why-nav">
      <div class="why-navlist">
        <a class="why-pill active" data-target="why-1">Every evening</a>
        <a class="why-pill" data-target="why-2">Remote parents</a>
        <a class="why-pill" data-target="why-3">On the go</a>
        <a class="why-pill" data-target="why-4">Useful screen time</a>
        <a class="why-pill" data-target="why-5">Decision-making</a>
      </div>
    </nav>
    <div class="why-rows">

      <div class="why-row" id="why-1">
        <div class="why-text reveal fromL">
          <h3 class="why-title"><span class="dc">B</span><span class="tx">edtime story -<br>your way to be<br>closer</span></h3>
          <p class="why-body">Choose the mood and length -then read one more chapter together before lights out.</p>
        </div>
        <div class="why-media reveal pop"><img class="bob" src="/assets/img/why-bedtime.png" alt="Mum and child reading at bedtime"></div>
      </div>

      <div class="why-row flip" id="why-2">
        <div class="why-text reveal fromR">
          <h3 class="why-title"><span class="dc">T</span><span class="tx">ogether even<br>when you're<br>apart</span></h3>
          <p class="why-body">Share your screen on a video call and create the next chapter together. Discover more about your child while spending real time together.</p>
          <p class="why-small">Phone calls that kids are asking for.</p>
        </div>
        <div class="why-media reveal pop"><img class="bob2" src="/assets/img/why-grandma.png" alt="Child on a video call with grandma"></div>
      </div>

      <div class="why-row" id="why-3">
        <div class="why-text reveal fromL">
          <h3 class="why-title"><span class="dc">T</span><span class="tx">urn waiting time and long<br>drives into something<br>meaningful</span></h3>
          <p class="why-body">Long car ride? Waiting at the doctor's? Quiet half-hour before tea? Open Anyturn, pick up where you left off, and reading ritual goes wherever you go.</p>
        </div>
        <div class="why-media reveal pop"><img class="bob3" src="/assets/img/why-carseat.png" alt="Dad and child reading in a car seat"></div>
      </div>

      <div class="why-row flip" id="why-4">
        <div class="why-text reveal fromR">
          <h3 class="why-title"><span class="dc">S</span><span class="tx">creen time<br>you won't<br>regret</span></h3>
          <p class="why-body">Sit next to each other in rainy afternoon and build a world. Laugh at what the dragon did next and decide together what happens on the next page.</p>
          <p class="why-small">Not another video to zone out to.</p>
        </div>
        <div class="why-media reveal pop"><img class="bob" src="/assets/img/why-picnic.png" alt="Family reading together on a picnic blanket"></div>
      </div>

      <div class="why-row" id="why-5">
        <div class="why-text reveal fromL">
          <h3 class="why-title"><span class="dc">H</span><span class="tx">elps to teach<br>about decision-<br>making</span></h3>
          <p class="why-body">Decisions shape the story. Every choice has consequences — in a world that's safe, but full of possibilities. Kindness, risk, and curiosity all lead to different paths.</p>
        </div>
        <div class="why-media reveal pop"><img class="bob2" src="/assets/img/why-grandpa.png" alt="Family with grandfather reading together"></div>
      </div>

    </div>
  </div>
</section>

<!-- ============ TESTIMONIALS ============ -->
<section class="testi" data-screen-label="Testimonials">
  <div class="testi-head reveal"><h2>What Families Say</h2></div>
  <div class="marquee" id="marquee">
    <div class="marquee-track" id="marquee-track">
      <div class="tcard" data-rating="5"><div class="stars"></div><q>My daughter asks for 'our story' every single night now. It's become our favourite bedtime ritual.</q><div class="tperson"><img src="/assets/img/av-sarah.png" alt=""><span>Sarah, Mum Of Two, London</span></div></div>
      <div class="tcard" data-rating="4.5"><div class="stars"></div><q>Finally screen time I don't feel guilty about. We make it together — he's thinking, deciding, creating.</q><div class="tperson"><img src="/assets/img/av-james.png" alt=""><span>James, Dad, Manchester</span></div></div>
      <div class="tcard" data-rating="5"><div class="stars"></div><q>I live 200 miles from my grandkids. We FaceTime and make stories together. She saves them all.</q><div class="tperson"><img src="/assets/img/av-margaret.png" alt=""><span>Margaret, Grandmother, Edinburgh</span></div></div>
      <div class="tcard" data-rating="5"><div class="stars"></div><q>No two nights are the same. My son invents the wildest worlds and I get to watch his imagination run.</q><div class="tperson"><img src="/assets/img/av-dark.png" alt=""><span>Priya, Mum, Bristol</span></div></div>
    </div>
  </div>
</section>

<!-- ============ FAQ ============ -->
<section class="faq" data-screen-label="FAQ">
  <div class="faq-head reveal">
    <img class="faq-cloud" src="/assets/img/cloud.png" alt="">
    <h2>FAQ</h2>
    <p>Everything you need to know to start your first story tonight.</p>
  </div>
  <div class="faq-list" id="faq-list"></div>
</section>

<!-- ============ FINAL CTA + FOOTER ============ -->
<section class="final" data-screen-label="Final CTA">
  <div class="final-band">
    <div class="valley"></div>
    <div class="sparkle-layer" data-sparkles="24" data-nolines="1"></div>
    <img class="final-crow bob" src="/assets/img/crow-mascot.png" alt="A little crow in star pyjamas holding a glowing storybook">
    <div class="final-inner">
      <h2 class="reveal">Tonight's<br>Bedtime Story Is Waiting</h2>
      <p class="reveal d1">Start your first story in under a minute.<br>No card, no pressure — just a chance to see what your child does with it.</p>
      <a href="${REGISTER_URL}" class="btn btn-primary reveal d2">Start Your First Story For Free <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 12h15M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
    </div>
    <footer class="site-footer">
      <div class="sparkle-layer" data-sparkles="10" data-nolines="1"></div>
      <a href="/" class="foot-logo">
        <svg viewBox="0 0 32 32" fill="none"><path d="M25 6C16 8 9 15 7 25c6-1 11-4 14-9" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><path d="M25 6c1 7-2 14-8 18M16 16l6-1M13 21l6-1" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/><path d="M7 25l-2 2" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></svg>
        <span>anyturn</span>
      </a>
      <nav class="foot-nav">
        <a href="#">Terms of service</a>
        <a href="#">Privacy policy</a>
        <a href="#">Safety</a>
        <a href="#">Contact</a>
      </nav>
      <div class="foot-copy">© 2026 Anyturn Ltd. Made with <span class="heart">♥</span> in London.</div>
    </footer>
  </div>
</section>
`;

export default function Landing() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const timers: number[] = [];
    const cleanups: Array<() => void> = [];

    document.documentElement.classList.add("ranim");

    /* ---- scroll reveal ---- */
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.16 },
    );
    root.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    cleanups.push(() => io.disconnect());

    /* ---- sticky header: slide in after hero ---- */
    const nav = root.querySelector<HTMLElement>("#nav");
    if (nav) {
      const onScroll = () => {
        if (window.scrollY > 620) nav.classList.add("show");
        else nav.classList.remove("show");
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      cleanups.push(() => window.removeEventListener("scroll", onScroll));
    }

    /* ---- typewriter ---- */
    function typewriter(
      el: HTMLElement,
      words: string[],
      opts: { speed?: number; hold?: number },
    ) {
      if (el.dataset.typing) return;
      el.dataset.typing = "1";
      let wi = 0,
        ci = 0,
        deleting = false;
      function tick() {
        const w = words[wi];
        if (!deleting) {
          el.textContent = w.slice(0, ++ci);
          if (ci === w.length) {
            deleting = true;
            timers.push(window.setTimeout(tick, opts.hold || 2200));
            return;
          }
        } else {
          el.textContent = w.slice(0, --ci);
          if (ci === 0) {
            deleting = false;
            wi = (wi + 1) % words.length;
          }
        }
        timers.push(window.setTimeout(tick, deleting ? 55 : opts.speed || 120));
      }
      tick();
    }
    const ht = root.querySelector<HTMLElement>("#hero-type");
    if (ht) typewriter(ht, ["Any Age", "Any Mood", "Any Night"], { speed: 130, hold: 2400 });
    const rt = root.querySelector<HTMLElement>("#ready-type");
    if (rt) typewriter(rt, ["Journey", "Adventure", "Story"], { speed: 130, hold: 2400 });

    /* ---- sparkles ---- */
    const sparkSVG =
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 0c.7 6.3 4 9.6 12 12-8 2.4-11.3 5.7-12 12-.7-6.3-4-9.6-12-12 8-2.4 11.3-5.7 12-12Z" fill="currentColor"/></svg>';
    root.querySelectorAll<HTMLElement>(".sparkle-layer").forEach((layer) => {
      if (layer.dataset.sparkled) return;
      layer.dataset.sparkled = "1";
      const n = +(layer.dataset.sparkles || 6);
      const light = layer.dataset.light === "1";
      const white = layer.dataset.white === "1";
      const noLines = layer.dataset.nolines === "1";
      layer.style.cssText = "position:absolute;inset:0;z-index:1;pointer-events:none;";
      for (let i = 0; i < n; i++) {
        const x = 6 + Math.random() * 88,
          y = 8 + Math.random() * 84;
        if (!noLines && Math.random() > 0.4) {
          const v = document.createElement("div");
          v.className = "vline";
          v.style.left = x + "%";
          v.style.top = y - 14 + "%";
          v.style.height = 10 + Math.random() * 16 + "%";
          if (light) v.style.backgroundImage = "linear-gradient(rgba(120,130,160,.18) 50%,transparent 0)";
          layer.appendChild(v);
        }
        const s = document.createElement("div");
        s.className = "sparkle";
        s.style.left = x + "%";
        s.style.top = y + "%";
        s.style.animationDelay = Math.random() * 4 + "s";
        const sc = 0.7 + Math.random() * 0.7;
        s.style.transform = "scale(" + sc + ")";
        if (light) s.style.color = "rgba(150,160,190,.5)";
        if (white) {
          s.style.color = "rgba(120,132,156,.55)";
          s.style.filter = "none";
          const ws = 1.0 + Math.random() * 0.8;
          s.style.transform = "scale(" + ws + ")";
        }
        s.innerHTML = sparkSVG;
        layer.appendChild(s);
      }
    });

    /* ---- stories carousel ---- */
    const carousel = root.querySelector<HTMLElement>("#carousel");
    if (carousel && !carousel.dataset.bound) {
      carousel.dataset.bound = "1";
      const books = [
        { cover: "/assets/img/book-blue.png", chaps: "3 chapters", title: "The Brave Little Fox", author: "Theo", age: "6 years old", quote: '"The fox crept past the sleeping owls, heart thumping, towards the silver door…"' },
        { cover: "/assets/img/book-blue.png", chaps: "5 chapters", title: "Luna And The<br>Underground Cave", author: "Amara", age: "8 years old", quote: '"Luna fell, and fell, and landed somewhere that glowed a soft and friendly green…"' },
        { cover: "/assets/img/cover-dragon.png", chaps: "4 chapters", title: "The Dragon Who<br>Lost His Hat", author: "Lily", age: "5 years old", quote: '"The dragon looked everywhere. Under the clouds, behind the moon, even inside a volcano…"' },
        { cover: "/assets/img/book-blue.png", chaps: "2 chapters", title: "A Whale Named<br>Tuesday", author: "Noah", age: "7 years old", quote: '"Tuesday the whale had never seen the stars. Tonight, he decided, that would change."' },
        { cover: "/assets/img/book-blue.png", chaps: "6 chapters", title: "The Lighthouse<br>That Walked", author: "Lukas", age: "9 years old", quote: "“‘I don’t want to just stand here anymore!’ Lukas the lighthouse boomed.”" },
        { cover: "/assets/img/book-blue.png", chaps: "3 chapters", title: "Pip And The<br>Paper Moon", author: "Eve", age: "6 years old", quote: '"Pip folded the moon into her pocket and tip-toed home before sunrise."' },
        { cover: "/assets/img/book-blue.png", chaps: "4 chapters", title: "The Garden That<br>Grew Backwards", author: "Sam", age: "7 years old", quote: '"Every flower Sam planted bloomed the day before he planted it. Curious indeed."' },
      ];
      let active = 2;
      const items = Array.from(carousel.querySelectorAll<HTMLElement>(".ci"));
      const cover = root.querySelector<HTMLImageElement>(".fb-cover");
      const elChaps = root.querySelector<HTMLElement>(".fb-chaps");
      const elTitle = root.querySelector<HTMLElement>(".fb-title");
      const elAuthor = root.querySelector<HTMLElement>(".fb-author");
      const elAge = root.querySelector<HTMLElement>(".fb-age");
      const elQuote = root.querySelector<HTMLElement>(".fb-quote");
      if (cover) cover.style.transition = "opacity .25s ease, transform .45s cubic-bezier(.34,1.56,.64,1)";
      const select = (i: number) => {
        if (i === active) return;
        active = i;
        items.forEach((c, ci) => c.classList.toggle("active", ci === i));
        const b = books[i];
        if (cover) cover.style.opacity = "0";
        timers.push(
          window.setTimeout(() => {
            if (cover) cover.src = b.cover;
            if (elChaps) elChaps.textContent = b.chaps;
            if (elTitle) elTitle.innerHTML = b.title;
            if (elAuthor) elAuthor.textContent = b.author;
            if (elAge) elAge.textContent = b.age;
            if (elQuote) elQuote.innerHTML = b.quote;
            if (cover) cover.style.opacity = "1";
          }, 200),
        );
      };
      items.forEach((c, i) => {
        c.style.cursor = "pointer";
        c.addEventListener("click", () => select(i));
      });
    }

    /* ---- once upon choice ---- */
    root.querySelectorAll<HTMLButtonElement>(".choice-btns button").forEach((b) => {
      if (b.dataset.bound) return;
      b.dataset.bound = "1";
      b.addEventListener("click", () => {
        const panel = b.closest<HTMLElement>(".choice-panel");
        if (!panel) return;
        const q = panel.querySelector<HTMLElement>(".q");
        const help = b.dataset.choice === "help";
        const btns = panel.querySelector<HTMLElement>(".choice-btns");
        if (btns) btns.style.opacity = "0";
        timers.push(
          window.setTimeout(() => {
            if (!q) return;
            q.style.transition = "opacity .5s";
            q.style.opacity = "0";
            timers.push(
              window.setTimeout(() => {
                q.innerHTML = help
                  ? "Wolfy is free! He bounds into the snow,<br>then turns back with a grateful, toothy grin."
                  : "You walk on. Behind you, a small howl<br>fades into the falling snow…";
                q.style.opacity = "1";
                const cb = panel.querySelector<HTMLElement>(".choice-btns");
                if (cb) {
                  cb.innerHTML = '<button class="btn-choice" id="rewind">↺ Try the other path</button>';
                  cb.style.opacity = "1";
                  const rw = cb.querySelector("#rewind");
                  if (rw) rw.addEventListener("click", () => location.reload());
                }
              }, 500),
            );
          }, 250),
        );
      });
    });

    /* ---- why sticky nav scroll-spy ---- */
    const whyNav = root.querySelector<HTMLElement>("#why-nav");
    if (whyNav) {
      const pills = Array.from(whyNav.querySelectorAll<HTMLElement>(".why-pill"));
      const rows = pills.map((p) => root.querySelector<HTMLElement>("#" + p.dataset.target));
      let lockUntil = 0;
      pills.forEach((p, i) =>
        p.addEventListener("click", (e) => {
          e.preventDefault();
          const target = rows[i];
          if (!target) return;
          lockUntil = performance.now() + 800;
          pills.forEach((q, qi) => q.classList.toggle("active", qi === i));
          target.scrollIntoView({ behavior: "smooth", block: "center" });
        }),
      );
      let ticking = false;
      const spy = () => {
        ticking = false;
        if (performance.now() < lockUntil) return;
        const mid = window.innerHeight / 2;
        let best = 0,
          bestDist = Infinity;
        rows.forEach((r, i) => {
          if (!r) return;
          const b = r.getBoundingClientRect();
          const c = b.top + b.height / 2;
          const d = Math.abs(c - mid);
          if (d < bestDist) {
            bestDist = d;
            best = i;
          }
        });
        pills.forEach((p, pi) => p.classList.toggle("active", pi === best));
      };
      const onWhyScroll = () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(spy);
        }
      };
      window.addEventListener("scroll", onWhyScroll, { passive: true });
      cleanups.push(() => window.removeEventListener("scroll", onWhyScroll));
      spy();
    }

    /* ---- FAQ ---- */
    const faqData = [
      { q: "Do I need the Internet?", a: "You need a connection to generate each new page, since the story and pictures are created live as you play. Once a chapter is saved it stays in your library to re-read anytime." },
      { q: "Is it safe for my child?", a: "Every story unfolds inside a safe, age-appropriate world. Content is filtered for kindness and wonder — no scary or unsuitable themes — and there is no chat with strangers, ever." },
      { q: "What ages is Anyturn for?", a: "Any age. Toddlers enjoy short picture-led tales you read aloud; older children love steering longer, twistier adventures themselves. The reading level adapts to your child." },
      { q: "How much does it cost?", a: "Your first story is completely free — no card required. After that, a simple monthly plan gives your family unlimited stories and a growing library to keep forever." },
      { q: "Can grandparents join in?", a: "Absolutely. Share your screen on a video call and build the next chapter together, however many miles apart. It is one of the most-loved ways families use Anyturn." },
    ];
    const faqList = root.querySelector<HTMLElement>("#faq-list");
    if (faqList && !faqList.children.length) {
      faqList.innerHTML = faqData
        .map(
          (f) =>
            `<div class="faq-item"><button class="faq-q"><h4>${f.q}</h4><img class="faq-ic" src="/assets/img/icon-plus.png" alt="expand"></button><div class="faq-a"><div class="faq-a-box"><span class="bullet"></span><p>${f.a}</p></div></div></div>`,
        )
        .join("");
      faqList.querySelectorAll<HTMLElement>(".faq-item").forEach((item) => {
        const ic = item.querySelector<HTMLImageElement>(".faq-ic");
        const qBtn = item.querySelector<HTMLElement>(".faq-q");
        if (!qBtn) return;
        qBtn.addEventListener("click", () => {
          const open = item.classList.contains("open");
          const a = item.querySelector<HTMLElement>(".faq-a");
          if (open) {
            item.classList.remove("open");
            if (a) a.style.maxHeight = "";
            if (ic) ic.src = "/assets/img/icon-plus.png";
          } else {
            item.classList.add("open");
            if (a) a.style.maxHeight = a.scrollHeight + "px";
            if (ic) ic.src = "/assets/img/icon-minus.png";
          }
        });
      });
    }

    /* ---- testimonials infinite carousel ---- */
    const mTrack = root.querySelector<HTMLElement>("#marquee-track");
    if (mTrack && !mTrack.dataset.cloned) {
      mTrack.dataset.cloned = "1";
      const starFull = '<img src="/assets/img/star.png" alt="">';
      const starHalf = '<img class="half" src="/assets/img/star.png" alt="">';
      mTrack.querySelectorAll<HTMLElement>(".tcard").forEach((card) => {
        const r = parseFloat(card.dataset.rating || "5") || 5;
        const full = Math.floor(r),
          half = r - full >= 0.5;
        let html = "";
        for (let i = 0; i < full; i++) html += starFull;
        if (half) html += starHalf;
        const stars = card.querySelector<HTMLElement>(".stars");
        if (stars) stars.innerHTML = html;
      });
      mTrack.innerHTML = mTrack.innerHTML + mTrack.innerHTML;
      const n = mTrack.querySelectorAll(".tcard").length;
      mTrack.style.animationDuration = n * 5.75 + "s";
    }

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return <div ref={ref} dangerouslySetInnerHTML={{ __html: MARKUP }} />;
}
