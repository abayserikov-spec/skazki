import { useState, useEffect, useRef, useCallback, useMemo } from "react";

/* ══════════════════════════════════════════════════════════
   ПОДЗЕМЕЛЬЕ — AI Мастер Игры v1
   Тёмная фэнтези палитра
   Auth → Dashboard → CharCreate → Session → Report
   ══════════════════════════════════════════════════════════ */

const ST = {
  async get(k){try{const v=localStorage.getItem("podz_"+k);return v?JSON.parse(v):null}catch{return null}},
  async set(k,v){try{localStorage.setItem("podz_"+k,JSON.stringify(v))}catch{}},
  async del(k){try{localStorage.removeItem("podz_"+k)}catch{}},
};

const FN = { d: "'Cormorant Garamond', Georgia, serif", b: "'Outfit', system-ui, sans-serif" };
const DARK = {
  bg:"#0D0B0E",bg2:"#15121A",bg3:"#1C1722",tx:"#E8E0F0",tx2:"#B8AACC",tx3:"#6E6080",
  accent:"#C06040",accentSoft:"#D88060",accentBg:"rgba(192,96,64,.12)",
  sage:"#5A9E6E",sageSoft:"#4B8E5E",sageBg:"rgba(90,158,110,.1)",
  gold:"#C4A45C",blush:"#8866AA",blushBg:"rgba(136,102,170,.1)",
  gb:"rgba(232,224,240,.1)",gl:"rgba(232,224,240,.04)",gl2:"rgba(232,224,240,.06)",
  card:"linear-gradient(160deg,#1A1620,#15121A,#0D0B0E)",shadow:"0 16px 50px rgba(0,0,0,.5)",
  storyTx:"#D8D0E0",ph:"#504060",selBg:"rgba(192,96,64,.15)"
};
const LIGHT = {
  bg:"#F5F0FA",bg2:"#EDE6F5",bg3:"#E5DCF0",tx:"#1A1025",tx2:"#3A2F48",tx3:"#6A5E78",
  accent:"#C06040",accentSoft:"#D88060",accentBg:"rgba(192,96,64,.08)",
  sage:"#5A9E6E",sageSoft:"#7AB88E",sageBg:"rgba(90,158,110,.08)",
  gold:"#C4A45C",blush:"#8866AA",blushBg:"rgba(136,102,170,.06)",
  gb:"rgba(26,16,37,.08)",gl:"rgba(26,16,37,.03)",gl2:"rgba(26,16,37,.05)",
  card:"linear-gradient(160deg,#FFFFFF,#FDFAFF,#F5F0FA)",shadow:"0 12px 40px rgba(26,16,37,.1)",
  storyTx:"#2A2035",ph:"#A898B8",selBg:"rgba(192,96,64,.08)"
};

const TOTAL_PAGES = 8;
const RACES = [
  {id:"human",n:"Человек",e:"🧑",d:"Универсальный и адаптивный"},
  {id:"elf",n:"Эльф",e:"🧝",d:"Ловкий и мудрый, долгожитель"},
  {id:"dwarf",n:"Дварф",e:"⛏️",d:"Крепкий, стойкий, мастер кузни"},
  {id:"halfling",n:"Полурослик",e:"🦶",d:"Маленький, удачливый"},
  {id:"orc",n:"Полуорк",e:"👹",d:"Мощный и свирепый воин"},
  {id:"tiefling",n:"Тифлинг",e:"😈",d:"Потомок демонов, тёмная магия"},
];
const CLASSES = [
  {id:"warrior",n:"Воин",e:"⚔️",d:"Мастер ближнего боя",stat:"str"},
  {id:"mage",n:"Маг",e:"🔮",d:"Повелитель стихий",stat:"int"},
  {id:"rogue",n:"Плут",e:"🗡️",d:"Мастер скрытности",stat:"dex"},
  {id:"cleric",n:"Жрец",e:"✝️",d:"Целитель и защитник",stat:"wis"},
  {id:"ranger",n:"Следопыт",e:"🏹",d:"Охотник и знаток природы",stat:"dex"},
  {id:"bard",n:"Бард",e:"🎵",d:"Чародей слова и обаяния",stat:"cha"},
];
const STATS = {
  str:{n:"Сила",e:"💪",c:"#C06040"},dex:{n:"Ловкость",e:"🏃",c:"#5AAE6E"},
  con:{n:"Стойкость",e:"🛡️",c:"#8A7E5E"},int:{n:"Интеллект",e:"🧠",c:"#6688CC"},
  wis:{n:"Мудрость",e:"👁️",c:"#AA88CC"},cha:{n:"Харизма",e:"✨",c:"#CC8844"},
};

function rollD20(){return Math.floor(Math.random()*20)+1}
function getMod(s){return Math.floor((s-10)/2)}


// ── AI: RPG Page Generation ──
async function genPage(ctx, apiKey) {
  const { charName, race, cls, stats, history, choice, diceRoll, charDesc, premise } = ctx;
  const pn = history.length + 1, isEnd = pn >= TOTAL_PAGES;
  const hist = history.map((h,i) => "P"+(i+1)+": "+h.text+(h.choice ? " [chose: "+h.choice.label+", d20="+(h.choice.roll||"?")+"]" : "")).join("\n");
  const raceInfo = RACES.find(r => r.id === race);
  const clsInfo = CLASSES.find(c => c.id === cls);
  const statsStr = Object.entries(stats).map(([k,v]) => STATS[k].n+":"+v+"("+(getMod(v)>=0?"+":"")+getMod(v)+")").join(", ");
  const charBlock = charDesc
    ? "\n- Персонаж установлен: " + charDesc + ". Сохраняй внешность."
    : "\n- ПЕРВАЯ СТРАНИЦА: Верни \"characterDesc\" с АНГЛИЙСКИМ описанием внешности. Пример: \"a tall human warrior with warm brown eyes, short dark hair, friendly confident smile, well-worn but clean chainmail armor, brown leather belt with sword, strong build, slight stubble on chin\". Описывай с характером но не мрачно — тёплые цвета, живые черты лица.";
  const charDescJson = !charDesc ? ',"characterDesc":"...english visual description..."' : '';
  const endInstr = isEnd ? "ПОСЛЕДНЯЯ СТРАНИЦА. Подведи итог. Храбрость=победа. Трусость=поражение. Микс=горько-сладкий." : "";
  const choicesOrEnd = isEnd ? '"isEnd":true,"ending":"victory|mixed|defeat"' : '"choices":[{"label":"...","emoji":"...","stat":"str|dex|con|int|wis|cha","dc":number}]';
  const choicesInstr = isEnd ? endInstr : "Дай 2-3 действия привязанных к stat и dc(8-18). Пример: выбить дверь(str,dc:12), подкрасться(dex,dc:14).";
  let diceInstr = "";
  if (choice && diceRoll) {
    const mod = getMod(stats[choice.stat]||10);
    const total = diceRoll + mod;
    const success = total >= (choice.dc||10);
    diceInstr = "\nБросок d20="+diceRoll+", мод="+(mod>=0?"+":"")+mod+", итого="+total+". "+(success?"УСПЕХ!":"ПРОВАЛ!")+(diceRoll===20?" КРИТ!":diceRoll===1?" КРИТ ПРОВАЛ!":"");
  }

  const sys = `Ты — Мастер Игры ведущий RPG на русском. Стиль: тёмное фэнтези с юмором, как Подземелья Чикен Карри.
Правила:
- Персонаж: ${charName}, ${raceInfo?.n} ${clsInfo?.n}. Хар-ки: ${statsStr}${charBlock}
- Предыстория: ${premise || "Таинственное приключение"}
- Стр ${pn}/${TOTAL_PAGES}. 3-5 предложений. Живой язык. NPC, опасности, юмор.
- ${choicesInstr}${diceInstr}
- "scene": Описание сцены на АНГЛИЙСКОМ. ОБЯЗАТЕЛЬНО описывай КОМИЧНЫЕ выражения лиц каждого персонажа — выпученные глаза, отвисшая челюсть, хитрая ухмылка, панический ужас, самодовольная гримаса. Каждый персонаж РЕАГИРУЕТ эмоционально и смешно. Тёплое золотистое освещение, уютная фэнтези атмосфера.
- "mood": "dungeon"|"forest"|"castle"|"tavern"|"battle"|"magic"|"mountain"|"ruins"|"city"|"ocean"
JSON:
{"text":"...","mood":"...","scene":"..."${charDescJson},${choicesOrEnd},"title":"название главы","sfx":"english ambient 5-10 words","tts_text":"текст с паузами для озвучки"}`;

  const msg = history.length === 0
    ? `Начни приключение для ${charName} (${raceInfo?.n} ${clsInfo?.n}). Предыстория: ${premise||"Герой прибывает в таинственный город"}. Захватывающая сцена!`
    : hist+"\n\n"+(diceInstr||"Продолжай.")+"\nПродолжай историю.";

  const headers = { "Content-Type":"application/json", "anthropic-version":"2023-06-01" };
  if (apiKey) { headers["x-api-key"] = apiKey; headers["anthropic-dangerous-direct-browser-access"] = "true"; }
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST", headers,
    body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1500, system:sys, messages:[{role:"user",content:msg}] })
  });
  const data = await res.json();
  const txt = data.content?.map(b => b.type === "text" ? b.text : "").join("") || "";
  return JSON.parse(txt.replace(/```json|```/g, "").trim());
}

