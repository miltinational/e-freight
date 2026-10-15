// e-freight ULD register (port of milfin.nl/uld.html, per company, live)
(()=>{
const WARN_DAYS=10,STORAGE_DAYS=14,ADD="__add__",STATUS=["In Warehouse","Dispatched"],STL={"In Warehouse":"stWh","Dispatched":"stDp"};
let rows=[],opts={uld:[],gh:[],client:[],airline:[]},sel=new Set(),lateOnly=false,loaded=false,dirty=false,rates={};
const U=s=>document.querySelector("#uldView "+s);
const today=()=>{const d=new Date();return new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10)};
const daysIn=r=>{if(r.status!=="In Warehouse"||!r.date_in)return null;return Math.floor((new Date(today())-new Date(r.date_in))/864e5)};
const mode=s=>U("#uMode").textContent=s;
const fail=e=>mode("⚠ "+t("notSaved"));

async function load(){
  const d=await rpc("efu_list");
  rows=d.rows||[];
  opts={uld:d.opts?.uld||[],gh:d.opts?.gh||[],client:d.opts?.client||[],airline:d.opts?.airline||[]};
  const ids=new Set(rows.map(r=>r.id));for(const id of sel)if(!ids.has(id))sel.delete(id);
  mode(t("updatedAt",{t:new Date().toTimeString().slice(0,5)}));
}
function dd(f,list,val,addable){
  const l=[...list];if(val&&!l.includes(val))l.push(val);
  const lab=o=>f==="status"?t(STL[o]||o):o;
  return `<select data-f="${f}"><option value=""></option>${l.map(o=>`<option value="${esc(o)}"${o===val?" selected":""}>${esc(lab(o))}</option>`).join("")}${addable?`<option value="${ADD}">${esc(t("addOpt"))}</option>`:""}</select>`;
}
const byNewest=(a,b)=>(b.date_in||"").localeCompare(a.date_in||"")||String(b.created_at||"9").localeCompare(String(a.created_at||"9"));
function inPeriod(r){const n=+U("#uPer").value;if(!n||r.status==="In Warehouse"||!r.date_in)return true;
  const from=new Date(today());from.setDate(from.getDate()-(n-1));return r.date_in>=from.toISOString().slice(0,10)}
function visible(){const q=U("#uQ").value.trim().toLowerCase(),fs=U("#uFs").value;
  return rows.filter(r=>(q||inPeriod(r))&&(!lateOnly||(daysIn(r)??0)>=WARN_DAYS)&&(!fs||r.status===fs)&&(!q||[r.uld_nr,r.awb,r.airline,r.remarks,r.uld,r.gh,r.client].join(" ").toLowerCase().includes(q))).sort(byNewest)}
function head(){U("#uHead").innerHTML=`<tr><th>No.</th><th></th>${["cUld","cUldNr","cClient","cDateIn","cAwb","cAirline","cGh","cStatus","cDateOut","cRemarks","cCmr"].map(k=>`<th>${esc(t(k))}</th>`).join("")}<th></th></tr>`}
function render(){
  head();
  const list=visible(),order=[...rows].sort(byNewest);
  U("#uEmpty").hidden=rows.length>0;
  const hid=rows.length-rows.filter(inPeriod).length;
  U("#uHid").hidden=!hid||!!U("#uQ").value.trim();U("#uHid").textContent=t("hidInfo",{n:hid});
  U("#uTb").innerHTML=list.map(r=>{
    const dy=daysIn(r),lvl=dy>=STORAGE_DAYS?" late2":dy>=WARN_DAYS?" late":"";
    const cls=(r.status==="Dispatched"?"dp":r.status==="In Warehouse"?"wh":"")+(sel.has(r.id)?" sel":"")+lvl;
    const badge=dy==null?"":`<span class="age${lvl}">${dy}d${dy>=STORAGE_DAYS?" · "+esc(t("storage")):""}</span>`;
    return `<tr data-id="${r.id}" class="${cls}">
<td class="no"><span class="n">${order.indexOf(r)+1}</span><span class="nr">${esc(r.uld_nr||"")}</span>${badge}</td>
<td class="ck"><input type="checkbox" data-ck${sel.has(r.id)?" checked":""} aria-label="Select"></td>
<td data-l="${esc(t("cUld"))}">${dd("uld",opts.uld,r.uld,true)}</td>
<td data-l="${esc(t("cUldNr"))}"><input data-f="uld_nr" value="${esc(r.uld_nr)}"></td>
<td data-l="${esc(t("cClient"))}">${dd("client",opts.client,r.client,true)}</td>
<td data-l="${esc(t("cDateIn"))}"><input type="date" data-f="date_in" value="${esc(r.date_in)}"></td>
<td data-l="AWB"><input data-f="awb" inputmode="numeric" value="${esc(r.awb)}"></td>
<td data-l="${esc(t("cAirline"))}">${dd("airline",opts.airline,r.airline,true)}</td>
<td data-l="GH">${dd("gh",opts.gh,r.gh,true)}</td>
<td class="st" data-l="${esc(t("cStatus"))}">${dd("status",STATUS,r.status,false)}</td>
<td data-l="${esc(t("cDateOut"))}"><input type="date" data-f="date_out" value="${esc(r.date_out)}"></td>
<td class="rm" data-l="${esc(t("cRemarks"))}"><input data-f="remarks" value="${esc(r.remarks)}"></td>
<td class="cm" data-l="CMR">${r.cmr_id?`<button class="cmrb" data-cmr="${r.cmr_id}">${esc(t("copyCmr"))}</button> <button class="cmrb" data-inv="${r.cmr_id}">${esc(t("invoiceCmr"))}</button>`:`<span class="dash">—</span>`}</td>
<td class="del"><button data-del title="${esc(t("bDel"))}" aria-label="${esc(t("bDel"))}">✕</button></td></tr>`}).join("");
  const late=rows.filter(r=>(daysIn(r)??0)>=WARN_DAYS),st=late.filter(r=>daysIn(r)>=STORAGE_DAYS).length;
  const lb=U("#uLate");lb.hidden=!late.length;lb.textContent=t("lateBtn",{n:late.length,d:WARN_DAYS})+(st?t("lateStorage",{n:st}):"");lb.classList.toggle("on",lateOnly);
  updBulk(list);
}
function updBulk(list=visible()){U("#uBulk").hidden=sel.size===0;U("#uCnt").textContent=t("nSelected",{n:sel.size});
  const all=U("#uAll");all.checked=list.length>0&&list.every(r=>sel.has(r.id));all.indeterminate=!all.checked&&list.some(r=>sel.has(r.id))}
function put(saved){const i=rows.findIndex(x=>x.id===saved.id);if(i>=0)rows[i]=saved;else rows.push(saved)}

U("#uTb").addEventListener("change",async e=>{
  const el=e.target,tr=el.closest("tr");if(!tr)return;const id=tr.dataset.id;
  if(el.hasAttribute("data-ck")){el.checked?sel.add(id):sel.delete(id);tr.classList.toggle("sel",el.checked);updBulk();return}
  const f=el.dataset.f;if(!f)return;const r=rows.find(x=>x.id===id);if(!r)return;
  let v=el.value;
  try{
    if(v===ADD){const nv=(prompt(t("newOpt"))||"").trim().toUpperCase();
      if(nv&&!opts[f].includes(nv)){await rpc("efu_add_opt",{k:f,v:nv});opts[f].push(nv)}v=nv||r[f]||""}
    r[f]=v;if(el.tagName==="SELECT")render();
    put(await rpc("efu_patch",{row_id:id,d:{[f]:v}}));mode(t("saved"));
  }catch(err){fail(err)}
});
async function deleteIds(ids){
  if(!confirm(t("confirmDelRows",{n:ids.length})))return;
  try{for(const id of ids){await rpc("efu_delete",{row_id:id});rows=rows.filter(r=>r.id!==id);sel.delete(id)}mode(t("deletedN",{n:ids.length}))}
  catch{alert(t("notDeleted"))}
  render();
}
U("#uTb").addEventListener("click",e=>{const b=e.target.closest("[data-del]");if(b)deleteIds([b.closest("tr").dataset.id])});
U("#uAll").onchange=e=>{for(const r of visible())e.target.checked?sel.add(r.id):sel.delete(r.id);render()};
U("#uClr").onclick=()=>{sel.clear();render()};
async function bulkSet(patch){const list=rows.filter(r=>sel.has(r.id));
  try{for(const r of list)put(await rpc("efu_patch",{row_id:r.id,d:patch(r)}));mode(t("savedN",{n:list.length}));sel.clear();render()}catch(err){fail(err);render()}}

// ===== CMR =====
const nl=d=>d?d.split("-").reverse().join("-"):"";
const uniq=a=>[...new Set(a.filter(Boolean))];
const uldText=r=>{const a=(r.uld||"").trim(),n=(r.uld_nr||"").trim();return n.toUpperCase().startsWith(a.toUpperCase())&&a?n:`${a} ${n}`.trim()};
const cmrNo=n=>String(n).padStart(5,"0");
async function buildCmr(d,no){
  const bytes=await (await fetch("/cmr-blanco.pdf")).arrayBuffer();
  const {PDFDocument,StandardFonts}=PDFLib;const doc=await PDFDocument.load(bytes);const form=doc.getForm();
  for(const f of form.getFields()){try{f.acroField.setDefaultAppearance("/Helv 10 Tf 0 g");f.setText("")}catch{}}
  const set=(n,v)=>{try{form.getTextField(n).setText(v||"")}catch{}};
  set("CodeTransporteur",cmrNo(no));
  set("VakRood01",d.clients.join(" / "));
  set("VakRood02",d.ghs.join(" / "));
  set("VeldRood04-2",nl(d.date));
  set("VakRood03",d.delivery);
  set("VakRood04-1",d.takeover);
  set("VakRood16",`Name: ${d.driver||""}\n\nLicence plate: ${d.plate||""}`);
  d.lines.forEach((x,i)=>set(`VakRood06Regel${String(i+1).padStart(2,"0")}Kolom06`,x));
  form.updateFieldAppearances(await doc.embedFont(StandardFonts.Helvetica));
  return new Blob([await doc.save()],{type:"application/pdf"});
}
const fileName=(no,d)=>`CMR_${cmrNo(no)}_${d.date}_${(d.clients[0]||"").replace(/[^\w-]+/g,"_")}.pdf`;
["#carName","#carPlate","#carDel","#carTake"].forEach(k=>document.querySelector(k).addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();document.querySelector("#carDlg").close("ok")}}));
function askCarrier(){return new Promise(res=>{const dl=document.querySelector("#carDlg"),$c=s=>document.querySelector(s);$c("#carName").value="";$c("#carPlate").value="";
  dl.onclose=()=>res(dl.returnValue==="ok"?{driver:$c("#carName").value.trim(),plate:$c("#carPlate").value.trim().toUpperCase(),delivery:$c("#carDel").value.trim(),takeover:$c("#carTake").value.trim()}:null);
  dl.returnValue="";dl.showModal();$c("#carName").focus()})}
