import React, {useEffect, useState} from "react";
import axios from "axios";

export default function UserDashboard(){
  const [saved, setSaved] = useState([]);
  useEffect(()=>{ (async ()=>{ const r = await axios.get('/api/users/saved?userId=anonymous'); setSaved(r.data.saved || []); })(); },[]);
  return (
    <div style={{padding:20}}>
      <h2>Your saved recommendations</h2>
      {saved.map((s,i)=> (
        <div key={i} style={{padding:10, border:"1px solid #eee", marginBottom:6, borderRadius:6}}>
          <strong>{s.careerTitle}</strong> <span style={{color:"#666"}}>({s.score})</span>
          <div style={{fontSize:13,color:"#777"}}>{new Date(s.createdAt).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}