// Style now defined by ПЧК reference image, no text style needed

async function pollPrediction(token, prediction) {
  if (!prediction || prediction.error) return null;
  if (prediction.status === "succeeded" && prediction.output) { const o = prediction.output; return typeof o === "string" ? o : Array.isArray(o) ? o[0] : o; }
  if (prediction.status === "failed" || !prediction.id) return null;
  const pollUrl = `/api/replicate/v1/predictions/${prediction.id}`;
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 1500));
    const res = await fetch(pollUrl, { headers: { "Authorization": `Bearer ${token}` } });
    const p = await res.json();
    if (p.status === "succeeded") { const o = p.output; return typeof o === "string" ? o : Array.isArray(o) ? o[0] : o; }
    if (p.status === "failed") return null;
  }
  return null;
}

// Style reference URL — ПЧК art style
const STYLE_REF_PATH = "/style-ref.png";

async function genFirstImage(token, scene, charDesc) {
  if (!token) return null;
  const styleRefUrl = window.location.origin + STYLE_REF_PATH;
  try {
    const res = await fetch("/api/replicate/v1/models/black-forest-labs/flux-kontext-pro/predictions", {
      method:"POST", headers:{"Authorization":`Bearer ${token}`,"Content-Type":"application/json","Prefer":"wait=60"},
      body: JSON.stringify({input:{prompt:`Draw a COMPLETELY NEW SCENE in the EXACT SAME ART STYLE as the reference image. Match the reference art style precisely: same ink line quality, same coloring technique, same level of detail, same warm tones. NEW SCENE: ${scene}. The NEW main character is ${charDesc}. Expressive comedic faces, warm lighting. Do NOT copy the reference scene — only copy the ART STYLE. No text in image.`,input_image:styleRefUrl,aspect_ratio:"16:9",output_format:"webp",safety_tolerance:5}})
    });
    return await pollPrediction(token, await res.json());
  } catch { return null; }
}

async function genNextImage(token, scene, charDesc, refUrl) {
  if (!token || !refUrl) return null;
  try {
    const res = await fetch("/api/replicate/v1/models/black-forest-labs/flux-kontext-pro/predictions", {
      method:"POST", headers:{"Authorization":`Bearer ${token}`,"Content-Type":"application/json","Prefer":"wait=60"},
      body: JSON.stringify({input:{prompt:`Keep the EXACT SAME ART STYLE as the reference image — same ink lines, same coloring, same warm tones. NEW SCENE: ${scene}. Main character from reference (${charDesc}) must appear with identical design. Expressive comedic faces, warm golden lighting. No text.`,input_image:refUrl,aspect_ratio:"16:9",output_format:"png",safety_tolerance:5}})
    });
    return await pollPrediction(token, await res.json());
  } catch { return null; }
}

function Typewriter({ text, speed = 28, onDone, style }) {
  const [shown, setShown] = useState(0);
  const [done, setDone] = useState(false);
  useEffect(() => { setShown(0); setDone(false); if (!text) return; let i=0; const iv=setInterval(()=>{i++;if(i>=text.length){clearInterval(iv);setDone(true);onDone?.();}setShown(i);},speed); return()=>clearInterval(iv); }, [text,speed]);
  const skip = () => { setShown(text?.length||0); setDone(true); onDone?.(); };
  return <div style={{position:"relative",cursor:done?"default":"pointer"}} onClick={!done?skip:undefined}>
    <span style={style}>{text?.slice(0,shown)}</span>
    {!done && <span style={{...style,opacity:0}}>{text?.slice(shown)}</span>}
    {!done && <span style={{display:"inline-block",width:2,height:"1em",background:"#C06040",marginLeft:2,animation:"blink 1s step-end infinite",verticalAlign:"text-bottom"}}/>}
  </div>;
}

function SceneIllustration({ imgUrl, mood, loading: isLoading }) {
  const COLORS = {dungeon:"#1A1020",forest:"#0A1A10",castle:"#1A1525",tavern:"#1A1510",battle:"#1A0A0A",magic:"#0D0A1A",mountain:"#12141A",ruins:"#14120E",city:"#10101A",ocean:"#0A1520"};
  const EMOJI = {dungeon:"⚔️",forest:"🌲",castle:"🏰",tavern:"🍺",battle:"💀",magic:"🔮",mountain:"⛰️",ruins:"🏚️",city:"🌃",ocean:"🌊"};
  return <div style={{position:"relative",width:"100%",aspectRatio:"16/9",background:COLORS[mood]||"#1A1020",overflow:"hidden"}}>
    {imgUrl ? <>
      <img src={imgUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover",animation:"kenburns 25s ease-in-out infinite alternate",display:"block"}}/>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at center,transparent 50%,rgba(0,0,0,.5))",pointerEvents:"none"}}/>
    </> : <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8}}>
      {isLoading ? <>
        <div style={{width:28,height:28,border:"2px solid rgba(192,96,64,.3)",borderTopColor:"#C06040",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
        <span style={{fontSize:".72rem",color:"rgba(255,255,255,.4)"}}>Генерация…</span>
      </> : <><span style={{fontSize:"1.5rem"}}>{EMOJI[mood]||"⚔️"}</span><span style={{fontSize:".7rem",color:"rgba(255,255,255,.35)"}}>Нет API ключа Replicate</span></>}
    </div>}
  </div>;
}

function DiceRoll({ result, onDone }) {
  const [rolling, setRolling] = useState(true);
  const [display, setDisplay] = useState(1);
  useEffect(() => { let i=0; const iv=setInterval(()=>{setDisplay(Math.floor(Math.random()*20)+1);i++;if(i>15){clearInterval(iv);setDisplay(result);setRolling(false);setTimeout(()=>onDone?.(),1200);}},80); return()=>clearInterval(iv); }, [result]);
  const isCrit=result===20, isFail=result===1;
  return <div style={{textAlign:"center",padding:"24px 0",animation:"fu .3s ease-out"}}>
    <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:80,height:80,borderRadius:16,fontSize:"2rem",fontWeight:800,fontFamily:"monospace",
      background:rolling?"rgba(192,96,64,.15)":isCrit?"rgba(90,158,110,.2)":isFail?"rgba(196,60,60,.2)":"rgba(192,96,64,.1)",
      border:`3px solid ${rolling?"#C06040":isCrit?"#5A9E6E":isFail?"#C43C3C":"#C06040"}`,
      color:rolling?"#C06040":isCrit?"#5A9E6E":isFail?"#C43C3C":"#E8E0F0",
      animation:rolling?"spin .3s linear infinite":isCrit?"pulse 1s":"fu .3s",
      transition:"all .3s",boxShadow:isCrit?"0 0 30px rgba(90,158,110,.4)":isFail?"0 0 30px rgba(196,60,60,.3)":"none"
    }}>{display}</div>
    {!rolling && <div style={{marginTop:10,fontSize:".82rem",fontWeight:700,color:isCrit?"#5A9E6E":isFail?"#C43C3C":"#B8AACC"}}>
      {isCrit?"🎉 НАТ 20! Критический успех!":isFail?"💀 НАТ 1! Критический провал!":`Бросок: ${result}`}
    </div>}
  </div>;
}

