// items: [{s,x,y}] (y: up = larger) -> fields
function parseNoa(items){
  items=items.filter(i=>i.s.trim());
  const text=items.map(i=>i.s).join(" ").replace(/\s+/g," ");
  const f={};
  const awb=text.match(/\b(\d{3})-(\d{8})\b/);if(awb)f.awb=`${awb[1]}-${awb[2]}`;
  const fl=text.match(/\d{3}-\d{8}\s+(?:[A-Z]{3}-[A-Z]{3}\s+)?-\s*([A-Z0-9]{2})\s*(\d{1,4}[A-Z]?)\b/)||text.match(/(?:^|\s)-\s*([A-Z][A-Z0-9]|[0-9][A-Z])\s*(\d{2,4}[A-Z]?)\b/);
  if(fl)f.flight=`${fl[1]} ${fl[2]}`;
  const M={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
  const dt=text.match(/\b(\d{1,2})-([A-Za-z]{3})-(\d{4})\b/);
  if(dt&&M[dt[2].toLowerCase()])f.arrival_date=`${dt[3]}-${String(M[dt[2].toLowerCase()]).padStart(2,"0")}-${dt[1].padStart(2,"0")}`;
  const pc=text.match(/Pieces:\s*([\d.,]+)/i);if(pc)f.boxes=parseInt(pc[1].replace(/[.,]/g,""),10);
  const wt=text.match(/Weight:\s*([\d.,]+)\s*K/i);
  if(wt){let w=wt[1];const lc=Math.max(w.lastIndexOf(","),w.lastIndexOf("."));
    if(lc>=0&&w.length-lc-1<=2)w=w.slice(0,lc).replace(/[.,]/g,"")+"."+w.slice(lc+1);else w=w.replace(/[.,]/g,"");f.weight=parseFloat(w)}
  const nr=text.match(/\*?\s*(NOA\d{6,})\s*\*?/);if(nr)f.handler_ref=nr[1];
  if(/Worldwide Flight Services|\bWFS\b/i.test(text))f.warehouse="WFS";else if(/dnata/i.test(text))f.warehouse="DNATA";
  else if(/swissport/i.test(text))f.warehouse="SWISSPORT";else if(/\bKLM\b/.test(text))f.warehouse="KLM";
  // label: value on the same line, by position
  const val=lbl=>{const re=new RegExp("^\\s*"+lbl+"\\s*:?","i");const it=items.find(i=>re.test(i.s));if(!it)return"";
    const inl=it.s.replace(re,"").trim();if(inl)return inl;
    return items.filter(i=>i!==it&&Math.abs(i.y-it.y)<4&&i.x>it.x&&i.x<it.x+250).sort((a,b)=>a.x-b.x).reduce((o,i)=>{if(o.stop||/:/.test(i.s)){o.stop=1;return o}o.v.push(i.s.trim());return o},{v:[],stop:0}).v.join(" ")};
  const uv=val("ULD(?!\\s*Loc)"),lv=val("Loose");
  if(uv)f.uld=uv;if(/^\d+$/.test(lv))f.loose=+lv;
  const loc=val("Storage Location"),uldl=val("ULD Location"),rem=val("Remarks");
  const ST={V7:"Vrachtstation 7, Valkweg 1, 1118 EC Schiphol",V8:"Vrachtstation 8, Anchoragelaan 50, 1118 LE Schiphol",V9:"Vrachtstation 9, Anchoragelaan 38, 1118 LE Schiphol"};
  const parts=[];
  if(loc)f.pickup_location=loc.toUpperCase();
  if(loc)parts.push(`Storage location ${loc}`+(ST[loc.toUpperCase()]?` - ${ST[loc.toUpperCase()]}`:""));
  if(uldl)parts.push(`ULD location ${uldl}`);if(rem)parts.push(`Remarks: ${rem}`);
  if(parts.length)f.instructions=parts.join("\n");
  return f;
}
if(typeof module!=="undefined")module.exports=parseNoa;
