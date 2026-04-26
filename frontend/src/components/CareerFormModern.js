// frontend/src/components/CareerFormModern.js
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

function TagInput({ value = [], placeholder = "type and press Enter", onChange }) {
  const [text, setText] = useState("");
  const inputRef = useRef();

  useEffect(() => { if (onChange) onChange(value); }, [value]);

  const addTag = (t) => {
    const v = t.trim();
    if (!v) return;
    if (value.find(x => x.name?.toLowerCase() === v.toLowerCase() || x.toLowerCase?.() === v.toLowerCase())) {
      setText("");
      return;
    }
    const newArr = [...value, { name: v }];
    onChange(newArr);
    setText("");
  };

  const removeTag = (idx) => {
    const newArr = value.filter((_,i) => i !== idx);
    onChange(newArr);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (text) addTag(text);
    } else if (e.key === "Backspace" && !text && value.length) {
      removeTag(value.length - 1);
    }
  };

  return (
    <div onClick={()=>inputRef.current.focus()} style={{
      minHeight: 48, padding: 8, display: "flex", flexWrap: "wrap", gap:8,
      borderRadius: 8, border: "1px solid rgba(0,0,0,0.12)", background: "white"
    }}>
      {value.map((t,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",padding:"6px 10px",borderRadius:20, background:"#eef", gap:8}}>
          <span style={{fontSize:14}}>{t.name || t}</span>
          <button style={{border:0,background:"transparent",cursor:"pointer"}} onClick={(e)=>{e.stopPropagation(); removeTag(i)}}>✕</button>
        </div>
      ))}
      <input
        ref={inputRef}
        value={text}
        onChange={e=>setText(e.target.value)}
        onKeyDown={handleKey}
        placeholder={placeholder}
        style={{flex:1, minWidth:140, border:0, outline:0, padding:8}}
      />
    </div>
  );
}

export default function CareerFormModern() {
  const [skills, setSkills] = useState([]); // array of {name}
  const [interests, setInterests] = useState([]); // array of strings
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(false);

  async function getRecs() {
    setLoading(true);
    setRecs([]);
    try {
      const res = await axios.post("/api/recommend-online", {
        skills,
        interests,
        options: { topN: 8 }
      });
      if (res.data && res.data.ok) {
        setRecs(res.data.recommendations || []);
      } else {
        alert("Error: " + (res.data?.error || "unknown"));
      }
    } catch (err) {
      console.error(err);
      alert("Server error — check console");
    } finally { setLoading(false); }
  }

  return (
    <div style={{maxWidth:960, margin:"24px auto", padding:20}}>
      <h1 style={{marginBottom:12}}>Career Recommendation (AI)</h1>

      <label style={{fontWeight:600}}>Skills (type then press Enter)</label>
      <div style={{marginBottom:12}}>
        <TagInput value={skills} onChange={setSkills} placeholder="e.g. node js, mongodb, express" />
      </div>

      <label style={{fontWeight:600}}>Interests</label>
      <div style={{marginBottom:12}}>
        <TagInput value={interests.map(i=>({name:i}))} onChange={(arr)=>setInterests(arr.map(a=>a.name||a))} placeholder="e.g. backend, ai"/>
      </div>

      <div style={{display:"flex", gap:12}}>
        <button onClick={getRecs} style={{padding:"10px 18px", borderRadius:8, background:"#0066FF", color:"white", border:0}}>
          {loading ? "Loading..." : "Get AI Recommendations"}
        </button>
        <button onClick={()=>{ setSkills([]); setInterests([]); setRecs([]); }} style={{padding:"10px 18px", borderRadius:8}}>Reset</button>
      </div>

      <div style={{marginTop:24}}>
        {recs.length===0 && !loading && (<div style={{padding:20,background:"#fff8",borderRadius:8}}>No recommendations yet — try entering skills.</div>)}
        {recs.map((r,i)=>(
          <div key={i} style={{marginTop:12, padding:18, borderRadius:10, background:"white", boxShadow:"0 6px 22px rgba(0,0,0,0.06)"}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
              <h3 style={{margin:0}}>{r.title}</h3>
              <div style={{fontSize:14,color:"#666"}}>Score {Number(r.score ?? r.combinedScore ?? 0).toFixed(3)}</div>
            </div>
            <p style={{marginTop:8, color:"#444"}}>{r.description}</p>
            <div style={{marginTop:10, display:"flex", gap:8}}>
              <button onClick={async ()=>{
                await axios.post("/api/users/save-recommendation", { userId: "anonymous", careerTitle: r.title, score: r.score });
                alert("Saved!");
              }} style={{padding:"8px 10px", borderRadius:8}}>Save</button>
              <a style={{padding:"8px 10px", borderRadius:8, background:"#f1f1f1", textDecoration:"none"}} href="#">{/* could link to career details */}View</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