function PageProgress({current,total,t}) {
  return <div style={{display:"flex",gap:4,alignItems:"center"}}>
    {Array.from({length:total},(_,i)=><div key={i} style={{width:i<current?8:6,height:i<current?8:6,borderRadius:"50%",background:i<current?"#C06040":t.gb,transition:"all .3s",boxShadow:i===current-1?"0 0 8px rgba(192,96,64,.5)":"none"}}/>)}
    <span style={{fontSize:".6rem",color:t.tx3,marginLeft:4}}>{current}/{total}</span>
  </div>;
}

function ThemeSwitch({dark,onToggle}) {
  return <button onClick={onToggle} style={{background:"rgba(192,96,64,.08)",border:"1px solid rgba(192,96,64,.15)",padding:"6px 10px",borderRadius:16,cursor:"pointer",fontSize:".7rem",color:"#B8AACC"}}>{dark?"☀️":"🌙"}</button>;
}

// ═══ MAIN APP ═══
export default function App() {
  const [view, setView] = useState("loading");
  const [dark, setDark] = useState(true);
  const [user, setUser] = useState(null);
  const [authName, setAuthName] = useState("");
  const [sessions, setSessions] = useState([]);
  const [repToken, setRepToken] = useState("");
  const [antKey, setAntKey] = useState("");
  const [elKey, setElKey] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [charName, setCharName] = useState("");
  const [charRace, setCharRace] = useState(null);
  const [charClass, setCharClass] = useState(null);
  const [charStats, setCharStats] = useState({str:10,dex:10,con:10,int:10,wis:10,cha:10});
  const [premise, setPremise] = useState("");
  const [presets, setPresets] = useState([]);
  const [presetsLoading, setPresetsLoading] = useState(false);
  const [pages, setPages] = useState([]);
  const [curPage, setCurPage] = useState(null);
  const [curImg, setCurImg] = useState(null);
  const [imgLoading, setImgLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sel, setSel] = useState(null);
  const [picks, setPicks] = useState([]);
  const [diceResults, setDiceResults] = useState([]);
  const [showDice, setShowDice] = useState(false);
  const [curDice, setCurDice] = useState(null);
  const [t0, setT0] = useState(null);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);
  const [customInput, setCustomInput] = useState("");
  const [textDone, setTextDone] = useState(false);
  const storyScrollRef = useRef(null);
  const audioRef = useRef(null);
  const [charDesc, setCharDesc] = useState(null);
  const [refImgUrl, setRefImgUrl] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [ttsVoice, setTtsVoice] = useState(null);
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const sfxRef = useRef(null);
  const [sfxLoading, setSfxLoading] = useState(false);
  const sfxCacheRef = useRef(new Map());
  const [elVoiceId, setElVoiceId] = useState("EXAVITQu4vr4xnSDxMaL");
  const [elVoiceName, setElVoiceName] = useState("Sarah");
  const [elVoices, setElVoices] = useState([]);
  const [voicesLoading, setVoicesLoading] = useState(false);
  const ttsCacheRef = useRef(new Map());

  const t = dark ? DARK : LIGHT;
  const toggleTheme = async () => { const n=!dark; setDark(n); await ST.set("dark",n); };
  const fmtT = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;

  useEffect(() => { (async () => {
    const u=await ST.get("user"); const dk=await ST.get("dark"); const rt=await ST.get("repToken"); const ak=await ST.get("antKey"); const ek=await ST.get("elKey");
    if(dk!==null)setDark(dk); if(rt)setRepToken(rt); if(ak)setAntKey(ak); if(ek)setElKey(ek);
    const vid=await ST.get("elVoiceId"); if(vid)setElVoiceId(vid);
    const vn=await ST.get("elVoiceName"); if(vn)setElVoiceName(vn);
    if(u){setUser(u);setSessions(await ST.get("sessions")||[]);setView("dashboard");} else setView("auth");
  })(); }, []);

  useEffect(() => { if(view==="session"&&t0){timerRef.current=setInterval(()=>setTimer(Math.floor((Date.now()-t0)/1000)),1000);return()=>clearInterval(timerRef.current);} return()=>{}; }, [view,t0]);

  useEffect(() => { const pv=()=>{const v=window.speechSynthesis?.getVoices()||[];const ru=v.filter(v=>v.lang.startsWith("ru"));const b=ru.find(v=>/milena|alena|yandex/i.test(v.name))||ru[0];if(b)setTtsVoice(b);}; pv(); window.speechSynthesis?.addEventListener("voiceschanged",pv); return()=>window.speechSynthesis?.removeEventListener("voiceschanged",pv); }, []);

  const speakText = useCallback(async (text) => {
    if(!text)return; window.speechSynthesis?.cancel(); if(audioRef.current){audioRef.current.pause();audioRef.current=null;}
    if(elKey){setSpeaking(true);try{const ck=elVoiceId+":"+text;let url=ttsCacheRef.current.get(ck);
      if(!url){const r=await fetch(`/api/elevenlabs/v1/text-to-speech/${elVoiceId}`,{method:"POST",headers:{"xi-api-key":elKey,"Content-Type":"application/json"},body:JSON.stringify({text,model_id:"eleven_flash_v2_5",voice_settings:{stability:.5,similarity_boost:.75,style:.4}})});
      if(!r.ok)throw new Error(r.status);url=URL.createObjectURL(await r.blob());ttsCacheRef.current.set(ck,url);}
      const a=new Audio(url);audioRef.current=a;a.onended=()=>{setSpeaking(false);audioRef.current=null;};a.onerror=()=>{setSpeaking(false);audioRef.current=null;};a.play();return;}catch{setSpeaking(false);}}
    if(!window.speechSynthesis)return;const u=new SpeechSynthesisUtterance(text);u.lang="ru-RU";u.rate=.9;u.pitch=.95;if(ttsVoice)u.voice=ttsVoice;u.onstart=()=>setSpeaking(true);u.onend=()=>setSpeaking(false);window.speechSynthesis.speak(u);
  }, [ttsVoice,elKey,elVoiceId]);

  const stopSpeak = useCallback(() => { window.speechSynthesis?.cancel(); if(audioRef.current){audioRef.current.pause();audioRef.current=null;} setSpeaking(false); }, []);

  const playSfx = useCallback(async (sfxPrompt) => {
    if(!elKey||!sfxPrompt||!sfxEnabled)return; if(sfxRef.current){sfxRef.current.pause();sfxRef.current=null;} setSfxLoading(true);
    try{let url=sfxCacheRef.current.get(sfxPrompt);
    if(!url){const r=await fetch("/api/elevenlabs/v1/sound-generation",{method:"POST",headers:{"xi-api-key":elKey,"Content-Type":"application/json"},body:JSON.stringify({text:sfxPrompt+", ambient background, loopable",duration_seconds:10,prompt_influence:.5})});
    if(!r.ok)throw new Error(r.status);url=URL.createObjectURL(await r.blob());sfxCacheRef.current.set(sfxPrompt,url);}
    const a=new Audio(url);a.loop=true;a.volume=0;sfxRef.current=a;a.play();let v=0;const fi=setInterval(()=>{v=Math.min(v+.02,.25);a.volume=v;if(v>=.25)clearInterval(fi);},50);setSfxLoading(false);}catch{setSfxLoading(false);}
  }, [elKey,sfxEnabled]);

  const stopSfx = useCallback(() => { if(!sfxRef.current)return;const a=sfxRef.current;let v=a.volume;const fo=setInterval(()=>{v=Math.max(v-.02,0);a.volume=v;if(v<=0){clearInterval(fo);a.pause();sfxRef.current=null;}},50); }, []);

  useEffect(() => { if(curPage?.sfx&&elKey&&sfxEnabled)playSfx(curPage.sfx); }, [curPage?.sfx]);
  useEffect(() => { if(textDone&&ttsEnabled&&curPage?.text)speakText(curPage.tts_text||curPage.text); }, [textDone,ttsEnabled]);
  useEffect(() => { stopSpeak();stopSfx(); }, [curPage]);
  useEffect(() => { if(curPage&&storyScrollRef.current)storyScrollRef.current.scrollTo({top:0,behavior:"smooth"}); }, [curPage]);

  useEffect(() => {
    if(!curPage?.scene)return;setCurImg(null);if(!repToken)return;setImgLoading(true);
    const isFirst=!refImgUrl;
    const fn=isFirst?genFirstImage(repToken,curPage.scene,charDesc||"a fantasy character"):genNextImage(repToken,curPage.scene,charDesc||"main character",refImgUrl);
    fn.then(url=>{setCurImg(url);if(url)setRefImgUrl(url);setImgLoading(false);}).catch(()=>setImgLoading(false));
  }, [curPage?.scene]);

  const saveRepToken=async v=>{setRepToken(v);await ST.set("repToken",v);};
  const saveAntKey=async v=>{setAntKey(v);await ST.set("antKey",v);};
  const saveElKey=async v=>{setElKey(v);await ST.set("elKey",v);};
  const fetchVoices=async()=>{if(!elKey)return;setVoicesLoading(true);try{const r=await fetch("/api/elevenlabs/v1/voices?page_size=100",{headers:{"xi-api-key":elKey}});const d=await r.json();setElVoices((d.voices||[]).map(v=>({id:v.voice_id,name:v.name})));}catch{}setVoicesLoading(false);};
  const selectVoice=async(id,name)=>{setElVoiceId(id);setElVoiceName(name);await ST.set("elVoiceId",id);await ST.set("elVoiceName",name);ttsCacheRef.current.clear();};

  const generatePresets=async()=>{if(!antKey)return;setPresetsLoading(true);try{const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"x-api-key":antKey,"content-type":"application/json","anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:600,messages:[{role:"user",content:"Придумай 6 завязок для RPG приключения (тёмное фэнтези). Микс: 2 подземелья, 2 городских интриги, 2 необычных. Каждая 1 предложение 12-20 слов. JSON: [{\"emoji\":\"...\",\"text\":\"...\"}]"}]})});const d=await r.json();const txt=d?.content?.[0]?.text||"";const arr=JSON.parse(txt.replace(/```json|```/g,"").trim());if(Array.isArray(arr))setPresets(arr);}catch{}setPresetsLoading(false);};

  const rollStatsForChar=()=>{const r4=()=>{const d=[1,2,3,4].map(()=>Math.floor(Math.random()*6)+1);d.sort((a,b)=>b-a);return d[0]+d[1]+d[2];};const c=CLASSES.find(c=>c.id===charClass);const b={str:r4(),dex:r4(),con:r4(),int:r4(),wis:r4(),cha:r4()};if(c?.stat&&b[c.stat]<14)b[c.stat]=Math.max(b[c.stat],14);setCharStats(b);};

  const startSession=async()=>{
    setPages([]);setCurPage(null);setCurImg(null);setPicks([]);setDiceResults([]);setSel(null);setT0(Date.now());setTimer(0);setError(null);setTextDone(false);setCustomInput("");setCharDesc(null);setRefImgUrl(null);setShowDice(false);setCurDice(null);
    ttsCacheRef.current.forEach(u=>URL.revokeObjectURL(u));ttsCacheRef.current.clear();sfxCacheRef.current.forEach(u=>URL.revokeObjectURL(u));sfxCacheRef.current.clear();
    setView("session");setLoading(true);
    if(!antKey){setError("Нужен Anthropic API ключ!");setLoading(false);return;}
    try{const r=await genPage({charName,race:charRace,cls:charClass,stats:charStats,history:[],choice:null,diceRoll:null,charDesc:null,premise},antKey);if(r.characterDesc)setCharDesc(r.characterDesc);setCurPage(r);setLoading(false);}catch{setError("Ошибка генерации.");setLoading(false);}
  };

  const pickChoice=async(ch)=>{
    if(loading||sel)return;setSel(ch.label);setTextDone(false);setCustomInput("");
    const roll=rollD20();setCurDice(roll);setShowDice(true);
    const total=roll+getMod(charStats[ch.stat]||10);const success=total>=(ch.dc||10);
    setPicks(p=>[...p,{label:ch.label,emoji:ch.emoji||"⚔️",stat:ch.stat,dc:ch.dc,roll,total,success,page:pages.length+1}]);
    setDiceResults(d=>[...d,roll]);
  };

  const onDiceAnimDone=async()=>{
    setShowDice(false);const last=picks[picks.length-1];
    const up=[...pages,{...curPage,imgUrl:curImg,choice:last}];setPages(up);setCurPage(null);setCurImg(null);setSel(null);setLoading(true);
    try{const r=await genPage({charName,race:charRace,cls:charClass,stats:charStats,history:up.map(p=>({text:p.text,choice:p.choice})),choice:last,diceRoll:last.roll,charDesc,premise},antKey);setCurPage(r);setLoading(false);}catch{setError("Ошибка.");setLoading(false);}
  };

  const submitCustom=()=>{if(!customInput.trim()||loading||sel)return;pickChoice({label:customInput.trim(),emoji:"✏️",stat:"cha",dc:10});};

  const finishSession=async()=>{
    stopSpeak();stopSfx();clearInterval(timerRef.current);
    const allP=[...pages,...(curPage?[{...curPage,imgUrl:curImg}]:[])];
    const s={id:Date.now().toString(),charName,race:charRace,cls:charClass,stats:charStats,pages:allP,picks,diceResults,duration:Math.floor((Date.now()-t0)/1000),date:Date.now(),charDesc,premise};
    const upd=[s,...sessions];setSessions(upd);await ST.set("sessions",upd);setView("report");
  };

  const inp={width:"100%",padding:"14px 18px",borderRadius:14,border:`1.5px solid ${t.gb}`,background:dark?t.bg2:"#fff",color:t.tx,fontSize:".95rem",fontFamily:FN.b,outline:"none",transition:"border-color .3s"};
  const onF=e=>{e.target.style.borderColor=`${t.accent}60`;};
  const onB=e=>{e.target.style.borderColor=t.gb;};
  const PBtn=({children:ch,onClick,disabled,style:s})=>
    <button onClick={onClick} disabled={disabled} style={{padding:"14px 32px",borderRadius:50,fontFamily:FN.b,fontSize:".9rem",fontWeight:600,border:"none",cursor:disabled?"default":"pointer",background:"linear-gradient(135deg,#C06040,#A04030)",color:"#fff",boxShadow:"0 6px 24px rgba(192,96,64,.3)",opacity:disabled?.4:1,transition:"all .3s",...s}}
      onMouseOver={e=>{if(!disabled)e.currentTarget.style.transform="translateY(-2px)";}} onMouseOut={e=>{e.currentTarget.style.transform="";}}>{ch}</button>;

  const CSS = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,700&family=Outfit:wght@200;300;400;500;600;700&display=swap');*{margin:0;padding:0;box-sizing:border-box}body{overflow-x:hidden;-webkit-font-smoothing:antialiased}::selection{background:rgba(192,96,64,.2)}@keyframes spin{to{transform:rotate(360deg)}}@keyframes fu{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}@keyframes si{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:translateX(0)}}@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(192,96,64,.3)}70%{box-shadow:0 0 0 14px rgba(192,96,64,0)}}@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}@keyframes kenburns{0%{transform:scale(1)}50%{transform:scale(1.08) translate(-1%,-1%)}100%{transform:scale(1.1) translate(-.5%,1%)}}@keyframes particle{0%{opacity:0;transform:translate(0,0) scale(.5)}50%{opacity:.6;transform:translate(var(--drift),-30px) scale(1)}100%{opacity:0;transform:translate(calc(var(--drift)*1.5),-60px) scale(.4)}}`;

  // ═══ SETTINGS ═══
  const SettingsPanel = () => (
    <div style={{position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.6)",backdropFilter:"blur(8px)"}} onClick={()=>setShowSettings(false)}>
      <div onClick={e=>e.stopPropagation()} style={{background:dark?t.bg2:"#fff",borderRadius:24,padding:"32px 28px",maxWidth:420,width:"90%",maxHeight:"85vh",overflowY:"auto",boxShadow:"0 24px 80px rgba(0,0,0,.4)",animation:"fu .3s",border:`1px solid ${t.gb}`}}>
        <h3 style={{fontFamily:FN.d,fontSize:"1.3rem",fontWeight:600,marginBottom:20,color:t.tx}}>⚙️ Настройки</h3>
        {[["Anthropic API Key",antKey,saveAntKey,"sk-ant-...","console.anthropic.com/settings/keys"],
          ["Replicate Token",repToken,saveRepToken,"r8_...","replicate.com/account/api-tokens"],
          ["ElevenLabs Key",elKey,saveElKey,"sk_...","elevenlabs.io/app/settings/api-keys"]
        ].map(([label,val,save,ph,link],i) => (
          <div key={i} style={{marginBottom:16}}>
            <label style={{fontSize:".68rem",fontWeight:500,color:t.tx2,marginBottom:6,display:"block"}}>{label}</label>
            <input value={val} onChange={e=>save(e.target.value.trim())} placeholder={ph} type="password" style={{...inp,fontFamily:"monospace",fontSize:".82rem"}} onFocus={onF} onBlur={onB}/>
            <p style={{fontSize:".6rem",color:t.tx3,marginTop:4}}><a href={`https://${link}`} target="_blank" rel="noopener" style={{color:t.accent}}>Получить →</a></p>
          </div>
        ))}
        {elKey && <div style={{marginBottom:16}}>
          <label style={{fontSize:".68rem",fontWeight:500,color:t.tx2,marginBottom:6,display:"block"}}>Голос мастера</label>
          <div style={{display:"flex",gap:8,marginBottom:8}}>
            <div style={{flex:1,padding:"10px 14px",borderRadius:14,border:`1.5px solid ${t.gb}`,fontSize:".82rem",color:t.tx}}>🎙️ {elVoiceName}</div>
            <button onClick={fetchVoices} style={{padding:"10px 14px",borderRadius:14,border:`1.5px solid ${t.gb}`,background:t.accentBg,fontSize:".72rem",fontWeight:500,color:t.accent,cursor:"pointer"}}>{voicesLoading?"⏳":"Выбрать"}</button>
          </div>
          {elVoices.length>0 && <div style={{maxHeight:180,overflowY:"auto",border:`1px solid ${t.gb}`,borderRadius:14}}>
            {elVoices.map(v=><div key={v.id} onClick={()=>selectVoice(v.id,v.name)} style={{padding:"8px 12px",borderBottom:`1px solid ${t.gb}08`,background:v.id===elVoiceId?t.accentBg:"transparent",cursor:"pointer",fontSize:".78rem",color:t.tx}}>{v.name} {v.id===elVoiceId?"✓":""}</div>)}
          </div>}
        </div>}
        <button onClick={()=>setShowSettings(false)} style={{width:"100%",padding:"12px",borderRadius:50,background:"linear-gradient(135deg,#C06040,#A04030)",color:"#fff",border:"none",fontFamily:FN.b,fontWeight:600,cursor:"pointer"}}>Готово</button>
      </div>
    </div>
  );

  // ═══ LOADING ═══
  if (view==="loading") return <div style={{minHeight:"100vh",background:t.bg,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}><style>{CSS}</style><div style={{fontSize:"2rem"}}>⚔️</div><div style={{width:36,height:36,border:`2.5px solid ${t.accent}25`,borderTopColor:t.accent,borderRadius:"50%",animation:"spin .8s linear infinite"}}/></div>;

  // ═══ AUTH ═══
  if (view==="auth") return (
    <div style={{minHeight:"100vh",background:t.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FN.b,position:"relative",overflow:"hidden"}}>
      <style>{CSS}</style>
      <div style={{position:"absolute",top:"10%",right:"15%",width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(192,96,64,.08),transparent 60%)",filter:"blur(80px)",pointerEvents:"none"}}/>
      <div style={{position:"relative",zIndex:1,textAlign:"center",padding:"40px 28px",maxWidth:420,width:"100%"}}>
        <div style={{position:"absolute",top:0,right:0}}><ThemeSwitch dark={dark} onToggle={toggleTheme}/></div>
        <div style={{animation:"fu .7s ease-out",marginBottom:44,paddingTop:20}}>
          <div style={{fontSize:".58rem",fontWeight:500,letterSpacing:".28em",textTransform:"uppercase",color:t.accent,marginBottom:10}}>⚔️ AI Мастер Игры</div>
          <h1 style={{fontFamily:FN.d,fontSize:"clamp(3rem,10vw,4.5rem)",fontWeight:300,lineHeight:1,marginBottom:14}}>
            <span style={{color:t.tx}}>Под</span><em style={{color:t.accent,fontWeight:400}}>земелье</em>
          </h1>
          <p style={{color:t.tx3,fontSize:".9rem",maxWidth:300,margin:"0 auto",lineHeight:1.65,fontWeight:300}}>Твой AI мастер создаёт уникальное<br/>RPG приключение с иллюстрациями</p>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12,animation:"fu .7s .1s ease-out both"}}>
          <input value={authName} onChange={e=>setAuthName(e.target.value)} placeholder="Как тебя зовут, искатель приключений?" style={inp} onFocus={onF} onBlur={onB} onKeyDown={e=>{if(e.key==="Enter"&&authName.trim()){(async()=>{const u={name:authName.trim()};await ST.set("user",u);setUser(u);setView("dashboard");})();}}}/>
        </div>
        <div style={{marginTop:18,animation:"fu .7s .2s ease-out both"}}>
          <PBtn onClick={async()=>{if(!authName.trim())return;const u={name:authName.trim()};await ST.set("user",u);setUser(u);setView("dashboard");}} disabled={!authName.trim()} style={{width:"100%"}}>Войти в подземелье →</PBtn>
        </div>
      </div>
    </div>
  );

  // ═══ DASHBOARD ═══
  if (view==="dashboard") return (
    <div style={{minHeight:"100vh",background:t.bg,fontFamily:FN.b}}>
      <style>{CSS}</style>
      {showSettings && <SettingsPanel/>}
      <div style={{maxWidth:620,margin:"0 auto",padding:"36px 18px"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:44,animation:"fu .5s"}}>
          <div>
            <div style={{fontSize:".58rem",fontWeight:500,letterSpacing:".28em",textTransform:"uppercase",color:t.accent,marginBottom:8}}>⚔️ Подземелье</div>
            <h1 style={{fontFamily:FN.d,fontSize:"clamp(1.6rem,5vw,2.4rem)",fontWeight:300,color:t.tx}}>Привет, <em style={{color:t.accent,fontWeight:400}}>{user?.name}</em></h1>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setShowSettings(true)} style={{background:t.gl2,border:`1px solid ${t.gb}`,cursor:"pointer",padding:"7px 12px",borderRadius:20,fontSize:".8rem",color:t.tx3,position:"relative"}}>⚙️{(!repToken||!antKey)&&<div style={{position:"absolute",top:-2,right:-2,width:8,height:8,borderRadius:"50%",background:"#C43C3C",border:`2px solid ${t.bg}`}}/>}</button>
            <ThemeSwitch dark={dark} onToggle={toggleTheme}/>
          </div>
        </div>
        <div style={{background:dark?t.gl:"#fff",border:`1px solid ${t.gb}`,borderRadius:20,padding:"24px 22px",marginBottom:16,boxShadow:t.shadow,animation:"fu .5s .05s ease-out both"}}>
          <h3 style={{fontFamily:FN.d,fontSize:"1.15rem",fontWeight:600,marginBottom:16,color:t.tx}}>🗡️ Новое приключение</h3>
          <PBtn onClick={()=>{setCharName("");setCharRace(null);setCharClass(null);setCharStats({str:10,dex:10,con:10,int:10,wis:10,cha:10});setPremise("");setPresets([]);setView("charCreate");}} style={{width:"100%"}}>Создать персонажа →</PBtn>
        </div>
        {sessions.length>0 && <div style={{background:dark?t.gl:"#fff",border:`1px solid ${t.gb}`,borderRadius:20,padding:"24px 22px",boxShadow:t.shadow,animation:"fu .5s .1s ease-out both"}}>
          <h3 style={{fontFamily:FN.d,fontSize:"1.15rem",fontWeight:600,marginBottom:16,color:t.tx}}>📜 История</h3>
          {sessions.slice(0,8).map((s,i)=>{const rc=RACES.find(r=>r.id===s.race);const cc=CLASSES.find(c=>c.id===s.cls);return <div key={s.id} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:t.blushBg,borderRadius:14,border:`1px solid ${t.gb}`,marginBottom:6,animation:`si .35s ${i*.05}s ease-out both`}}>
            <span style={{fontSize:"1.1rem"}}>{cc?.e||"⚔️"}</span>
            <div style={{flex:1}}><div style={{fontSize:".83rem",fontWeight:600,color:t.tx}}>{s.charName} — {rc?.n} {cc?.n}</div><div style={{fontSize:".66rem",color:t.tx3}}>{new Date(s.date).toLocaleDateString("ru")} · {Math.ceil(s.duration/60)} мин</div></div>
          </div>;})}
        </div>}
      </div>
    </div>
  );

  // ═══ CHAR CREATE ═══
  if (view==="charCreate") return (
    <div style={{minHeight:"100vh",background:t.bg,fontFamily:FN.b}}>
      <style>{CSS}</style>
      <div style={{maxWidth:520,margin:"0 auto",padding:"36px 18px"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}>
          <button onClick={()=>setView("dashboard")} style={{background:t.gl2,border:`1px solid ${t.gb}`,padding:"7px 14px",borderRadius:20,fontSize:".7rem",color:t.tx3,cursor:"pointer"}}>← Назад</button>
          <ThemeSwitch dark={dark} onToggle={toggleTheme}/>
        </div>
        <div style={{textAlign:"center",marginBottom:24,animation:"fu .5s"}}>
          <div style={{fontSize:"2.5rem",marginBottom:8}}>🛡️</div>
          <h2 style={{fontFamily:FN.d,fontSize:"clamp(1.4rem,4vw,1.9rem)",fontWeight:300,color:t.tx}}>Создай <em style={{color:t.accent,fontWeight:400}}>героя</em></h2>
        </div>
        {/* Name */}
        <div style={{background:dark?t.gl:"#fff",border:`1px solid ${t.gb}`,borderRadius:20,padding:"20px 18px",marginBottom:14,boxShadow:t.shadow}}>
          <h3 style={{fontFamily:FN.d,fontSize:".95rem",fontWeight:600,color:t.tx,marginBottom:10}}>Имя героя</h3>
          <input value={charName} onChange={e=>setCharName(e.target.value)} placeholder="Торин, Элара, Гримджоу…" style={inp} onFocus={onF} onBlur={onB}/>
        </div>
        {/* Race */}
        <div style={{background:dark?t.gl:"#fff",border:`1px solid ${t.gb}`,borderRadius:20,padding:"20px 18px",marginBottom:14,boxShadow:t.shadow}}>
          <h3 style={{fontFamily:FN.d,fontSize:".95rem",fontWeight:600,color:t.tx,marginBottom:10}}>Раса</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {RACES.map(r=><button key={r.id} onClick={()=>setCharRace(r.id)} style={{padding:"12px",borderRadius:14,border:`1.5px solid ${charRace===r.id?t.accent:t.gb}`,background:charRace===r.id?t.accentBg:(dark?t.gl2:"#fff"),cursor:"pointer",textAlign:"left",transition:"all .2s"}}>
              <div style={{fontSize:"1.1rem",marginBottom:4}}>{r.e}</div>
              <div style={{fontSize:".82rem",fontWeight:600,color:t.tx}}>{r.n}</div>
              <div style={{fontSize:".62rem",color:t.tx3,fontWeight:300}}>{r.d}</div>
            </button>)}
          </div>
        </div>
        {/* Class */}
        {charRace && <div style={{background:dark?t.gl:"#fff",border:`1px solid ${t.gb}`,borderRadius:20,padding:"20px 18px",marginBottom:14,boxShadow:t.shadow,animation:"fu .3s"}}>
          <h3 style={{fontFamily:FN.d,fontSize:".95rem",fontWeight:600,color:t.tx,marginBottom:10}}>Класс</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {CLASSES.map(c=><button key={c.id} onClick={()=>{setCharClass(c.id);setTimeout(rollStatsForChar,100);}} style={{padding:"12px",borderRadius:14,border:`1.5px solid ${charClass===c.id?t.accent:t.gb}`,background:charClass===c.id?t.accentBg:(dark?t.gl2:"#fff"),cursor:"pointer",textAlign:"left",transition:"all .2s"}}>
              <div style={{fontSize:"1.1rem",marginBottom:4}}>{c.e}</div>
              <div style={{fontSize:".82rem",fontWeight:600,color:t.tx}}>{c.n}</div>
              <div style={{fontSize:".62rem",color:t.tx3,fontWeight:300}}>{c.d}</div>
            </button>)}
          </div>
        </div>}
        {/* Stats */}
        {charClass && <div style={{background:dark?t.gl:"#fff",border:`1px solid ${t.gb}`,borderRadius:20,padding:"20px 18px",marginBottom:14,boxShadow:t.shadow,animation:"fu .3s"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <h3 style={{fontFamily:FN.d,fontSize:".95rem",fontWeight:600,color:t.tx}}>Характеристики</h3>
            <button onClick={rollStatsForChar} style={{padding:"6px 14px",borderRadius:20,border:`1px solid ${t.gb}`,background:t.accentBg,fontSize:".72rem",fontWeight:500,color:t.accent,cursor:"pointer"}}>🎲 Перебросить</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            {Object.entries(STATS).map(([k,v])=>{const mod=getMod(charStats[k]);return <div key={k} style={{padding:"10px",borderRadius:12,border:`1px solid ${t.gb}`,background:dark?t.gl2:"#fff",textAlign:"center"}}>
              <div style={{fontSize:"1rem"}}>{v.e}</div>
              <div style={{fontSize:".68rem",color:t.tx3}}>{v.n}</div>
              <div style={{fontSize:"1.3rem",fontWeight:700,color:v.c}}>{charStats[k]}</div>
              <div style={{fontSize:".6rem",color:mod>=0?t.sage:"#C43C3C",fontWeight:600}}>{mod>=0?"+":""}{mod}</div>
            </div>;})}
          </div>
        </div>}
        {/* Premise */}
        {charClass && <div style={{background:dark?t.gl:"#fff",border:`1px solid ${t.gb}`,borderRadius:20,padding:"20px 18px",marginBottom:14,boxShadow:t.shadow,animation:"fu .3s"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
            <h3 style={{fontFamily:FN.d,fontSize:".95rem",fontWeight:600,color:t.tx}}>Завязка</h3>
            <button onClick={generatePresets} disabled={presetsLoading} style={{padding:"6px 14px",borderRadius:20,border:`1px solid ${t.gb}`,background:t.accentBg,fontSize:".72rem",color:t.accent,cursor:"pointer"}}>{presetsLoading?"⏳":"🔄 Идеи"}</button>
          </div>
          {presets.length>0 && <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:10}}>
            {presets.map((p,i)=><button key={i} onClick={()=>setPremise(p.text)} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:12,border:`1.5px solid ${premise===p.text?t.accent:t.gb}`,background:premise===p.text?t.accentBg:"transparent",cursor:"pointer",fontSize:".8rem",color:t.tx,textAlign:"left"}}><span>{p.emoji}</span><span style={{flex:1}}>{p.text}</span>{premise===p.text&&<span style={{color:t.accent}}>✓</span>}</button>)}
          </div>}
          <textarea value={premise} onChange={e=>setPremise(e.target.value)} placeholder="Или опиши свою завязку…" rows={2} style={{...inp,resize:"vertical",minHeight:60,lineHeight:1.6}} onFocus={onF} onBlur={onB}/>
        </div>}
        {charName.trim()&&charRace&&charClass && <PBtn onClick={startSession} disabled={!premise.trim()} style={{width:"100%",opacity:premise.trim()?1:.5}}>Начать приключение →</PBtn>}
      </div>
    </div>
  );

  // ═══ SESSION ═══
  if (view==="session") return (
    <div style={{height:"100vh",background:t.bg,fontFamily:FN.b,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <style>{CSS}</style>
      {showSettings && <SettingsPanel/>}
      <div style={{padding:"9px 16px",background:dark?"rgba(13,11,14,.94)":"rgba(245,240,250,.94)",borderBottom:`1px solid ${t.gb}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,backdropFilter:"blur(16px)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:".88rem"}}>{CLASSES.find(c=>c.id===charClass)?.e||"⚔️"}</span>
          <span style={{fontFamily:FN.d,fontSize:".9rem",fontWeight:600,color:t.tx2}}>{charName}</span>
          <span style={{fontSize:".73rem",color:t.tx3,fontFamily:"monospace"}}>{fmtT(timer)}</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <PageProgress current={pages.length+1} total={TOTAL_PAGES} t={t}/>
          <button onClick={()=>setShowSettings(true)} style={{background:t.gl2,border:`1px solid ${t.gb}`,padding:"5px 10px",borderRadius:16,fontSize:".75rem",color:t.tx3,cursor:"pointer"}}>⚙️</button>
          <button onClick={()=>{if(curPage)finishSession();else setView("dashboard");}} style={{background:t.accentBg,border:`1px solid ${t.accent}25`,color:t.accent,fontSize:".76rem",fontWeight:600,padding:"6px 14px",borderRadius:20,cursor:"pointer"}}>Завершить</button>
        </div>
      </div>
      <div ref={storyScrollRef} style={{flex:1,overflow:"auto"}}>
        <div style={{maxWidth:600,margin:"0 auto",padding:"14px 16px"}}>
          <div style={{background:t.card,borderRadius:20,border:`1px solid ${t.gb}`,overflow:"hidden",boxShadow:t.shadow}}>
            <div style={{padding:"20px 22px 18px"}}>
              {loading ? <div style={{textAlign:"center",padding:"46px 18px",animation:"fu .4s"}}>
                <div style={{width:30,height:30,border:`2px solid ${t.gb}`,borderTopColor:t.accent,borderRadius:"50%",animation:"spin .8s linear infinite",margin:"0 auto 14px"}}/>
                <p style={{fontSize:".88rem",color:t.tx3}}>{pages.length===0?"Мастер создаёт мир…":"Мастер продолжает…"}</p>
                {error && <div style={{marginTop:10,padding:"9px 12px",background:"rgba(196,60,60,.1)",borderRadius:12,fontSize:".78rem",color:"#C43C3C"}}>{error}</div>}
              </div> : curPage ? <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <span style={{fontFamily:FN.d,fontSize:".88rem",fontWeight:600,color:t.accent,fontStyle:"italic"}}>{curPage.title||"⚔️"}</span>
                  <span style={{fontSize:".63rem",color:t.tx3,background:t.blushBg,padding:"3px 9px",borderRadius:10}}>стр. {pages.length+1}/{TOTAL_PAGES}</span>
                </div>
                <div style={{marginBottom:16,border:`1px solid ${t.gb}`,borderRadius:16,overflow:"hidden"}}>
                  <SceneIllustration imgUrl={curImg} mood={curPage.mood||"dungeon"} loading={imgLoading}/>
                </div>
                <div style={{marginBottom:18,padding:"0 4px"}}>
                  <Typewriter text={curPage.text} speed={30} onDone={()=>setTextDone(true)} style={{fontFamily:FN.d,fontSize:"clamp(.92rem,2.2vw,1.08rem)",lineHeight:2,color:t.storyTx,fontStyle:"italic",fontWeight:400}}/>
                </div>
                <div style={{textAlign:"center",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"center",gap:8,flexWrap:"wrap"}}>
                  <button onClick={()=>{if(speaking)stopSpeak();else speakText(curPage.tts_text||curPage.text);}} style={{background:speaking?t.accent:t.blushBg,border:`1px solid ${speaking?t.accent:t.gb}`,padding:"7px 16px",borderRadius:20,fontSize:".74rem",fontWeight:500,color:speaking?"#fff":t.tx2,cursor:"pointer",display:"flex",alignItems:"center",gap:6,animation:speaking?"pulse 2s infinite":"none"}}>{speaking?"⏹ Стоп":"🔊 Озвучить"}</button>
                  <button onClick={async()=>{const n=!ttsEnabled;setTtsEnabled(n);await ST.set("ttsEnabled",n);}} style={{background:ttsEnabled?t.sageBg:t.blushBg,border:`1px solid ${ttsEnabled?t.sage+"30":t.gb}`,padding:"7px 12px",borderRadius:20,fontSize:".64rem",color:ttsEnabled?t.sage:t.tx3,cursor:"pointer"}}>{ttsEnabled?"✓ авто":"авто"}</button>
                  {elKey && <button onClick={async()=>{const n=!sfxEnabled;setSfxEnabled(n);await ST.set("sfxEnabled",n);if(!n)stopSfx();else if(curPage?.sfx)playSfx(curPage.sfx);}} style={{background:sfxEnabled?t.sageBg:t.blushBg,border:`1px solid ${sfxEnabled?t.sage+"30":t.gb}`,padding:"7px 12px",borderRadius:20,fontSize:".64rem",color:sfxEnabled?t.sage:t.tx3,cursor:"pointer"}}>{sfxLoading?"⏳":sfxEnabled?"🎵 звуки":"🔇 тихо"}</button>}
                </div>
                {showDice && curDice && <DiceRoll result={curDice} onDone={onDiceAnimDone}/>}
                {!showDice && (curPage.isEnd ? <div style={{textAlign:"center",animation:"fu .5s"}}>
                  <p style={{fontFamily:FN.d,fontSize:"1rem",color:t.accent,fontWeight:600,marginBottom:12}}>{curPage.ending==="victory"?"🏆 Славная победа!":curPage.ending==="defeat"?"💀 Поражение…":"⚖️ Конец пути"}</p>
                  <PBtn onClick={finishSession}>Итоги →</PBtn>
                </div> : textDone && !sel && <>
                  {curPage.choices?.length>0 && <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:12}}>
                    {curPage.choices.map((ch,i)=><button key={i} onClick={()=>pickChoice(ch)} style={{background:dark?t.gl2:"#fff",border:`1.5px solid ${t.gb}`,borderRadius:14,padding:"12px 14px",display:"flex",alignItems:"center",gap:10,fontSize:".84rem",fontWeight:500,color:t.tx,textAlign:"left",cursor:"pointer",transition:"all .3s",animation:`si .3s ${i*.06}s ease-out both`}}
                      onMouseOver={e=>{e.currentTarget.style.borderColor=`${t.accent}50`;e.currentTarget.style.transform="translateX(4px)";}} onMouseOut={e=>{e.currentTarget.style.borderColor=t.gb;e.currentTarget.style.transform="";}}>
                      <span style={{fontSize:"1.1rem"}}>{ch.emoji}</span>
                      <div style={{flex:1}}><div>{ch.label}</div><div style={{fontSize:".62rem",color:t.tx3}}>🎲 {STATS[ch.stat]?.n||ch.stat} · DC {ch.dc}</div></div>
                    </button>)}
                  </div>}
                  <div>
                    <div style={{fontSize:".64rem",color:t.tx3,textAlign:"center",marginBottom:6}}>или свой вариант:</div>
                    <div style={{display:"flex",gap:8}}>
                      <input value={customInput} onChange={e=>setCustomInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submitCustom()} placeholder="Что делает герой?.." style={{...inp,flex:1,padding:"11px 14px",fontSize:".84rem"}} onFocus={onF} onBlur={onB}/>
                      <button onClick={submitCustom} disabled={!customInput.trim()} style={{padding:"11px 18px",borderRadius:14,background:customInput.trim()?"linear-gradient(135deg,#C06040,#A04030)":t.gl2,color:customInput.trim()?"#fff":t.tx3,border:"none",fontWeight:600,cursor:customInput.trim()?"pointer":"default"}}>→</button>
                    </div>
                  </div>
                </>)}
              </div> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ═══ REPORT ═══
  if (view==="report") {
    const allP=[...pages,...(curPage?[{...curPage,imgUrl:curImg}]:[])];
    const dur=Math.ceil((sessions[0]?.duration||timer)/60);
    const succ=picks.filter(p=>p.success).length;
    const fail=picks.filter(p=>!p.success).length;
    const avgR=diceResults.length?(diceResults.reduce((a,b)=>a+b,0)/diceResults.length).toFixed(1):"—";
    const ending=curPage?.ending||sessions[0]?.pages?.slice(-1)[0]?.ending||"mixed";
    const endLabel=ending==="victory"?"🏆 Победа!":ending==="defeat"?"💀 Поражение":"⚖️ Смешанный исход";
    const endColor=ending==="victory"?"#5A9E6E":ending==="defeat"?"#C43C3C":"#C4A45C";

    return (
      <div style={{minHeight:"100vh",background:t.bg,fontFamily:FN.b}}>
        <style>{CSS}</style>
        <div style={{maxWidth:520,margin:"0 auto",padding:"36px 16px"}}>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}><ThemeSwitch dark={dark} onToggle={toggleTheme}/></div>
          <div style={{textAlign:"center",marginBottom:36,animation:"fu .5s"}}>
            <div style={{fontSize:".58rem",fontWeight:500,letterSpacing:".28em",textTransform:"uppercase",color:t.accent,marginBottom:8}}>Итоги приключения</div>
            <h2 style={{fontFamily:FN.d,fontSize:"clamp(1.6rem,5vw,2.2rem)",fontWeight:300,marginBottom:8,color:t.tx}}><em style={{color:t.accent,fontWeight:400}}>{charName}</em></h2>
            <p style={{color:t.tx3,fontSize:".83rem"}}>{RACES.find(r=>r.id===charRace)?.e} {RACES.find(r=>r.id===charRace)?.n} {CLASSES.find(c=>c.id===charClass)?.n} · {dur} мин · {picks.length} бросков</p>
            <div style={{display:"inline-block",marginTop:10,padding:"5px 14px",borderRadius:20,background:endColor+"15",border:`1px solid ${endColor}30`,fontSize:".78rem",fontWeight:600,color:endColor}}>{endLabel}</div>
          </div>
          {/* Dice stats */}
          <div style={{background:dark?t.gl:"#fff",border:`1px solid ${t.gb}`,borderRadius:20,padding:"24px 22px",marginBottom:16,boxShadow:t.shadow,animation:"fu .5s .1s ease-out both"}}>
            <h3 style={{fontFamily:FN.d,fontSize:"1.1rem",fontWeight:600,marginBottom:18,color:t.tx}}>🎲 Статистика</h3>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,textAlign:"center"}}>
              <div><div style={{fontSize:"1.5rem",fontWeight:700,color:t.sage}}>{succ}</div><div style={{fontSize:".68rem",color:t.tx3}}>Успехов</div></div>
              <div><div style={{fontSize:"1.5rem",fontWeight:700,color:"#C43C3C"}}>{fail}</div><div style={{fontSize:".68rem",color:t.tx3}}>Провалов</div></div>
              <div><div style={{fontSize:"1.5rem",fontWeight:700,color:t.gold}}>{avgR}</div><div style={{fontSize:".68rem",color:t.tx3}}>Средний d20</div></div>
            </div>
          </div>
          {/* Decision log */}
          {picks.length>0 && <div style={{background:dark?t.gl:"#fff",border:`1px solid ${t.gb}`,borderRadius:20,padding:"24px 22px",marginBottom:16,boxShadow:t.shadow,animation:"fu .5s .2s ease-out both"}}>
            <h3 style={{fontFamily:FN.d,fontSize:"1rem",fontWeight:600,marginBottom:12,color:t.tx}}>🧭 Лог решений</h3>
            {picks.map((p,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:9,padding:"10px 12px",background:p.success?t.sageBg:"rgba(196,60,60,.06)",borderRadius:14,border:`1px solid ${p.success?t.sage+"20":"rgba(196,60,60,.15)"}`,marginBottom:5,animation:`si .3s ${i*.06}s ease-out both`}}>
              <div style={{width:22,height:22,borderRadius:"50%",background:p.success?t.sageBg:"rgba(196,60,60,.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:".63rem",fontWeight:700,color:p.success?t.sage:"#C43C3C"}}>{p.roll}</div>
              <span style={{fontSize:".95rem"}}>{p.emoji}</span>
              <div style={{flex:1}}><div style={{fontSize:".78rem",fontWeight:600,color:t.tx}}>{p.label}</div><div style={{fontSize:".58rem",color:t.tx3}}>{STATS[p.stat]?.n} DC{p.dc} → {p.total} {p.success?"✓":"✗"}</div></div>
              <span style={{fontSize:".68rem",fontWeight:600,color:p.success?t.sage:"#C43C3C"}}>{p.success?"Успех":"Провал"}</span>
            </div>)}
          </div>}
          {/* Full story */}
          <div style={{background:dark?t.gl:"#fff",border:`1px solid ${t.gb}`,borderRadius:20,padding:"24px 22px",marginBottom:16,boxShadow:t.shadow,animation:"fu .5s .25s ease-out both"}}>
            <h3 style={{fontFamily:FN.d,fontSize:"1.1rem",fontWeight:600,marginBottom:18,color:t.tx}}>📜 Полная история</h3>
            {allP.map((pg,i)=><div key={i} style={{marginBottom:16,paddingBottom:i<allP.length-1?16:0,borderBottom:i<allP.length-1?`1px solid ${t.gb}`:"none"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <div style={{width:22,height:22,borderRadius:"50%",background:t.accentBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:".6rem",fontWeight:700,color:t.accent}}>{i+1}</div>
                <span style={{fontFamily:FN.d,fontSize:".82rem",fontWeight:600,color:t.accent,fontStyle:"italic"}}>{pg?.title||`Глава ${i+1}`}</span>
              </div>
              {pg?.imgUrl && <div style={{marginBottom:8,borderRadius:12,overflow:"hidden",border:`1px solid ${t.gb}`,maxHeight:200}}><img src={pg.imgUrl} alt="" style={{width:"100%",display:"block",objectFit:"cover"}}/></div>}
              <p style={{fontFamily:FN.d,fontSize:".85rem",fontStyle:"italic",lineHeight:1.8,color:t.tx2}}>{pg?.text}</p>
            </div>)}
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"center",animation:"fu .5s .35s ease-out both"}}>
            <PBtn onClick={()=>setView("dashboard")}>Новое приключение →</PBtn>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
