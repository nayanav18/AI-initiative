/*
function shortLabel(raw) {
  if (!raw) return "";
  const s = String(raw);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const m = s.match(/(\d{4})[.\-\/](\d{1,2})/);
  if (m) {
    const yr = m[1].slice(2);
    const mo = parseInt(m[2], 10) - 1;
    if (mo >= 0 && mo < 12) return `${months[mo]}-${yr}`;
  }
  return s.length <= 7 ? s : s.slice(0, 7);
}

export default function MiniChart({ chart }) {
  if (!chart?.data?.length) return null;
  const W = 460, H = 120, PAD = 14, BOTTOM = 22;
  const vals = chart.data.map(d => parseFloat(d.value) || 0);
  const max = Math.max(...vals), min = Math.min(...vals), range = max - min || 1;
  const n = chart.data.length;
  const maxLabels = 12;
  const step = n <= maxLabels ? 1 : Math.ceil(n / maxLabels);

  if (chart.type === "bar") {
    const slot = (W - PAD * 2) / n;
    const barW = Math.max(6, slot - 4);
    return (
      <div>
        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6, fontWeight: 600 }}>{chart.title}</div>
        <svg width="100%" viewBox={`0 0 ${W} ${H + BOTTOM}`} style={{ overflow: "visible" }}>
          <defs>
            <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6"/><stop offset="100%" stopColor="#1d4ed8"/>
            </linearGradient>
          </defs>
          {chart.data.map((d, i) => {
            const x = PAD + i * slot + (slot - barW) / 2;
            const bh = Math.max(2, ((vals[i] - min) / range) * (H - PAD * 2));
            const isMax = vals[i] === max, isMin = vals[i] === min;
            const showLabel = i % step === 0 || i === n - 1;
            return (
              <g key={i}>
                <rect x={x} y={H - bh} width={barW} height={bh} rx="3"
                  fill={isMax ? "#22c55e" : isMin ? "#ef4444" : "url(#bg)"} opacity={isMax||isMin?1:0.8}/>
                {(isMax||isMin) && (
                  <text x={x+barW/2} y={H-bh-6} textAnchor="middle" fontSize="9"
                    fill={isMax?"#4ade80":"#f87171"} fontWeight="700">
                    {Number(vals[i]).toLocaleString()}
                  </text>
                )}
                {showLabel && (
                  <text x={x+barW/2} y={H+15} textAnchor="middle" fontSize="8" fill="#475569">
                    {shortLabel(d.label)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  const pts = chart.data.map((d, i) => [
    PAD + (n === 1 ? (W-PAD*2)/2 : (i/(n-1))*(W-PAD*2)),
    PAD + (1-(vals[i]-min)/range)*(H-PAD*2),
  ]);
  const line = pts.map((p,i) => `${i===0?"M":"L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = pts.length > 1 ? line + ` L${pts[pts.length-1][0]},${H} L${pts[0][0]},${H} Z` : "";

  return (
    <div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6, fontWeight: 600 }}>{chart.title}</div>
      <svg width="100%" viewBox={`0 0 ${W} ${H + BOTTOM}`} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="agrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18"/>
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {area && <path d={area} fill="url(#agrad)"/>}
        <path d={line} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        {pts.map((p, i) => {
          const isMax = vals[i]===max, isMin = vals[i]===min, isLast = i===n-1;
          const showLabel = i % step === 0 || isLast;
          const showValue = isMax || isMin || isLast;
          return (
            <g key={i}>
              <circle cx={p[0]} cy={p[1]} r={isMax||isMin?5:3}
                fill={isMax?"#22c55e":isMin?"#ef4444":"#3b82f6"}
                stroke="#0f172a" strokeWidth="1.5"/>
              {showValue && (
                <text x={p[0]} y={p[1]-9} textAnchor="middle" fontSize="9" fontWeight="700"
                  fill={isMax?"#4ade80":isMin?"#f87171":"#93c5fd"}>
                  {Number(vals[i]).toLocaleString()}
                </text>
              )}
              {showLabel && (
                <text x={p[0]} y={H+16} textAnchor="middle" fontSize="8" fill="#475569">
                  {shortLabel(chart.data[i].label)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
*/
function shortLabel(raw) {
  if (!raw) return "";
  const s = String(raw);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const m = s.match(/(\d{4})[.\-\/](\d{1,2})/);
  if (m) {
    const yr = m[1].slice(2);
    const mo = parseInt(m[2], 10) - 1;
    if (mo >= 0 && mo < 12) return `${months[mo]}-${yr}`;
  }
  return s.length <= 7 ? s : s.slice(0, 7);
}

