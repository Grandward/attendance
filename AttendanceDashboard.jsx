import { useState, useEffect, useRef } from "react";

const SAMPLE_LOG = [
  { ts: "2025-05-10 08:02:11", type: "ATTEND", id: 3,  conf: 87, status: "Present" },
  { ts: "2025-05-10 08:14:33", type: "ATTEND", id: 7,  conf: 92, status: "Present" },
  { ts: "2025-05-10 08:21:05", type: "ATTEND", id: 1,  conf: 78, status: "Present" },
  { ts: "2025-05-10 09:00:00", type: "ENROLL", id: 8,  conf: null, status: "Registered" },
  { ts: "2025-05-10 09:05:44", type: "ATTEND", id: 5,  conf: 95, status: "Present" },
  { ts: "2025-05-10 09:17:22", type: "ATTEND", id: 2,  conf: 65, status: "Present" },
  { ts: "2025-05-10 10:02:55", type: "ATTEND", id: 9,  conf: 0,  status: "Access Denied" },
  { ts: "2025-05-10 10:33:10", type: "ATTEND", id: 4,  conf: 88, status: "Present" },
];

const USER_NAMES = {1:"Arjun Mehta",2:"Priya Sharma",3:"Rohan Gupta",4:"Sneha Patel",
                   5:"Karan Singh",6:"Divya Nair",7:"Aditya Kumar",8:"Kavya Joshi",9:"Unknown"};

function parseCSVLine(line) {
  // Format: 2025-05-10 08:02:11,ATTEND,ID:3,Conf:87,Present
  const parts = line.trim().split(",");
  if (parts.length < 3) return null;
  const ts   = parts[0] + "," + (parts[1] || "");  // handle date,time split
  // handle both "date time" in one field and "date,time" split
  let restIdx = 1;
  let timestamp = parts[0];
  if (/^\d{2}:\d{2}/.test(parts[1])) { timestamp += " " + parts[1]; restIdx = 2; }
  const type   = parts[restIdx];
  const idPart = parts[restIdx + 1] || "";
  const confPart= parts[restIdx + 2] || "";
  const status = parts[restIdx + 3] || "";
  const id     = parseInt(idPart.replace("ID:", "")) || 0;
  const conf   = confPart.includes("Conf:") ? parseInt(confPart.replace("Conf:", "")) : null;
  return { ts: timestamp.trim(), type: type?.trim(), id, conf, status: status.trim() };
}

