"use client";

import { useState, useEffect, useCallback } from "react";

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function genRef() { const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let r = "MG-"; for (let i = 0; i < 5; i++) r += c[Math.floor(Math.random() * c.length)]; return r; }
function fmtDate(iso) { return iso ? new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }) : ""; }
function daysLeft(iso) { if (!iso) return null; const n = new Date(); n.setHours(0,0,0,0); const t = new Date(iso); t.setHours(0,0,0,0); return Math.ceil((t - n) / 86400000); }

const A = "#D4602C", G = "#2D8659";

// ─── UI ───
function Btn({ children, onClick, v = "primary", sm, disabled, style, ...p }) {
  const base = "border-none font-semibold rounded-lg transition-all inline-flex items-center justify-center gap-1.5 tracking-wide";
  const sz = sm ? "text-[13px] px-3.5 py-1.5" : "text-sm px-5 py-2.5";
  const vs = { primary: "bg-brand-accent text-white", secondary: "bg-brand-accent-light text-brand-accent", ghost: "bg-transparent text-brand-muted border border-brand-border" };
  return <button onClick={disabled ? undefined : onClick} className={`${base} ${sz} ${vs[v]} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:-translate-y-px"}`} style={style} {...p}>{children}</button>;
}
function Inp({ label, ...p }) {
  return <div className="flex flex-col gap-1">{label && <label className="text-xs font-semibold text-brand-muted uppercase tracking-wider">{label}</label>}<input {...p} className="px-3.5 py-2.5 border-[1.5px] border-brand-border rounded-lg text-[15px] outline-none bg-white text-brand-text focus:border-brand-accent transition-colors" /></div>;
}
function Crd({ children, className = "", ...p }) { return <div className={`bg-white rounded-xl shadow-sm border border-brand-border p-6 transition-shadow ${className}`} {...p}>{children}</div>; }
function Bdg({ children, v = "default" }) {
  const s = { default: "bg-brand-accent-light text-brand-accent", success: "bg-brand-green-light text-brand-green", muted: "bg-[#F0ECE4] text-brand-muted", warning: "bg-brand-yellow-light text-brand-yellow", archived: "bg-brand-border text-[#9C8E7A]" };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${s[v]}`}>{children}</span>;
}
function Mdl({ open, onClose, title, children }) {
  if (!open) return null;
  return <div className="fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-5" onClick={onClose}>
    <div className="fade-up bg-white rounded-xl p-8 max-w-md w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-center mb-6"><h2 className="font-display text-[22px] font-bold">{title}</h2><button onClick={onClose} className="text-xl text-brand-muted cursor-pointer p-1 bg-transparent border-none">✕</button></div>
      {children}
    </div>
  </div>;
}

// ─── App ───
export default function McGift() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("gifts");
  const [showNewGift, setShowNewGift] = useState(false);
  const [showNewMember, setShowNewMember] = useState(false);
  const [selGift, setSelGift] = useState(null);
  const [upStatus, setUpStatus] = useState(null);
  const [syncMsg, setSyncMsg] = useState(null);
  const [showArch, setShowArch] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/data");
    setData(await res.json());
    setLoading(false);
  }, []);

  const save = useCallback(async (d) => {
    setData(d);
    await fetch("/api/data", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) });
  }, []);

  useEffect(() => { load(); }, [load]);

  const sync = useCallback(async () => {
    setSyncMsg("Checking Up Bank…");
    try {
      const res = await fetch("/api/up/transactions");
      const { transactions } = await res.json();
      if (!transactions?.length) { setSyncMsg("No new payments detected"); setTimeout(() => setSyncMsg(null), 3000); return; }
      let updated = false;
      const newGifts = data.gifts.map(g => {
        if (g.status !== "active") return g;
        const newC = g.contributions.map(c => {
          if (c.paid) return c;
          const match = transactions.find(t => {
            const d = (t.attributes.description + " " + (t.attributes.message || "")).toUpperCase();
            return d.includes(g.refCode) && parseFloat(t.attributes.amount.value) >= c.amount;
          });
          if (match) { updated = true; return { ...c, paid: true, paidAt: match.attributes.createdAt }; }
          return c;
        });
        const allPaid = newC.length > 0 && newC.every(c => c.paid);
        return { ...g, contributions: newC, status: allPaid ? "complete" : g.status };
      });
      await save({ ...data, gifts: newGifts });
      setSyncMsg(updated ? "Payments found & updated!" : "No new payments detected");
    } catch { setSyncMsg("Sync failed"); }
    setTimeout(() => setSyncMsg(null), 3000);
  }, [data, save]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-brand-muted">Loading…</p></div>;

  if (!authed) return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="fade-up w-full max-w-xs text-center">
        <h1 className="font-display text-[28px] font-extrabold mb-1">McGift</h1>
        <p className="text-brand-muted text-sm mb-6">Enter the family password</p>
        <input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="Password"
          className="w-full px-3.5 py-2.5 border-[1.5px] border-brand-border rounded-lg text-[15px] outline-none bg-white text-brand-text focus:border-brand-accent transition-colors mb-3 text-center"
          onKeyDown={async e=>{if(e.key==="Enter"){const r=await fetch("/api/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:pw})});const d=await r.json();if(d.ok)setAuthed(true);else{setPw("");alert("Wrong password")}}}} />
        <button onClick={async()=>{const r=await fetch("/api/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:pw})});const d=await r.json();if(d.ok)setAuthed(true);else{setPw("");alert("Wrong password")}}}
          className="w-full bg-brand-accent text-white font-semibold rounded-lg py-2.5 text-sm cursor-pointer border-none">Enter</button>
      </div>
    </div>
  );

  const active = data.gifts.filter(g => g.status === "active");
  const complete = data.gifts.filter(g => g.status === "complete");
  const archived = data.gifts.filter(g => g.status === "archived");
  const live = [...active, ...complete];

  return (
    <div className="min-h-screen">
      <header className="pt-6 px-6 max-w-3xl mx-auto">
        <div className="fade-up flex justify-between items-start mb-2">
          <div><h1 className="font-display text-[32px] font-extrabold tracking-tight leading-none">McGift</h1><p className="text-brand-muted text-sm mt-1">{data.pool?.groupName}</p></div>
          <Btn v="secondary" sm onClick={sync}>↻ Sync</Btn>
        </div>
        {syncMsg && <div className="fade-in px-3.5 py-2 bg-brand-accent-light rounded-lg text-[13px] text-brand-accent font-medium mt-2">{syncMsg}</div>}
        <nav className="flex gap-1 mt-5 border-b-[1.5px] border-brand-border overflow-x-auto">
          {[{k:"gifts",l:"Gifts",c:live.length},{k:"wishlists",l:"Wish Lists"},{k:"members",l:"People",c:data.members.length},{k:"settings",l:"Settings"}].map(t =>
            <button key={t.k} onClick={() => setView(t.k)} className={`px-4 py-2.5 text-sm border-b-2 -mb-[1.5px] transition-all cursor-pointer whitespace-nowrap bg-transparent ${view===t.k?"font-bold text-brand-accent border-brand-accent":"font-medium text-brand-muted border-transparent"}`}>
              {t.l}{t.c!==undefined&&<span className="ml-1.5 opacity-60">{t.c}</span>}
            </button>
          )}
        </nav>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-5 pb-10">
        {/* ── Gifts ── */}
        {view==="gifts"&&<div className="fade-up">
          <div className="flex gap-3 mb-5 flex-wrap">
            <div className="p-3 px-4 bg-brand-accent-light rounded-lg flex-1 min-w-[100px]"><div className="text-[22px] font-bold font-display text-brand-accent">{active.length}</div><div className="text-xs text-brand-accent font-medium">Active</div></div>
            <div className="p-3 px-4 bg-brand-green-light rounded-lg flex-1 min-w-[100px]"><div className="text-[22px] font-bold font-display text-brand-green">{complete.length}</div><div className="text-xs text-brand-green font-medium">Complete</div></div>
            <div className="p-3 px-4 bg-[#F0ECE4] rounded-lg flex-1 min-w-[100px]"><div className="text-[22px] font-bold font-display text-brand-muted">${data.gifts.reduce((s,g)=>s+g.contributions.filter(c=>c.paid).reduce((ss,c)=>ss+c.amount,0),0).toFixed(0)}</div><div className="text-xs text-brand-muted font-medium">Collected</div></div>
          </div>
          <Btn onClick={()=>setShowNewGift(true)} style={{marginBottom:"16px"}}>+ New Gift</Btn>
          {live.length===0&&<Crd className="text-center !p-12"><div className="text-4xl mb-3">🎁</div><p className="text-brand-muted">No gifts yet. Add people first, then propose a gift.</p></Crd>}
          {live.map((g,i)=>{
            const tp=g.contributions.reduce((s,c)=>s+c.amount,0), pd=g.contributions.filter(c=>c.paid).reduce((s,c)=>s+c.amount,0), pct=tp>0?Math.min(pd/tp*100,100):0, dl=daysLeft(g.deadline);
            return <Crd key={g.id} className="fade-up mb-3 cursor-pointer" style={{animationDelay:`${i*0.05}s`}}>
              <div onClick={()=>setSelGift(g)}>
                <div className="flex justify-between items-start mb-2">
                  <div><h3 className="font-display text-lg font-bold mb-0.5">{g.title}</h3><p className="text-[13px] text-brand-muted">For {g.recipient} · {g.refCode}{g.deadline&&<span> · Due {fmtDate(g.deadline)}</span>}</p></div>
                  <div className="flex gap-1.5 flex-wrap justify-end">{dl!==null&&dl<=7&&dl>0&&<Bdg v="warning">{dl}d left</Bdg>}{dl!==null&&dl<=0&&g.status==="active"&&<Bdg v="warning">Overdue</Bdg>}<Bdg v={g.status==="complete"?"success":"default"}>{g.status==="complete"?"✓ All Paid":"Active"}</Bdg></div>
                </div>
                {g.description&&<p className="text-sm text-brand-muted mb-3">{g.description}</p>}
                <div className="flex items-center gap-3"><div className="flex-1 h-1.5 bg-brand-border rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{width:`${pct}%`,background:g.status==="complete"?G:A}}/></div><span className="text-[13px] font-semibold whitespace-nowrap">${pd.toFixed(0)} / ${tp.toFixed(0)} pledged</span></div>
                <div className="mt-2.5 flex gap-1.5 flex-wrap">{g.contributions.map(c=>{const m=data.members.find(x=>x.id===c.memberId);return<span key={c.id} className={`text-xs px-2.5 py-0.5 rounded-xl font-medium ${c.paid?"bg-brand-green-light text-brand-green":"bg-[#F0ECE4] text-brand-muted"}`}>{m?.name||"?"} · ${c.amount}{c.paid?" ✓":""}</span>})}</div>
              </div>
            </Crd>
          })}
          {archived.length>0&&<div className="mt-6">
            <button onClick={()=>setShowArch(!showArch)} className="text-[13px] font-semibold text-brand-muted flex items-center gap-1.5 py-2 cursor-pointer bg-transparent border-none"><span className={`inline-block transition-transform ${showArch?"rotate-90":""}`}>▸</span>Archived ({archived.length})</button>
            {showArch&&archived.map((g,i)=><Crd key={g.id} className="fade-up mb-3 opacity-70" style={{animationDelay:`${i*0.05}s`}}>
              <div className="flex justify-between items-center"><div><h3 className="font-display text-base font-bold mb-0.5">{g.title}</h3><p className="text-[13px] text-brand-muted">For {g.recipient} · ${g.contributions.reduce((s,c)=>s+c.amount,0).toFixed(0)} total</p></div>
              <div className="flex gap-2 items-center"><Bdg v="archived">Archived</Bdg><button onClick={()=>save({...data,gifts:data.gifts.map(x=>x.id===g.id?{...x,status:"active"}:x)})} className="text-xs text-brand-accent font-semibold cursor-pointer bg-transparent border-none">Reopen</button></div></div>
            </Crd>)}
          </div>}
        </div>}

        {/* ── Wish Lists ── */}
        {view==="wishlists"&&<WishTab wishlists={data.wishlists} onSave={wl=>save({...data,wishlists:wl})} />}

        {/* ── People ── */}
        {view==="members"&&<div className="fade-up">
          <Btn onClick={()=>setShowNewMember(true)} style={{marginBottom:"16px"}}>+ Add Person</Btn>
          {data.members.length===0&&<Crd className="text-center !p-12"><div className="text-4xl mb-3">👨‍👩‍👧‍👦</div><p className="text-brand-muted">Add your family members to get started.</p></Crd>}
          <div className="grid gap-3">{data.members.map((m,i)=><Crd key={m.id} className="fade-up !p-4 !px-6 flex justify-between items-center" style={{animationDelay:`${i*0.05}s`}}>
            <div><div className="font-semibold text-[15px]">{m.name}</div><div className="text-[13px] text-brand-muted">{[m.phone,m.email].filter(Boolean).join(" · ")||"No contact info"}</div></div>
            <button onClick={()=>{if(confirm(`Remove ${m.name}?`))save({...data,members:data.members.filter(x=>x.id!==m.id)})}} className="text-brand-muted cursor-pointer text-base p-1 bg-transparent border-none">×</button>
          </Crd>)}</div>
        </div>}

        {/* ── Settings ── */}
        {view==="settings"&&<div className="fade-up">
          <Crd className="mb-4"><h3 className="font-display text-lg font-bold mb-4">Group Name</h3><Inp value={data.pool?.groupName||""} onChange={e=>save({...data,pool:{...data.pool,groupName:e.target.value}})} placeholder="e.g. The McGowans" /></Crd>
          <Crd className="mb-4">
            <h3 className="font-display text-lg font-bold mb-1">Up Bank Connection</h3>
            <p className="text-[13px] text-brand-muted mb-4">Your Up Bank token is set as an environment variable in Vercel. To change it, go to your Vercel project settings.</p>
            <div className="flex gap-2 items-center">
              <Btn sm v="secondary" onClick={async()=>{setUpStatus("checking");const r=await fetch("/api/up/ping");const d=await r.json();setUpStatus(d.status)}}>Test Connection</Btn>
              {upStatus==="checking"&&<span className="text-[13px] text-brand-muted">Checking…</span>}
              {upStatus==="connected"&&<span className="text-[13px] text-brand-green font-semibold">✓ Connected</span>}
              {upStatus==="error"&&<span className="text-[13px] text-red-600 font-semibold">✕ Failed</span>}
              {upStatus==="not_configured"&&<span className="text-[13px] text-brand-muted">Not configured yet</span>}
            </div>
          </Crd>
          <Crd><h3 className="font-display text-lg font-bold mb-1">How It Works</h3><div className="text-sm text-brand-muted leading-7">
            <p className="mb-2">1. Add family in the <strong>People</strong> tab.</p>
            <p className="mb-2">2. Add gift ideas to <strong>Wish Lists</strong>.</p>
            <p className="mb-2">3. Create a gift with a deadline.</p>
            <p className="mb-2">4. People opt in and pledge their amount.</p>
            <p className="mb-2">5. Each gift gets a <strong>reference code</strong> (e.g. MG-XK3M9). Contributors include this in their bank transfer.</p>
            <p className="mb-2">6. Hit <strong>Sync</strong> — auto-matches Up Bank payments.</p>
            <p>7. <strong>Archive</strong> gifts when done.</p>
          </div></Crd>
        </div>}
      </main>

      {/* Modals */}
      <Mdl open={showNewGift} onClose={()=>setShowNewGift(false)} title="New Gift">
        <GiftForm members={data.members} onSave={g=>{save({...data,gifts:[g,...data.gifts]});setShowNewGift(false)}} />
      </Mdl>
      <Mdl open={showNewMember} onClose={()=>setShowNewMember(false)} title="Add Person">
        <MemberForm onSave={m=>{save({...data,members:[...data.members,m]});setShowNewMember(false)}} />
      </Mdl>
      <Mdl open={!!selGift} onClose={()=>setSelGift(null)} title={selGift?.title||""}>
        {selGift&&<GiftDetail gift={selGift} members={data.members}
          onUpdate={g=>{const ng=data.gifts.map(x=>x.id===g.id?g:x);save({...data,gifts:ng});setSelGift(g)}}
          onDelete={()=>{save({...data,gifts:data.gifts.filter(g=>g.id!==selGift.id)});setSelGift(null)}}
          onArchive={()=>{save({...data,gifts:data.gifts.map(g=>g.id===selGift.id?{...g,status:"archived"}:g)});setSelGift(null)}}
        />}
      </Mdl>
    </div>
  );
}

// ─── Gift Form ───
function GiftForm({ members, onSave }) {
  const [title,setTitle]=useState(""), [recip,setRecip]=useState(""), [desc,setDesc]=useState(""), [deadline,setDl]=useState(""), [sel,setSel]=useState({});
  const tp = Object.values(sel).reduce((s,v)=>s+(parseFloat(v)||0),0);
  return <div className="flex flex-col gap-4">
    <Inp label="Gift Title" value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Dyson Airwrap" />
    <Inp label="For Who" value={recip} onChange={e=>setRecip(e.target.value)} placeholder="e.g. Mum" />
    <Inp label="Description (optional)" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="e.g. The pink one from Sephora" />
    <Inp label="Deadline" type="date" value={deadline} onChange={e=>setDl(e.target.value)} />
    {members.length>0&&<div>
      <label className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-2 block">Who's In?</label>
      <div className="flex flex-col gap-2">{members.map(m=><div key={m.id} className="flex items-center gap-2.5">
        <span className="text-sm font-medium w-24 truncate">{m.name}</span>
        <input type="number" placeholder="$0" value={sel[m.id]||""} onChange={e=>setSel({...sel,[m.id]:e.target.value})} className="flex-1 px-3 py-2 border-[1.5px] border-brand-border rounded-lg text-sm outline-none bg-white" />
      </div>)}</div>
      {tp>0&&<div className="mt-2 text-[13px] text-brand-muted">Total: ${tp.toFixed(0)}</div>}
    </div>}
    <Btn onClick={()=>{if(!title||!recip)return;const cs=Object.entries(sel).filter(([,v])=>v>0).map(([memberId,amount])=>({id:genId(),memberId,amount:parseFloat(amount),paid:false,paidAt:null}));onSave({id:genId(),title,recipient:recip,description:desc,deadline:deadline||null,refCode:genRef(),contributions:cs,status:"active",createdAt:new Date().toISOString()})}} disabled={!title||!recip}>Create Gift</Btn>
  </div>;
}

// ─── Member Form ───
function MemberForm({ onSave }) {
  const [name,setName]=useState(""), [phone,setPhone]=useState(""), [email,setEmail]=useState("");
  return <div className="flex flex-col gap-4">
    <Inp label="Name" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Sarah" />
    <Inp label="Phone (optional)" type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="e.g. 0412 345 678" />
    <Inp label="Email (optional)" value={email} onChange={e=>setEmail(e.target.value)} placeholder="e.g. sarah@email.com" />
    <Btn onClick={()=>{if(name)onSave({id:genId(),name,phone,email})}} disabled={!name}>Add Person</Btn>
  </div>;
}

// ─── Gift Detail ───
function GiftDetail({ gift, members, onUpdate, onDelete, onArchive }) {
  const [adding,setAdding]=useState(null), [amt,setAmt]=useState("");
  const cs=gift.contributions, eIds=cs.map(c=>c.memberId), avail=members.filter(m=>!eIds.includes(m.id));
  const pd=cs.filter(c=>c.paid).reduce((s,c)=>s+c.amount,0), tp=cs.reduce((s,c)=>s+c.amount,0), dl=daysLeft(gift.deadline);
  return <div>
    <p className="text-sm text-brand-muted mb-1">For <strong>{gift.recipient}</strong></p>
    {gift.description&&<p className="text-sm text-brand-muted mb-1">{gift.description}</p>}
    {gift.deadline&&<p className={`text-[13px] mb-3 ${dl!==null&&dl<=3?"text-brand-yellow font-semibold":"text-brand-muted"}`}>Deadline: {fmtDate(gift.deadline)}{dl!==null&&dl>0&&` (${dl} days left)`}{dl!==null&&dl<=0&&" (overdue)"}</p>}
    <div className="flex gap-3 mb-4">
      <div className="p-2.5 px-4 bg-brand-accent-light rounded-lg flex-1"><div className="text-lg font-bold font-display text-brand-accent">${pd.toFixed(0)}</div><div className="text-[11px] text-brand-accent">Paid</div></div>
      <div className="p-2.5 px-4 bg-[#F0ECE4] rounded-lg flex-1"><div className="text-lg font-bold font-display text-brand-muted">${tp.toFixed(0)}</div><div className="text-[11px] text-brand-muted">Pledged</div></div>
    </div>
    <div className="p-3 px-4 bg-[#FFFBF5] border border-dashed border-brand-accent rounded-lg mb-5">
      <div className="text-[11px] font-semibold text-brand-accent uppercase tracking-widest mb-0.5">Payment Reference</div>
      <div className="text-xl font-bold font-mono tracking-wider">{gift.refCode}</div>
      <div className="text-xs text-brand-muted mt-1">Include this in the bank transfer description</div>
    </div>
    <h4 className="text-[13px] font-semibold text-brand-muted uppercase tracking-wider mb-2.5">Contributors</h4>
    {cs.length===0&&<p className="text-sm text-brand-muted py-3">No one has opted in yet.</p>}
    {cs.map(c=>{const m=members.find(x=>x.id===c.memberId);return<div key={c.id} className="flex justify-between items-center py-2.5 border-b border-brand-border">
      <div><span className="font-semibold text-sm">{m?.name||"?"}</span><span className="ml-2 text-sm text-brand-muted">${c.amount}</span></div>
      <div className="flex gap-2 items-center">{c.paid?<Bdg v="success">Paid ✓</Bdg>:<><Bdg v="muted">Pending</Bdg><button onClick={()=>{const nc=cs.map(x=>x.id===c.id?{...x,paid:true,paidAt:new Date().toISOString()}:x);const ap=nc.every(x=>x.paid);onUpdate({...gift,contributions:nc,status:ap?"complete":gift.status})}} className="text-xs text-brand-accent font-semibold cursor-pointer bg-transparent border-none">Mark paid</button></>}</div>
    </div>})}
    {avail.length>0&&<div className="mt-4">{!adding?<Btn v="ghost" sm onClick={()=>setAdding(avail[0].id)}>+ Add contributor</Btn>:
      <div className="flex gap-2 items-end flex-wrap">
        <select value={adding} onChange={e=>setAdding(e.target.value)} className="px-3 py-2 border-[1.5px] border-brand-border rounded-lg text-sm bg-white">{avail.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select>
        <input type="number" placeholder="$0" value={amt} onChange={e=>setAmt(e.target.value)} className="w-20 px-3 py-2 border-[1.5px] border-brand-border rounded-lg text-sm" />
        <Btn sm onClick={()=>{if(adding&&amt){onUpdate({...gift,contributions:[...cs,{id:genId(),memberId:adding,amount:parseFloat(amt),paid:false,paidAt:null}]});setAdding(null);setAmt("")}}}>Add</Btn>
        <Btn sm v="ghost" onClick={()=>{setAdding(null);setAmt("")}}>Cancel</Btn>
      </div>}
    </div>}
    <div className="mt-6 pt-4 border-t border-brand-border flex justify-between">
      <Btn v="ghost" sm onClick={onArchive}>Archive</Btn>
      <Btn v="ghost" sm onClick={()=>{if(confirm("Delete permanently?"))onDelete()}} style={{color:"#c0392b"}}>Delete</Btn>
    </div>
  </div>;
}

// ─── Wish Lists ───
function WishTab({ wishlists, onSave }) {
  const [name,setName]=useState(""), [idea,setIdea]=useState(""), [addTo,setAddTo]=useState(null), [txt,setTxt]=useState("");
  const people=[...new Set(wishlists.map(w=>w.name))];
  const add=(n,i)=>onSave([...wishlists,{id:genId(),name:n,idea:i,addedAt:new Date().toISOString()}]);
  return <div className="fade-up">
    <p className="text-sm text-brand-muted mb-5">A place for everyone to jot down what they'd like.</p>
    <Crd className="mb-5"><h3 className="font-display text-base font-bold mb-3">Add a Wish</h3><div className="flex flex-col gap-3">
      <Inp label="Who is this for?" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Sarah" />
      <div className="flex flex-col gap-1"><label className="text-xs font-semibold text-brand-muted uppercase tracking-wider">What do they want?</label>
        <textarea value={idea} onChange={e=>setIdea(e.target.value)} placeholder="e.g. Anything from Aesop, a nice candle..." className="px-3.5 py-2.5 border-[1.5px] border-brand-border rounded-lg text-[15px] outline-none bg-white min-h-[80px] resize-y focus:border-brand-accent transition-colors" /></div>
      <Btn disabled={!name.trim()||!idea.trim()} onClick={()=>{add(name.trim(),idea.trim());setIdea("")}}>Add to Wish List</Btn>
    </div></Crd>
    {people.length===0?<Crd className="text-center !p-10"><div className="text-4xl mb-3">✨</div><p className="text-brand-muted">No wish lists yet.</p></Crd>:
    people.map(n=>{const items=wishlists.filter(w=>w.name===n);return<Crd key={n} className="fade-up mb-3">
      <div className="flex justify-between items-center mb-3"><h3 className="font-display text-[17px] font-bold">{n}</h3><button onClick={()=>{if(confirm(`Clear all for ${n}?`))onSave(wishlists.filter(w=>w.name!==n))}} className="text-xs text-brand-muted cursor-pointer bg-transparent border-none">Clear all</button></div>
      {items.map(w=><div key={w.id} className="flex justify-between items-start py-2 border-t border-brand-border"><p className="text-sm leading-relaxed flex-1 whitespace-pre-wrap">{w.idea}</p><button onClick={()=>onSave(wishlists.filter(x=>x.id!==w.id))} className="text-sm text-brand-muted cursor-pointer pl-3 bg-transparent border-none">×</button></div>)}
      {addTo===n?<div className="mt-2 flex gap-2"><input value={txt} onChange={e=>setTxt(e.target.value)} placeholder="Another idea..." className="flex-1 px-3 py-2 border-[1.5px] border-brand-border rounded-lg text-sm outline-none bg-white" onKeyDown={e=>{if(e.key==="Enter"&&txt.trim()){add(n,txt.trim());setTxt("");setAddTo(null)}}} />
        <Btn sm onClick={()=>{if(txt.trim()){add(n,txt.trim());setTxt("");setAddTo(null)}}}>Add</Btn><Btn sm v="ghost" onClick={()=>{setAddTo(null);setTxt("")}}>Cancel</Btn></div>:
        <button onClick={()=>setAddTo(n)} className="mt-2 text-[13px] text-brand-accent font-semibold cursor-pointer py-1 bg-transparent border-none">+ Add another idea</button>}
    </Crd>})}
  </div>;
}
