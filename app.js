const COURSE = {
  course:"Bricklayer V1.2", standard:"ST0095", assignment:"Assignment 1. Health & Safety",
  ksbs:{
    S1:"Comply with health and safety regulations, standards, and guidance.",
    S2:"Identify and use personal protective equipment (PPE).",
    K1:"Awareness of health and safety regulations, standards, and guidance and impact on role. Control of Substances Hazardous to Health (CoSHH). Fire safety. Health and Safety at Work Act. Asbestos awareness. Manual handling. Signage, fire extinguishers, situational awareness, slips, trips and falls, confined spaces, working at height, electrical safety, respiratory protective equipment (RPE), and dust suppression.",
    K2:"Safety control equipment and how to use personal protective equipment (PPE).",
    K3:"Safe systems of work: site inductions, toolbox talks, risk assessments, method statements and hazard identification in the work area.",
    B1:"Put health, safety and wellbeing first."
  }
};
const KEY="brick_a1_state_v1";
const defaultState={statement:"",learnerName:"",learnerDate:"",quizAnswers:{},quizScore:null,quizPassed:false,
 practical:{task:"",location:"College workshop",date:"",criteria:{},feedback:"",result:"",tutorName:"",signed:false},
 learnerSigned:false,completed:false};
let state={...defaultState,...JSON.parse(localStorage.getItem(KEY)||"{}")};
function save(){localStorage.setItem(KEY,JSON.stringify(state));}
function esc(s){return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}