export default function App() {
  const [logs, setLogs]         = useState(SAMPLE_LOG);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [filter, setFilter]     = useState("ALL");
  const [simStatus, setSimStatus] = useState("");
  const [simColor, setSimColor]  = useState("green");
  const fileRef = useRef();

  // ── Stats ─────────────────────────────────────────────
  const today     = logs.filter(l => l.type === "ATTEND");
  const present   = today.filter(l => l.status === "Present").length;
  const denied    = today.filter(l => l.status === "Access Denied").length;
  const enrolled  = logs.filter(l => l.type === "ENROLL").length;
  const uniqueIDs = [...new Set(today.filter(l=>l.status==="Present").map(l=>l.id))];

  // ── Simulate a scan ───────────────────────────────────
  function simulateScan() {
    const roll = Math.random();
    if (roll < 0.15) {
      setSimStatus("⛔ ACCESS DENIED – Unknown finger");
      setSimColor("#ef4444");
      setLogs(prev => [{
        ts: new Date().toISOString().replace("T"," ").slice(0,19),
        type:"ATTEND", id:9, conf:0, status:"Access Denied"
      }, ...prev]);
    } else {
      const id = [1,2,3,4,5,6,7][Math.floor(Math.random()*7)];
      const conf = 60 + Math.floor(Math.random()*35);
      setSimStatus(`✅ SCAN OK – User ID: ${id} (${USER_NAMES[id]}) | Confidence: ${conf}`);
      setSimColor("#22c55e");
      setLogs(prev => [{
        ts: new Date().toISOString().replace("T"," ").slice(0,19),
        type:"ATTEND", id, conf, status:"Present"
      }, ...prev]);
    }
    setTimeout(() => setSimStatus(""), 4000);
  }

  // ── Import CSV from SD card ────────────────────────────
  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const lines   = ev.target.result.split("\n").filter(Boolean);
      const parsed  = lines.map(parseCSVLine).filter(Boolean);
      setLogs(parsed.reverse());
    };
    reader.readAsText(file);
  }

  // ── Filtered log ─────────────────────────────────────
  const displayed = logs.filter(l =>
    filter === "ALL"    ? true :
    filter === "ATTEND" ? l.type === "ATTEND" && l.status === "Present" :
    filter === "DENIED" ? l.status === "Access Denied" :
    l.type === "ENROLL"
  );

  const confColor = c => c >= 80 ? "#22c55e" : c >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{
      minHeight:"100vh", background:"#0b0f1a", color:"#e2e8f0",
      fontFamily:"'Courier New', monospace", padding:"0"
    }}>
      {/* ── Header ── */}
      <div style={{
        background:"linear-gradient(135deg,#1e293b,#0f172a)",
        borderBottom:"1px solid #334155", padding:"20px 28px",
        display:"flex", alignItems:"center", justifyContent:"space-between"
      }}>
        <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
          <div style={{
            width:40, height:40, background:"#3b82f6",
            borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:20
          }}>🖐</div>
          <div>
            <div style={{fontSize:18,fontWeight:700,letterSpacing:"0.05em",color:"#f1f5f9"}}>
              FINGER<span style={{color:"#3b82f6"}}>TRACK</span>
            </div>
            <div style={{fontSize:11,color:"#64748b",letterSpacing:"0.1em"}}>
              BIOMETRIC ATTENDANCE SYSTEM
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={() => fileRef.current.click()} style={btnStyle("#1e293b","#3b82f6")}>
            📂 Import CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} style={{display:"none"}}/>
          <button onClick={simulateScan} style={btnStyle("#1e40af","#3b82f6",true)}>
            👆 Simulate Scan
          </button>
        </div>
      </div>

      {/* ── Sim status bar ── */}
      {simStatus && (
        <div style={{
          background:simColor+"22", borderBottom:`2px solid ${simColor}`,
          padding:"10px 28px", fontSize:13, color:simColor,
          letterSpacing:"0.05em", fontWeight:600
        }}>
          {simStatus}
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{display:"flex",gap:0,borderBottom:"1px solid #1e293b",padding:"0 28px"}}>
        {["dashboard","log"].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            background:"none", border:"none", color: activeTab===t ? "#3b82f6" : "#475569",
            padding:"12px 20px", cursor:"pointer", fontSize:13, letterSpacing:"0.08em",
            textTransform:"uppercase", borderBottom: activeTab===t ? "2px solid #3b82f6" : "2px solid transparent",
            fontFamily:"inherit", fontWeight: activeTab===t ? 700 : 400
          }}>{t}</button>
        ))}
      </div>

      <div style={{padding:"24px 28px"}}>
        {activeTab === "dashboard" && (
          <>
            {/* ── Stat cards ── */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:16,marginBottom:28}}>
              {[
                {label:"PRESENT TODAY", value:present, icon:"✅", color:"#22c55e"},
                {label:"DENIED",        value:denied,  icon:"⛔", color:"#ef4444"},
                {label:"ENROLLED",      value:enrolled, icon:"🖐", color:"#3b82f6"},
                {label:"UNIQUE IDs",    value:uniqueIDs.length, icon:"👤", color:"#a855f7"},
              ].map(s => (
                <div key={s.label} style={{
                  background:"#1e293b", borderRadius:10, padding:"18px 20px",
                  borderLeft:`3px solid ${s.color}`
                }}>
                  <div style={{fontSize:22,marginBottom:6}}>{s.icon}</div>
                  <div style={{fontSize:28,fontWeight:700,color:s.color}}>{s.value}</div>
                  <div style={{fontSize:10,color:"#475569",letterSpacing:"0.1em"}}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* ── Confidence bar chart ── */}
            <div style={{background:"#1e293b",borderRadius:10,padding:"20px",marginBottom:20}}>
              <div style={{fontSize:12,color:"#64748b",letterSpacing:"0.1em",marginBottom:16}}>
                SCAN CONFIDENCE SCORES
              </div>
              {logs.filter(l=>l.conf!==null && l.conf > 0).slice(0,10).map((l,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
                  <div style={{width:60,fontSize:11,color:"#94a3b8",flexShrink:0}}>
                    ID:{l.id}
                  </div>
                  <div style={{flex:1,height:14,background:"#0f172a",borderRadius:3,overflow:"hidden"}}>
                    <div style={{
                      width:`${l.conf}%`, height:"100%",
                      background:`linear-gradient(90deg,${confColor(l.conf)},${confColor(l.conf)}88)`,
                      borderRadius:3, transition:"width 0.4s"
                    }}/>
                  </div>
                  <div style={{width:36,fontSize:11,color:confColor(l.conf),textAlign:"right"}}>
                    {l.conf}%
                  </div>
                </div>
              ))}
            </div>

            {/* ── Recent present users ── */}
            <div style={{background:"#1e293b",borderRadius:10,padding:"20px"}}>
              <div style={{fontSize:12,color:"#64748b",letterSpacing:"0.1em",marginBottom:14}}>
                TODAY'S ATTENDANCE
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
                {uniqueIDs.map(id => (
                  <div key={id} style={{
                    background:"#0f172a", borderRadius:8, padding:"8px 14px",
                    border:"1px solid #22c55e33", fontSize:12
                  }}>
                    <span style={{color:"#22c55e",fontWeight:700}}>ID:{id}</span>
                    <span style={{color:"#94a3b8",marginLeft:8}}>{USER_NAMES[id]||"Unknown"}</span>
                  </div>
                ))}
                {uniqueIDs.length === 0 && <span style={{color:"#475569",fontSize:13}}>No attendance yet</span>}
              </div>
            </div>
          </>
        )}

        {activeTab === "log" && (
          <>
            {/* ── Filter bar ── */}
            <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
              {["ALL","ATTEND","DENIED","ENROLL"].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  background: filter===f ? "#3b82f6" : "#1e293b",
                  color: filter===f ? "#fff" : "#64748b",
                  border:"1px solid " + (filter===f ? "#3b82f6" : "#334155"),
                  borderRadius:6, padding:"6px 14px", fontSize:11,
                  cursor:"pointer", fontFamily:"inherit", letterSpacing:"0.08em"
                }}>{f}</button>
              ))}
              <span style={{color:"#334155",fontSize:12,alignSelf:"center",marginLeft:"auto"}}>
                {displayed.length} record{displayed.length!==1?"s":""}
              </span>
            </div>

            {/* ── Log table ── */}
            <div style={{background:"#1e293b",borderRadius:10,overflow:"hidden"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr style={{background:"#0f172a",color:"#475569",letterSpacing:"0.08em"}}>
                    {["TIMESTAMP","TYPE","USER ID","NAME","CONFIDENCE","STATUS"].map(h=>(
                      <th key={h} style={{padding:"10px 14px",textAlign:"left",fontWeight:600}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((l,i) => (
                    <tr key={i} style={{
                      borderTop:"1px solid #0f172a",
                      background: i%2===0 ? "#1e293b" : "#192032"
                    }}>
                      <td style={{padding:"9px 14px",color:"#64748b",fontFamily:"monospace"}}>{l.ts}</td>
                      <td style={{padding:"9px 14px"}}>
                        <span style={{
                          background: l.type==="ATTEND" ? "#1e3a5f" : "#2d1b69",
                          color:       l.type==="ATTEND" ? "#60a5fa" : "#a78bfa",
                          padding:"2px 8px", borderRadius:4, fontSize:10, letterSpacing:"0.08em"
                        }}>{l.type}</span>
                      </td>
                      <td style={{padding:"9px 14px",color:"#f1f5f9",fontWeight:700}}>
                        {l.id || "—"}
                      </td>
                      <td style={{padding:"9px 14px",color:"#94a3b8"}}>
                        {USER_NAMES[l.id] || "—"}
                      </td>
                      <td style={{padding:"9px 14px"}}>
                        {l.conf != null && l.conf > 0
                          ? <span style={{color:confColor(l.conf),fontWeight:600}}>{l.conf}%</span>
                          : <span style={{color:"#334155"}}>—</span>}
                      </td>
                      <td style={{padding:"9px 14px"}}>
                        <span style={{
                          color: l.status==="Present"    ? "#22c55e"
                               : l.status==="Access Denied" ? "#ef4444"
                               : "#a855f7"
                        }}>{l.status}</span>
                      </td>
                    </tr>
                  ))}
                  {displayed.length===0 && (
                    <tr><td colSpan={6} style={{padding:24,textAlign:"center",color:"#334155"}}>
                      No records match this filter
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{padding:"16px 28px",borderTop:"1px solid #1e293b",fontSize:11,color:"#334155",
                   display:"flex",justifyContent:"space-between"}}>
        <span>FingerTrack v1.0 · Arduino R305/R307 · SD CSV: attend.csv</span>
        <span>Import your SD card's attend.csv to view real data</span>
      </div>
    </div>
  );
}

function btnStyle(bg, border, primary=false) {
  return {
    background: primary ? "#1d4ed8" : bg,
    color: "#e2e8f0",
    border: `1px solid ${border}`,
    borderRadius: 7, padding: "8px 16px", cursor: "pointer",
    fontSize: 12, fontFamily: "'Courier New', monospace",
    letterSpacing: "0.05em", fontWeight: 600,
    transition: "background 0.2s"
  };
}