export default function MiniChart({ chart }) {
  if (!chart?.data?.length) return null;
  
  // Keep base coordination geometry unified 
  const W = 460, H = 120, PAD = 14, BOTTOM = 25;
  const vals = chart.data.map(d => parseFloat(d.value) || 0);
  const max = Math.max(...vals), min = Math.min(...vals), range = max - min || 1;
  const n = chart.data.length;
  const maxLabels = 12;
  const step = n <= maxLabels ? 1 : Math.ceil(n / maxLabels);

  const renderSvgContent = () => {
    if (chart.type === "bar") {
      const slot = (W - PAD * 2) / n;
      const barW = Math.max(6, slot - 4);
      return (
        <svg 
          width="100%" 
          height="100%" 
          viewBox={`0 0 ${W} ${H + BOTTOM}`} 
          style={{ display: "block", overflow: "visible" }}
        >
          <defs>
            <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6"/><stop offset="100%" stopColor="#1d4ed8"/>
            </linearGradient>
          </defs>
          {chart.data.map((d, i) => {
            const x = PAD + i * slot + (slot - barW) / 2;
            const bh = Math.max(2, ((vals[i] - min) / range) * (H - PAD * 2));
            const isMax = vals[i] === max, isMin = vals[i] === min;
            const showLabel = i % step === 0 || i === n - 1;
            return (
              <g key={i}>
                <rect x={x} y={H - bh} width={barW} height={bh} rx="3"
                  fill={isMax ? "#22c55e" : isMin ? "#ef4444" : "url(#bg)"} opacity={isMax||isMin?1:0.8}/>
                {(isMax||isMin) && (
                  <text x={x+barW/2} y={H-bh-6} textAnchor="middle" fontSize="9"
                    fill={isMax?"#4ade80":"#f87171"} fontWeight="700">
                    {Number(vals[i]).toLocaleString()}
                  </text>
                )}
                {showLabel && (
                  <text x={x+barW/2} y={H+15} textAnchor="middle" fontSize="8" fill="#475569">
                    {shortLabel(d.label)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      );
    }

    // Line / Area Layout
    const pts = chart.data.map((d, i) => [
      PAD + (n === 1 ? (W-PAD*2)/2 : (i/(n-1))*(W-PAD*2)),
      PAD + (1-(vals[i]-min)/range)*(H-PAD*2),
    ]);
    const line = pts.map((p,i) => `${i===0?"M":"L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
    const area = pts.length > 1 ? line + ` L${pts[pts.length-1][0]},${H} L${pts[0][0]},${H} Z` : "";

    return (
      <svg 
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${W} ${H + BOTTOM}`} 
        style={{ display: "block", overflow: "visible" }}
      >
        <defs>
          <linearGradient id="agrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18"/>
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {area && <path d={area} fill="url(#agrad)"/>}
        <path d={line} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        {pts.map((p, i) => {
          const isMax = vals[i]===max, isMin = vals[i]===min, isLast = i===n-1;
          const showLabel = i % step === 0 || isLast;
          const showValue = isMax || isMin || isLast;
          return (
            <g key={i}>
              <circle cx={p[0]} cy={p[1]} r={isMax||isMin?5:3}
                fill={isMax?"#22c55e":isMin?"#ef4444":"#3b82f6"}
                stroke="#0f172a" strokeWidth="1.5"/>
              {showValue && (
                <text x={p[0]} y={p[1]-9} textAnchor="middle" fontSize="9" fontWeight="700"
                  fill={isMax?"#4ade80":isMin?"#f87171":"#93c5fd"}>
                  {Number(vals[i]).toLocaleString()}
                </text>
              )}
              {showLabel && (
                <text x={p[0]} y={H+16} textAnchor="middle" fontSize="8" fill="#475569">
                  {shortLabel(chart.data[i].label)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6, fontWeight: 600, flexShrink: 0 }}>
        {chart.title}
      </div>
      {/* Wrapper to control layout and maintain scaling safety */}
      <div style={{ flex: 1, minHeight: 0, width: "100%", height: "100%" }}>
        {renderSvgContent()}
      </div>
    </div>
  );
}
