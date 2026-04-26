import React, {useState, useRef, useEffect} from "react";
import axios from "axios";

export default function TagInputWithSuggest({ value=[], onChange, placeholder="type..." }){
  const [text, setText] = useState("");
  const [suggests, setSuggests] = useState([]);
  const ref = useRef();
  useEffect(()=>{ if(!text) setSuggests([]); },[text]);

  useEffect(()=>{const t = setTimeout(()=>{ if(text.length>0) fetchSuggest(text); },200); return ()=>clearTimeout(t);},[text]);

  async function fetchSuggest(q){
    try{
      const r = await axios.get(`/api/skills?q=${encodeURIComponent(q)}`);
      setSuggests(r.data.suggestions||[]);
    }catch(e){ setSuggests([]); }
  }

  function addTag(t){
    if(!t) return;
    if(value.find(v=> (v.name||v).toLowerCase() === (t.name||t).toLowerCase())) { setText(""); return; }
    onChange([...(value||[]), typeof t === "string" ? { name: t } : t]);
    setText("");
    setSuggests([]);
  }

  function remove(i){ const arr=[...value]; arr.splice(i,1); onChange(arr); }

  return (
    <div style={{position:"relative"}}>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,border:"1px solid #ddd",padding:8,borderRadius:8}}>
        {value.map((t,i)=>(
          <div key={i} style={{background:"#eef",padding:"6px 10px",borderRadius:20,display:"flex",gap:8,alignItems:"center"}}>
            <span>{t.name||t}</span>
            <button onClick={()=>remove(i)} style={{border:0,background:"transparent"}}>✕</button>
          </div>
        ))}
        <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter"){ e.preventDefault(); addTag(text); }}} placeholder={placeholder} style={{minWidth:140,border:0,outline:0}} />
      </div>
      {suggests.length>0 && (
        <div style={{position:"absolute",left:0,top:"110%",background:"white",border:"1px solid #ddd",width:"100%",zIndex:20}}>
          {suggests.map((s,i)=> <div key={i} onClick={()=>addTag(s)} style={{padding:8,cursor:"pointer"}}>{s}</div>)}
        </div>
      )}
    </div>
  );
}
