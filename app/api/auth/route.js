export async function POST(request) {
  const { password } = await request.json();
  const correct = process.env.SITE_PASSWORD;
  if (!correct) return Response.json({ ok: true });
  return Response.json({ ok: password === correct });
}
```

Commit that.

**Second: update the main page.** Go to `app/page.js`, click the pencil to edit. You need to add the password gate at the very top of the app.

Find this line near the top of the `McGift` function:
```
const [showArch, setShowArch] = useState(false);
```

Right **after** it, add these two new lines:
```
const [authed, setAuthed] = useState(false);
const [pw, setPw] = useState("");
```

Then find this line:
```
if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-brand-muted">Loading…</p></div>;
```

Right **after** it, add this block:
```
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