const DB="brickEvidencePhotos", STORE="photos";
function db(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function putPhoto(i,data){const d=await db();return new Promise((res,rej)=>{const t=d.transaction(STORE,"readwrite");t.objectStore(STORE).put(data,String(i));t.oncomplete=res;t.onerror=()=>rej(t.error);});}
async function getPhoto(i){const d=await db();return new Promise((res,rej)=>{const r=d.transaction(STORE).objectStore(STORE).get(String(i));r.onsuccess=()=>res(r.result||null);r.onerror=()=>rej(r.error);});}
async function photoCount(){let n=0;for(let i=1;i<=6;i++)if(await getPhoto(i))n++;return n;}
async function compress(file){return new Promise((resolve,reject)=>{const img=new Image(), fr=new FileReader();fr.onload=()=>img.src=fr.result;fr.onerror=reject;img.onload=()=>{let w=img.width,h=img.height,max=1400;if(w>max){h=Math.round(h*max/w);w=max}const c=document.createElement("canvas");c.width=w;c.height=h;c.getContext("2d").drawImage(img,0,0,w,h);resolve(c.toDataURL("image/jpeg",.78));};fr.readAsDataURL(file);});}

function wordCount(t){return (t.trim().match(/\b[\w’'-]+\b/g)||[]).length;}
const promptWords={
 "PPE":["ppe","personal protective equipment","hard hat","boots","gloves","high vis"],
 "RPE":["rpe","respiratory protective equipment","dust mask","respirator"],
 "Risk assessment":["risk assessment","hazard assessment"],
 "Method statement":["method statement","safe system of work"],
 "COSHH":["coshh","control of substances hazardous to health"],
 "Site induction":["site induction","induction"],
 "Toolbox talk":["toolbox talk"],
 "Hazard identification":["hazard","hazards","hazard identification"],
 "Working at height":["working at height","work at height","scaffold","ladder"],
 "Wellbeing":["wellbeing","welfare","health and wellbeing"]
};
function promptHits(t){const x=t.toLowerCase();const out={};for(const [p,words] of Object.entries(promptWords))out[p]=words.some(w=>x.includes(w));return out;}

const quiz=[
 {q:"What is the main purpose of a risk assessment?",o:["To record attendance","To identify hazards and decide controls","To order materials","To calculate wages"],a:1,k:"K3"},
 {q:"Which item is respiratory protective equipment?",o:["Safety boots","Hard hat","Dust mask or respirator","High-visibility vest"],a:2,k:"K1/K2"},
 {q:"What does COSHH primarily control?",o:["Noise complaints","Hazardous substances","Working hours","Brick dimensions"],a:1,k:"K1"},
 {q:"What should happen before starting unfamiliar work on site?",o:["Ignore the site rules","Complete the site induction and check RAMS","Begin immediately","Ask another apprentice to approve it"],a:1,k:"K3"},
 {q:"Which control is generally preferred before relying only on PPE?",o:["Remove or reduce the hazard","Work faster","Use older equipment","Ignore minor hazards"],a:0,k:"K1/K2"},
 {q:"What should you do if a method statement does not match the actual work area?",o:["Continue anyway","Stop and report it for review","Sign it without reading","Change it yourself without telling anyone"],a:1,k:"K3/B1"},
 {q:"Which is a common working-at-height control?",o:["Standing on loose blocks","Suitable inspected access equipment","Removing guardrails","Working alone without telling anyone"],a:1,k:"K1"},
 {q:"Why are toolbox talks used?",o:["To replace all training","To discuss relevant hazards, controls and safe practice","To record pay","To choose lunch breaks"],a:1,k:"K3"},
 {q:"What should an apprentice do when PPE is damaged?",o:["Keep using it","Repair it with tape without approval","Report and replace it before work","Share someone else's without checking"],a:2,k:"S2/B1"},
 {q:"Which behaviour best demonstrates B1?",o:["Putting speed before safety","Reporting hazards and protecting wellbeing","Ignoring minor incidents","Removing controls to finish sooner"],a:1,k:"B1"}
];

async function overallStatus(){
 const photos=await photoCount();
 const statement=wordCount(state.statement)>=100 && Object.values(promptHits(state.statement)).filter(Boolean).length>=6 && state.learnerSigned;
 const quizok=state.quizPassed;
 const prac=state.practical.result==="Competent" && state.practical.tutorName && state.practical.signed;
 const done=[photos===6,statement,quizok,prac];
 return {photos,statement,quizok,prac,percent:Math.round(done.filter(Boolean).length/4*100),done:done.every(Boolean)};
}
function ksbHtml(){return Object.entries(COURSE.ksbs).map(([k,v])=>`<div class="ksb"><strong>${k}</strong>: ${esc(v)}</div>`).join("");}
function bindSignature(canvasId,clearId,statePath){
 const c=document.getElementById(canvasId); if(!c)return;
 const ctx=c.getContext("2d"); let draw=false,last=null;
 function size(){const r=c.getBoundingClientRect(),ratio=devicePixelRatio||1;c.width=r.width*ratio;c.height=r.height*ratio;ctx.scale(ratio,ratio);ctx.lineWidth=2.2;ctx.lineCap="round";ctx.strokeStyle="#173239";}
 size();
 const pos=e=>{const r=c.getBoundingClientRect(),p=e.touches?e.touches[0]:e;return{x:p.clientX-r.left,y:p.clientY-r.top}};
 c.addEventListener("pointerdown",e=>{draw=true;last=pos(e);});
 c.addEventListener("pointermove",e=>{if(!draw)return;const p=pos(e);ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(p.x,p.y);ctx.stroke();last=p;});
 window.addEventListener("pointerup",()=>{if(draw){draw=false;state[statePath]=true;save();}});
 document.getElementById(clearId)?.addEventListener("click",()=>{ctx.clearRect(0,0,c.width,c.height);state[statePath]=false;save();});
}
window.COURSE=COURSE;window.state=state;window.save=save;window.esc=esc;window.quiz=quiz;window.getPhoto=getPhoto;window.putPhoto=putPhoto;
window.compress=compress;window.photoCount=photoCount;window.wordCount=wordCount;window.promptHits=promptHits;window.overallStatus=overallStatus;window.ksbHtml=ksbHtml;window.bindSignature=bindSignature;