U("#uCmr").onclick=async()=>{
  const list=rows.filter(r=>sel.has(r.id));if(!list.length)return;
  if(list.length>16){alert(t("max16"));return}
  const clients=uniq(list.map(r=>r.client)),ghs=uniq(list.map(r=>r.gh)),warn=[];
  if(clients.length>1)warn.push(t("diffClients")+clients.join(", "));
  if(ghs.length>1)warn.push(t("diffGh")+ghs.join(", "));
  if(!clients.length)warn.push(t("noClient"));
  if(warn.length&&!confirm(t("makeAnyway",{w:warn.join(" & ")})))return;
  const already=list.filter(r=>r.cmr_id).length;
  if(already&&!confirm(t("alreadyCmr",{n:already})))return;
  const car=await askCarrier();if(!car)return;
  const dates=list.map(r=>r.date_out).filter(Boolean).sort();
  const d={clients,ghs,date:dates.length?dates[dates.length-1]:today(),lines:list.map(uldText),...car};
  const btn=U("#uCmr");btn.disabled=true;
  try{if(!window.PDFLib)throw new Error("lib");
    const c=await rpc("efu_cmr_create",{ids:list.map(r=>r.id),d});
    for(const r of list){r.cmr_id=c.id;r.cmr_no=c.cmr_no}
    download(await buildCmr(d,c.cmr_no),fileName(c.cmr_no,d));sel.clear();render()}
  catch(e){alert(e.message==="lib"?t("noLib"):t("cmrFail"))}
  finally{btn.disabled=false}
};
U("#uTb").addEventListener("click",async e=>{
  const b=e.target.closest("[data-cmr]");if(!b)return;b.disabled=true;
  try{const c=await rpc("efu_cmr_get",{cmr:b.dataset.cmr});if(!c)throw 0;download(await buildCmr(c.data,c.cmr_no),fileName(c.cmr_no,c.data))}
  catch{alert(t("copyFail"))}finally{b.disabled=false}
});
// ===== invoice per CMR (rates per company) =====
const eur=n=>"EUR "+n.toLocaleString("nl-NL",{minimumFractionDigits:2,maximumFractionDigits:2});
async function buildInvoice(c){
  const {PDFDocument,StandardFonts,rgb}=PDFLib;const d=c.data,doc=await PDFDocument.create();
  const F=await doc.embedFont(StandardFonts.Helvetica),B=await doc.embedFont(StandardFonts.HelveticaBold);
  const clean=s=>String(s??"").replace(/[^\x20-\x7E\xA0-\xFF]/g,"-");
  let page=doc.addPage([595.28,841.89]),y=780;
  const L=50,R=545,txt=(s,x,f=F,sz=10,right=false)=>{s=clean(s);page.drawText(s,{x:right?x-f.widthOfTextAtSize(s,sz):x,y,size:sz,font:f,color:rgb(0,0,0)})};
  const line=()=>page.drawLine({start:{x:L,y:y-4},end:{x:R,y:y-4},thickness:.5,color:rgb(.6,.6,.6)});
  txt(ME.company.name,L,B,11);y-=22;
  txt("Export invoice - Service fee",L,B,16);y-=28;
  txt("CMR no:",L,B);txt(cmrNo(c.cmr_no),L+90);txt("Date:",330,B);txt(nl(d.date),390);y-=16;
  txt("Client:",L,B);txt(d.clients.join(" / ")||"-",L+90);y-=16;
  txt("GH:",L,B);txt(d.ghs.join(" / ")||"-",L+90);y-=30;
  txt("No.",L,B);txt("ULD",L+40,B);txt("Description",L+200,B);txt("Amount",R,B,10,true);line();y-=18;
  let total=0;const unrated=[];
  d.lines.forEach((u,i)=>{if(y<80){page=doc.addPage([595.28,841.89]);y=780}
    const type=u.replace(/[^A-Za-z]/g,"").slice(0,3).toUpperCase(),rate=rates[type];
    if(rate==null)unrated.push(u);else total+=+rate;
    txt(String(i+1),L);txt(u,L+40);txt("Service fee",L+200);txt(rate==null?"no rate":eur(+rate),R,F,10,true);y-=16});
  line();y-=20;txt("Total",L+200,B,11);txt(eur(total),R,B,11,true);
  if(unrated.length){y-=24;txt("Not charged (unknown ULD type): "+unrated.join(", "),L,F,9)}
  return {blob:new Blob([await doc.save()],{type:"application/pdf"}),unrated};
}
U("#uTb").addEventListener("click",async e=>{
  const b=e.target.closest("[data-inv]");if(!b)return;b.disabled=true;
  try{const [c,rt]=await Promise.all([rpc("efu_cmr_get",{cmr:b.dataset.inv}),rpc("efu_rates")]);if(!c)throw 0;rates=rt||{};
    const {blob,unrated}=await buildInvoice(c);
    download(blob,`Invoice_CMR_${cmrNo(c.cmr_no)}_${(c.data.clients[0]||"").replace(/[^\w-]+/g,"_")}.pdf`);
    if(unrated.length)alert(t("noRate",{x:unrated.join(", ")}))}
  catch{alert(t("invFail"))}finally{b.disabled=false}
});
// ===== export =====
U("#uExp").onclick=()=>{
  const cols=[[t("cUld"),"uld"],[t("cUldNr"),"uld_nr"],[t("cClient"),"client"],[t("cDateIn"),r=>nl(r.date_in)],["AWB","awb"],[t("cAirline"),"airline"],["GH","gh"],
    [t("cStatus"),r=>t(STL[r.status]||"")||r.status],[t("cDateOut"),r=>nl(r.date_out)],["Days",r=>daysIn(r)??""],[t("cRemarks"),"remarks"],["CMR",r=>r.cmr_no?cmrNo(r.cmr_no):""]];
  const data=[cols.map(c=>c[0]),...[...rows].sort(byNewest).map(r=>cols.map(([,k])=>typeof k==="function"?k(r):r[k]??""))];
  const ws=XLSX.utils.aoa_to_sheet(data),wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"ULD");XLSX.writeFile(wb,`ULD_register_${today()}.xlsx`);
};
// ===== deleted / restore =====
async function showDeleted(){
  const box=document.querySelector("#delList");box.textContent=t("loading");
  const dlg=document.querySelector("#delDlg");if(!dlg.open)dlg.showModal();
  try{const list=await rpc("efu_deleted");
    if(!list.length){box.textContent=t("noDeleted");return}
    box.innerHTML=list.map(x=>{const o=x.old_row;return `<div class="dl-row"><div><b>${esc([o.uld,o.uld_nr].filter(Boolean).join(" ")||"(empty)")}</b> ${esc(o.client||"")}<br>
<small>AWB ${esc(o.awb||"-")} · ${esc(nl(o.date_in)||"-")} · ✕ ${fmtDT(x.at)}</small></div><button type="button" class="btn small" data-restore="${x.id}">${esc(t("restore"))}</button></div>`}).join("")}
  catch{box.textContent=t("couldNotLoad")}
}
U("#uDelBtn").onclick=showDeleted;
document.querySelector("#delList").addEventListener("click",async e=>{
  const b=e.target.closest("[data-restore]");if(!b)return;b.disabled=true;
  try{await rpc("efu_restore",{hist_id:+b.dataset.restore});await load();render();showDeleted();mode(t("restored"))}
  catch{b.disabled=false;alert(t("couldNotRestore"))}
});
U("#uDisp").onclick=()=>bulkSet(r=>({status:"Dispatched",date_out:r.date_out||today()}));
U("#uWh").onclick=()=>bulkSet(()=>({status:"In Warehouse",date_out:""}));
U("#uDel").onclick=()=>deleteIds([...sel]);
U("#uAdd").onclick=async()=>{
  const r={uld:"",uld_nr:"",client:"",date_in:today(),awb:"",airline:"",gh:"",status:"In Warehouse",date_out:"",remarks:""};
  try{const saved=await rpc("efu_save",{r});put(saved);render();
    const tr=document.querySelector(`#uldView tr[data-id="${saved.id}"]`);tr?.scrollIntoView({block:"center"});tr?.querySelector("select")?.focus()}catch(err){fail(err)}
};
U("#uLate").onclick=()=>{lateOnly=!lateOnly;render()};
try{const v=localStorage.getItem("uld_per");if(v!==null&&[...U("#uPer").options].some(o=>o.value===v))U("#uPer").value=v}catch{}
U("#uPer").onchange=()=>{try{localStorage.setItem("uld_per",U("#uPer").value)}catch{}render()};
U("#uQ").oninput=render;U("#uFs").onchange=render;

// live: colleagues' changes; don't redraw while someone is typing in the table
let rt,reT;
function refresh(){if(U("#uTb").contains(document.activeElement)){dirty=true;return}dirty=false;load().then(render).catch(()=>{})}
U("#uTb").addEventListener("focusout",()=>setTimeout(()=>{if(dirty&&!U("#uTb").contains(document.activeElement))refresh()},300));
window.uldOpen=async()=>{
  if(!loaded){loaded=true;
    rt=sb.channel("ef-uld").on("postgres_changes",{event:"*",schema:"public",table:"uld_rows"},()=>{clearTimeout(reT);reT=setTimeout(refresh,400)})
      .subscribe(s=>{const on=s==="SUBSCRIBED";U("#uLive").textContent=t(on?"live":"offline");U("#uLive").classList.toggle("off",!on)});
    setInterval(()=>{if(!document.hidden&&tab==="uld")refresh()},60000);
  }
  try{await load()}catch{mode(t("couldNotLoad"))}render();
};
window.uldRender=()=>{if(loaded)render()};
if(!document.querySelector("#uldView").hidden)window.uldOpen();
})();
