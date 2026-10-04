import { useState } from "react";

const DATA = {
  complex: "두산위브",
  type: "84㎡ (32평)",
  analysisDate: "2026.04.14",
  baselines: {
    real: { value: 7.23, label: "실거래 기준가", desc: "180일 이내 중층 10건 중위가", color: "#ef4444" },
    ask:  { value: 7.50, label: "호가 기준가",   desc: "중층 매물 5건 중위가",         color: "#f59e0b" },
    jeonse:{ value: 5.00,label: "전세 기준가",   desc: "신규 전세 2건 평균 ⚠ 소수",    color: "#3b82f6" },
  },
  summary: { text: "8개 매물 중 시세 수준 1건·비싼 매물 7건. 찐 급매·관심 매물 없어요.", color: "blue" },
  deductions: [
    { condition: "1층", dynamic: true,  value: 8.7, note: "115동 1층 6.6억 실거래 기반 (26.01.31)" },
    { condition: "2층", dynamic: true,  value: 0,   note: "109동 2층 7.8억 실거래 — 기준가보다 높아 0%p 처리" },
    { condition: "탑층",dynamic: false, value: 3.0, note: "기본 추정치 ⚠ (180일 내 탑층 거래 없음)" },
  ],
  realTx: [
    { date:"26.03.28", dong:"107동", floor:3,  price:6.85, included:true,  note:"기준가 포함 (3층=중층)" },
    { date:"26.03.28", dong:"102동", floor:17, price:7.45, included:true,  note:"기준가 포함" },
    { date:"26.02.27", dong:"106동", floor:12, price:7.50, included:true,  note:"기준가 포함" },
    { date:"26.02.27", dong:"109동", floor:2,  price:7.80, included:false, note:"2층 — 감점 산출용 (0%p)" },
    { date:"26.01.31", dong:"107동", floor:11, price:7.33, included:true,  note:"기준가 포함" },
    { date:"26.01.31", dong:"115동", floor:1,  price:6.60, included:false, note:"1층 — 감점 동적 산출용 (8.7%p)" },
    { date:"26.01.31", dong:"117동", floor:18, price:7.20, included:true,  note:"기준가 포함" },
    { date:"25.11.22", dong:"109동", floor:6,  price:7.00, included:true,  note:"기준가 포함" },
    { date:"25.11.22", dong:"118동", floor:6,  price:7.10, included:true,  note:"기준가 포함" },
    { date:"25.11.22", dong:"115동", floor:8,  price:7.25, included:true,  note:"기준가 포함" },
    { date:"25.11.22", dong:"115동", floor:5,  price:7.80, included:true,  note:"기준가 포함" },
    { date:"25.10.19", dong:"115동", floor:21, price:4.70, included:false, note:"직거래 이상치 — 제외" },
    { date:"25.10.19", dong:"106동", floor:10, price:7.20, included:true,  note:"기준가 포함" },
    { date:"25.09.26", dong:"102동", floor:5,  price:6.95, included:false, note:"180일 초과" },
    { date:"25.08.28", dong:"116동", floor:22, price:6.95, included:false, note:"180일 초과" },
    { date:"25.07.01", dong:"109동", floor:7,  price:7.10, included:false, note:"180일 초과" },
    { date:"25.03.31", dong:"106동", floor:25, price:7.07, included:false, note:"탑층·180일 초과" },
  ],
  jeonseTx: [
    { source:"실거래(신규)", date:"26.02.27", dong:"102동", floor:7,  price:5.0, included:true,  note:"" },
    { source:"실거래(신규)", date:"26.01.31", dong:"109동", floor:24, price:5.0, included:true,  note:"" },
    { source:"실거래(신규)", date:"26.03.28", dong:"102동", floor:1,  price:4.9, included:false, note:"1층 — 제외" },
    { source:"갱신",         date:"26.02.27", dong:"102동", floor:12, price:4.2, included:false, note:"갱신 — 시세 미반영" },
    { source:"갱신",         date:"26.01.31", dong:"107동", floor:7,  price:4.6, included:false, note:"갱신 — 시세 미반영" },
    { source:"갱신",         date:"25.12.18", dong:"116동", floor:19, price:4.95,included:false, note:"갱신 — 시세 미반영" },
  ],
  listings: [
    {
      id:1, dong:"116동", floor:"8층", price:7.2, dir:"남동향", note:"세안고",
      rawDiscount:-0.4, deductTotal:0, adjustedDiscount:-0.4, deductDetail:"",
      signals:[],
      gap:2.2, jeonseRate:69,
      comment:"8개 매물 중 실거래에 가장 근접해요. 세입자가 있어서 바로 입주는 어려워요.",
      beginnerGuide:[
        "실거래 기준가 7.23억: 최근 6개월 안에 비슷한 층에서 실제 거래된 중간 가격이에요.",
        "보정 할인율 -0.4%: 실거래보다 약 300만원 싸다는 뜻이에요. 차이가 거의 없어요.",
        "세안고: 전세 세입자가 있는 집이에요. 집주인이 바뀌어도 계약기간엔 못 들어가요.",
        "갭 2.2억: 이 집을 사고 전세를 놓으면 내 돈이 2.2억 필요해요.",
        "전세가율 69%: 집값의 69%가 전세금이에요.",
        "⚪ 시세 수준: 8개 중 유일하게 실거래에 근접한 매물이에요.",
      ]
    },
    {
      id:2, dong:"109동", floor:"3층", price:7.3, dir:"남동향", note:"급매 표기·입주협의",
      rawDiscount:1.0, deductTotal:0, adjustedDiscount:1.0, deductDetail:"",
      signals:[{ type:"urgent", label:"⚡ 급처분 표기" }],
      gap:2.3, jeonseRate:68,
      comment:"급매라고 써 있지만 실거래보다 700만원 비싸요. 광고 문구와 가격이 다른 케이스예요.",
      beginnerGuide:[
        "실거래 기준가 7.23억: 최근 6개월 안에 비슷한 층에서 실제 거래된 중간 가격이에요.",
        "보정 할인율 +1.0%: +는 실거래보다 비싸다는 뜻이에요. 700만원 더 비싸요.",
        "⚡ 급처분 표기: 광고에 '급매'라고 썼지만 실거래보다 비싼 가격이에요.",
        "갭 2.3억: 이 집을 사고 전세를 놓으면 내 돈이 2.3억 필요해요.",
        "🔵 비싼 매물: '급매' 문구에 속지 마세요. 가격이 실거래보다 비쌔요.",
      ]
    },
    {
      id:3, dong:"107동", floor:"12층", price:7.3, dir:"남서향", note:"전체수리·가격조정가능",
      rawDiscount:1.0, deductTotal:0, adjustedDiscount:1.0, deductDetail:"",
      signals:[],
      gap:2.3, jeonseRate:68,
      comment:"올수리에 가격 조정도 된다지만, 실거래보다 700만원 비싸요.",
      beginnerGuide:[
        "실거래 기준가 7.23억: 최근 6개월 안에 비슷한 층에서 실제 거래된 중간 가격이에요.",
        "보정 할인율 +1.0%: 실거래보다 700만원 비싸다는 뜻이에요.",
        "가격조정가능: 협상 여지를 내비치는 표현이지만, 실거래 이하로 내려올지는 미지수예요.",
        "갭 2.3억: 이 집을 사고 전세를 놓으면 내 돈이 2.3억 필요해요.",
        "🔵 비싼 매물: 올수리 매물이지만 가격이 이미 수리비를 반영한 수준이에요.",
      ]
    },
    {
      id:4, dong:"106동", floor:"11층", price:7.5, dir:"남서향", note:"로얄층",
      rawDiscount:3.7, deductTotal:0, adjustedDiscount:3.7, deductDetail:"",
      signals:[],
      gap:2.5, jeonseRate:67,
      comment:"로얄층이지만 실거래보다 2,700만원 비싸요.",
      beginnerGuide:[
        "실거래 기준가 7.23억: 최근 6개월 안에 비슷한 층에서 실제 거래된 중간 가격이에요.",
        "보정 할인율 +3.7%: 실거래보다 2,700만원 비싸다는 뜻이에요.",
        "갭 2.5억: 이 집을 사고 전세를 놓으면 내 돈이 2.5억 필요해요.",
        "🔵 비싼 매물: 로얄층 프리미엄이 붙었지만 실거래 기준으로는 비싼 매물이에요.",
      ]
    },
    {
      id:5, dong:"109동", floor:"중층", price:7.9, dir:"남동향", note:"올리모델링",
      rawDiscount:9.3, deductTotal:0, adjustedDiscount:9.3, deductDetail:"",
      signals:[],
      gap:2.9, jeonseRate:63,
      comment:"올리모델링 비용이 가격에 크게 반영됐어요. 실거래보다 6,700만원 비싸요.",
      beginnerGuide:[
        "실거래 기준가 7.23억: 최근 6개월 안에 비슷한 층에서 실제 거래된 중간 가격이에요.",
        "보정 할인율 +9.3%: 실거래보다 6,700만원 비싸다는 뜻이에요.",
        "올리모델링: 인테리어를 전부 새로 한 집이에요. 그 비용이 가격에 포함돼 있어요.",
        "갭 2.9억: 이 집을 사고 전세를 놓으면 내 돈이 2.9억 필요해요.",
        "🔵 비싼 매물: 실거래보다 많이 비싼 매물이에요.",
      ]
    },
    {
      id:6, dong:"107동", floor:"20층", price:8.2, dir:"남서향", note:"올수리",
      rawDiscount:13.4, deductTotal:0, adjustedDiscount:13.4, deductDetail:"",
      signals:[],
      gap:3.2, jeonseRate:61,
      comment:"고층 올수리 프리미엄이 크게 붙었어요. 실거래보다 9,700만원 비싸요.",
      beginnerGuide:[
        "실거래 기준가 7.23억: 최근 6개월 안에 비슷한 층에서 실제 거래된 중간 가격이에요.",
        "보정 할인율 +13.4%: 실거래보다 9,700만원(약 1억) 비싸다는 뜻이에요.",
        "올수리 고층: 높은 층 조망과 새 인테리어 프리미엄이 모두 가격에 반영됐어요.",
        "갭 3.2억: 이 집을 사고 전세를 놓으면 내 돈이 3.2억 필요해요.",
        "🔵 비싼 매물: 실거래보다 약 1억 비싸요.",
      ]
    },
    {
      id:7, dong:"115동", floor:"저층", price:8.2, dir:"남동향", note:"",
      rawDiscount:13.4, deductTotal:0, adjustedDiscount:13.4, deductDetail:"",
      signals:[],
      gap:3.2, jeonseRate:61,
      comment:"저층인데도 실거래보다 9,700만원 비싸요. 납득하기 어려운 가격이네요.",
      beginnerGuide:[
        "실거래 기준가 7.23억: 최근 6개월 안에 비슷한 층에서 실제 거래된 중간 가격이에요.",
        "보정 할인율 +13.4%: 실거래보다 9,700만원 비싸다는 뜻이에요.",
        "저층인데 비쌈: 115동 5층이 작년 11월에 7.8억에 거래됐는데, 이 매물은 그보다 4,000만원 더 비싸요.",
        "갭 3.2억: 이 집을 사고 전세를 놓으면 내 돈이 3.2억 필요해요.",
        "🔵 비싼 매물: 저층임에도 실거래보다 많이 비싼 매물이에요.",
      ]
    },
    {
      id:8, dong:"116동", floor:"19층", price:8.2, dir:"남동향", note:"",
      rawDiscount:13.4, deductTotal:0, adjustedDiscount:13.4, deductDetail:"",
      signals:[],
      gap:3.2, jeonseRate:61,
      comment:"실거래보다 9,700만원 비싸요. 급매 아니에요.",
      beginnerGuide:[
        "실거래 기준가 7.23억: 최근 6개월 안에 비슷한 층에서 실제 거래된 중간 가격이에요.",
        "보정 할인율 +13.4%: 실거래보다 9,700만원 비싸다는 뜻이에요.",
        "갭 3.2억: 이 집을 사고 전세를 놓으면 내 돈이 3.2억 필요해요.",
        "🔵 비싼 매물: 실거래보다 많이 비싼 매물이에요.",
      ]
    },
  ],
};

function getGrade(d) {
  if (d <= -8) return { label:"🔴 찐 급매",  bg:"#fef2f2", border:"#fca5a5", text:"#dc2626", bar:"#ef4444" };
  if (d <= -4) return { label:"🟡 관심 매물", bg:"#fefce8", border:"#fde047", text:"#ca8a04", bar:"#eab308" };
  if (d <= 0)  return { label:"⚪ 시세 수준", bg:"#f9fafb", border:"#d1d5db", text:"#6b7280", bar:"#9ca3af" };
  return         { label:"🔵 비싼 매물", bg:"#eff6ff", border:"#93c5fd", text:"#2563eb", bar:"#3b82f6" };
}

function fmt(v) { return `${v}억`; }
function fmtFull(v) {
  const e = Math.floor(v);
  const m = Math.round((v - e) * 10000);
  return m === 0 ? `${e}억` : `${e}억 ${m.toLocaleString()}만`;
}

const summaryBg   = { red:"#fef2f2", yellow:"#fefce8", blue:"#eff6ff" };
const summaryText = { red:"#dc2626", yellow:"#92400e", blue:"#1e40af" };
const sortedListings = [...DATA.listings].sort((a,b) => a.adjustedDiscount - b.adjustedDiscount);

function BaselineCard({ item }) {
  return (
    <div style={{ flex:"1 1 0", minWidth:90, background:"#fff", borderRadius:10, padding:"10px 12px", border:`1.5px solid ${item.color}22`, textAlign:"center" }}>
      <div style={{ fontSize:11, color:"#888", marginBottom:2 }}>{item.label}</div>
      <div style={{ fontSize:20, fontWeight:800, color:item.color }}>{fmt(item.value)}</div>
      <div style={{ fontSize:10, color:"#aaa", marginTop:2 }}>{item.desc}</div>
    </div>
  );
}

function SignalBadge({ signal }) {
  const colors = {
    priceDown: { bg:"#fef2f2", text:"#dc2626" },
    repair:    { bg:"#f0fdf4", text:"#16a34a" },
    urgent:    { bg:"#fefce8", text:"#ca8a04" },
    negotiate: { bg:"#eff6ff", text:"#2563eb" },
  };
  const c = colors[signal.type] || { bg:"#f9fafb", text:"#6b7280" };
  return (
    <span style={{ display:"inline-block", fontSize:11, padding:"2px 8px", borderRadius:99, background:c.bg, color:c.text, marginRight:4, marginBottom:4 }}>
      {signal.label}
    </span>
  );
}

function BeginnerToggle({ items }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop:8 }}>
      <button onClick={() => setOpen(!open)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:12.5, color:"#6b7280", padding:0, display:"flex", alignItems:"center", gap:4 }}>
        <span style={{ transform:open?"rotate(90deg)":"rotate(0deg)", transition:"transform 0.2s", display:"inline-block" }}>▶</span>
        이게 뭔 뜻이에요?
      </button>
      {open && (
        <div style={{ background:"#F9FAFB", borderRadius:8, padding:"10px 12px", marginTop:6, fontSize:12, color:"#555", lineHeight:1.8 }}>
          {items.map((item,i) => <div key={i}>• {item}</div>)}
        </div>
      )}
    </div>
  );
}

function ListingCard({ item }) {
  const grade = getGrade(item.adjustedDiscount);
  const diffAmount = Math.abs(Math.round((DATA.baselines.real.value - item.price) * 10000));
  const diffLabel = item.adjustedDiscount <= 0
    ? `${diffAmount.toLocaleString()}만 저렴`
    : `${diffAmount.toLocaleString()}만 비쌈`;

  return (
    <div style={{ background:grade.bg, border:`1.5px solid ${grade.border}`, borderRadius:14, padding:"16px 16px 14px", marginBottom:12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
        <div>
          <span style={{ fontSize:13, fontWeight:700, color:"#333" }}>{item.dong} {item.floor}</span>
          <span style={{ fontSize:11, color:"#999", marginLeft:6 }}>{item.dir}</span>
          {item.note && <span style={{ fontSize:10, color:"#aaa", marginLeft:6 }}>{item.note}</span>}
        </div>
        <span style={{ fontSize:12, fontWeight:700, color:grade.text, background:`${grade.text}15`, padding:"3px 10px", borderRadius:99 }}>{grade.label}</span>
      </div>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:4 }}>
        <div style={{ fontSize:26, fontWeight:900, color:"#111" }}>{fmtFull(item.price)}</div>
        <div style={{ fontSize:24, fontWeight:900, color:grade.bar }}>
          {item.adjustedDiscount <= 0 ? "" : "+"}{item.adjustedDiscount.toFixed(1)}%
        </div>
      </div>
      <div style={{ fontSize:12, color:"#888", marginBottom:10 }}>실거래 대비 {diffLabel}</div>

      {item.deductTotal > 0 && (
        <div style={{ background:"#fffbeb", borderRadius:8, padding:"6px 10px", marginBottom:8, fontSize:11 }}>
          <span style={{ color:"#f59e0b", fontWeight:600 }}>감점:</span>{" "}
          <span style={{ color:"#92400e" }}>{item.deductDetail}</span>
          <span style={{ color:"#92400e", marginLeft:8 }}>원시 {item.rawDiscount.toFixed(1)}% → 보정 {item.adjustedDiscount.toFixed(1)}%</span>
        </div>
      )}

      {item.signals.length > 0 && (
        <div style={{ marginBottom:8 }}>
          {item.signals.map((s,i) => <SignalBadge key={i} signal={s} />)}
        </div>
      )}

      <div style={{ display:"flex", gap:12, fontSize:12, color:"#666", marginBottom:8, background:"#fff", borderRadius:8, padding:"6px 10px" }}>
        <span>갭 <b style={{ color:"#111" }}>{fmt(item.gap)}</b></span>
        <span>전세가율 <b style={{ color:"#111" }}>{item.jeonseRate}%</b></span>
      </div>

      <div style={{ fontSize:12.5, color:"#444", lineHeight:1.6, background:"#fff", borderRadius:8, padding:"8px 10px" }}>
        💬 {item.comment}
      </div>

      <BeginnerToggle items={item.beginnerGuide} />
    </div>
  );
}

function PriceChart() {
  const allP = DATA.listings.map(l => l.price);
  const minP = Math.min(...allP, DATA.baselines.real.value) - 0.35;
  const maxP = Math.max(...allP) + 0.35;
  const range = maxP - minP;
  const W = 340;
  const toX = (v) => ((v - minP) / range) * W;

  const ticks = [];
  let t = Math.ceil(minP * 2) / 2;
  while (t <= maxP) { ticks.push(t); t = Math.round((t + 0.5) * 10) / 10; }

  return (
    <div style={{ background:"#fff", borderRadius:12, padding:16, marginBottom:16 }}>
      <div style={{ fontSize:13, fontWeight:700, marginBottom:4, color:"#333" }}>기준선 vs 매물 가격 분포</div>
      <div style={{ fontSize:10, color:"#aaa", marginBottom:10 }}>전세기준가 5억은 범위 밖 — 기준선 카드 참고</div>
      <svg width={W + 40} height={sortedListings.length * 28 + 50} style={{ display:"block" }}>
        {ticks.map(v => (
          <g key={v}>
            <line x1={toX(v)+20} y1={15} x2={toX(v)+20} y2={sortedListings.length*28+18} stroke="#f0f0f0" strokeWidth={1} />
            <text x={toX(v)+20} y={sortedListings.length*28+34} textAnchor="middle" fontSize={9.5} fill="#bbb">{v}억</text>
          </g>
        ))}
        {/* 호가기준가 */}
        <line x1={toX(DATA.baselines.ask.value)+20} y1={15} x2={toX(DATA.baselines.ask.value)+20} y2={sortedListings.length*28+18} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4,3" />
        <text x={toX(DATA.baselines.ask.value)+20} y={10} textAnchor="middle" fontSize={8.5} fill="#f59e0b" fontWeight="bold">호가 {fmt(DATA.baselines.ask.value)}</text>
        {/* 실거래기준가 */}
        <line x1={toX(DATA.baselines.real.value)+20} y1={15} x2={toX(DATA.baselines.real.value)+20} y2={sortedListings.length*28+18} stroke="#ef4444" strokeWidth={2} strokeDasharray="6,3" />
        <text x={toX(DATA.baselines.real.value)+20} y={10} textAnchor="middle" fontSize={8.5} fill="#ef4444" fontWeight="bold">실거래 {fmt(DATA.baselines.real.value)}</text>
        {sortedListings.map((item, i) => {
          const grade = getGrade(item.adjustedDiscount);
          const y = 28 + i * 28;
          const cx = toX(item.price) + 20;
          return (
            <g key={item.id}>
              <circle cx={cx} cy={y} r={5} fill={grade.bar} stroke="#fff" strokeWidth={1.5} />
              <text x={cx + 9} y={y + 4} fontSize={9} fill="#555">{item.dong} {item.floor} {fmtFull(item.price)}</text>
            </g>
          );
        })}
      </svg>
      <div style={{ display:"flex", gap:14, justifyContent:"center", marginTop:4, fontSize:10, color:"#999" }}>
        <span>🔴 실거래 기준</span>
        <span>🟡 호가 기준</span>
        <span>● 매물</span>
      </div>
    </div>
  );
}

function DetailTab() {
  return (
    <>
      <div style={{ background:"#fff", borderRadius:12, padding:16, marginBottom:12, overflowX:"auto" }}>
        <div style={{ fontSize:13, fontWeight:700, marginBottom:8 }}>전체 매물 비교표</div>
        <table style={{ width:"100%", minWidth:560, borderCollapse:"collapse", fontSize:11.5 }}>
          <thead>
            <tr style={{ background:"#f8f9fa" }}>
              {["매물","층","매매가","원시","감점","보정","신호","갭","판정"].map(h => (
                <th key={h} style={{ padding:"8px 5px", textAlign:"center", borderBottom:"2px solid #e5e7eb", fontWeight:700, color:"#555", whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedListings.map(item => {
              const grade = getGrade(item.adjustedDiscount);
              return (
                <tr key={item.id} style={{ borderBottom:"1px solid #f0f0f0" }}>
                  <td style={{ padding:"7px 5px", fontWeight:600 }}>{item.dong}</td>
                  <td style={{ padding:"7px 5px", textAlign:"center" }}>{item.floor}</td>
                  <td style={{ padding:"7px 5px", textAlign:"right", fontWeight:700 }}>{fmtFull(item.price)}</td>
                  <td style={{ padding:"7px 5px", textAlign:"center", color:item.rawDiscount<=0?"#16a34a":"#dc2626" }}>{item.rawDiscount.toFixed(1)}%</td>
                  <td style={{ padding:"7px 5px", textAlign:"center", fontSize:10, color:"#f59e0b" }}>{item.deductTotal>0?`+${item.deductTotal}%p⚠`:"-"}</td>
                  <td style={{ padding:"7px 5px", textAlign:"center", fontWeight:700, color:grade.text }}>{item.adjustedDiscount<=0?"":"+"}{item.adjustedDiscount.toFixed(1)}%</td>
                  <td style={{ padding:"7px 5px", textAlign:"center", fontSize:10 }}>{item.signals.length>0?item.signals.map(s=>s.label.split(" ")[0]).join(" "):"-"}</td>
                  <td style={{ padding:"7px 5px", textAlign:"right" }}>{fmt(item.gap)}</td>
                  <td style={{ padding:"7px 5px", textAlign:"center" }}>
                    <span style={{ fontSize:10, padding:"2px 6px", borderRadius:99, background:`${grade.text}15`, color:grade.text, fontWeight:700, whiteSpace:"nowrap" }}>{grade.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ background:"#fff", borderRadius:12, padding:16, marginBottom:12, overflowX:"auto" }}>
        <div style={{ fontSize:13, fontWeight:700, marginBottom:8 }}>매매 실거래 이력</div>
        <table style={{ width:"100%", minWidth:420, borderCollapse:"collapse", fontSize:11.5 }}>
          <thead>
            <tr style={{ background:"#f8f9fa" }}>
              {["계약월","동","층","거래가","포함 여부"].map(h => (
                <th key={h} style={{ padding:"7px 6px", textAlign:"center", borderBottom:"2px solid #e5e7eb", fontWeight:700, color:"#555" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DATA.realTx.map((tx,i) => (
              <tr key={i} style={{ borderBottom:"1px solid #f0f0f0", background:tx.included?"#f0fdf4":"transparent" }}>
                <td style={{ padding:"6px", textAlign:"center" }}>{tx.date}</td>
                <td style={{ padding:"6px", textAlign:"center" }}>{tx.dong}</td>
                <td style={{ padding:"6px", textAlign:"center" }}>{tx.floor}층</td>
                <td style={{ padding:"6px", textAlign:"right", fontWeight:600 }}>{fmtFull(tx.price)}</td>
                <td style={{ padding:"6px", textAlign:"center", fontSize:10 }}>{tx.included?"✅ 포함":tx.note||"—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ background:"#fff", borderRadius:12, padding:16, marginBottom:12, overflowX:"auto" }}>
        <div style={{ fontSize:13, fontWeight:700, marginBottom:8 }}>전세 기준가 출처</div>
        <table style={{ width:"100%", minWidth:380, borderCollapse:"collapse", fontSize:11.5 }}>
          <thead>
            <tr style={{ background:"#f8f9fa" }}>
              {["출처","계약월","동","층","전세가","포함"].map(h => (
                <th key={h} style={{ padding:"7px 6px", textAlign:"center", borderBottom:"2px solid #e5e7eb", fontWeight:700, color:"#555" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DATA.jeonseTx.map((tx,i) => (
              <tr key={i} style={{ borderBottom:"1px solid #f0f0f0" }}>
                <td style={{ padding:"6px", textAlign:"center", fontSize:10, color:tx.source.includes("신규")?"#16a34a":"#f59e0b" }}>{tx.source}</td>
                <td style={{ padding:"6px", textAlign:"center" }}>{tx.date}</td>
                <td style={{ padding:"6px", textAlign:"center" }}>{tx.dong}</td>
                <td style={{ padding:"6px", textAlign:"center" }}>{tx.floor}층</td>
                <td style={{ padding:"6px", textAlign:"right", fontWeight:600 }}>{fmtFull(tx.price)}</td>
                <td style={{ padding:"6px", textAlign:"center" }}>{tx.included?"✅":tx.note||"—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ background:"#fffbeb", borderRadius:10, padding:14 }}>
        <div style={{ fontSize:13, fontWeight:700, marginBottom:8, color:"#92400e" }}>감점 산출 근거</div>
        {DATA.deductions.map((d,i) => (
          <div key={i} style={{ fontSize:12, color:"#78350f", marginBottom:6 }}>
            ■ {d.condition}: {d.dynamic ? `실거래 기반 +${d.value}%p` : `기본 추정치 +${d.value}%p ⚠`} — {d.note}
          </div>
        ))}
        <div style={{ fontSize:11, color:"#a16207", marginTop:8, borderTop:"1px solid #fde68a", paddingTop:8 }}>
          ※ 현재 매물 중 1층·2층·탑층 해당 없음 → 모든 매물 감점 0%p 적용
        </div>
      </div>
    </>
  );
}

export default function App() {
  const [tab, setTab] = useState(0);

  return (
    <div style={{ maxWidth:480, margin:"0 auto", fontFamily:'-apple-system,"Pretendard",sans-serif', background:"#f5f5f7", minHeight:"100vh" }}>
      {/* 헤더 */}
      <div style={{ background:"linear-gradient(135deg,#1e293b 0%,#334155 100%)", color:"#fff", padding:"20px 16px 16px" }}>
        <div style={{ fontSize:11, color:"#94a3b8", marginBottom:4 }}>급매 판별 리포트</div>
        <div style={{ fontSize:20, fontWeight:800, marginBottom:4 }}>{DATA.complex}</div>
        <div style={{ fontSize:11, color:"#94a3b8" }}>
          {DATA.type} · {DATA.analysisDate} 분석 · 매물 {DATA.listings.length}건 · 실거래 {DATA.realTx.filter(t=>t.included).length}건
        </div>
      </div>

      {/* 기준선 카드 */}
      <div style={{ display:"flex", gap:8, padding:"12px 16px 0", flexWrap:"wrap" }}>
        {Object.values(DATA.baselines).map((b,i) => <BaselineCard key={i} item={b} />)}
      </div>

      {/* 요약 배너 */}
      <div style={{ margin:"12px 16px 0", background:summaryBg[DATA.summary.color], borderRadius:10, padding:"10px 14px" }}>
        <div style={{ fontSize:13, fontWeight:700, color:summaryText[DATA.summary.color] }}>{DATA.summary.text}</div>
      </div>

      {/* 탭 */}
      <div style={{ display:"flex", padding:"12px 16px 0", gap:8, marginBottom:12 }}>
        {["📊 급매 판정","📋 상세 비교"].map((label,i) => (
          <button key={i} onClick={() => setTab(i)} style={{ flex:1, padding:"10px 0", borderRadius:10, border:"none", background:tab===i?"#1e293b":"#e2e8f0", color:tab===i?"#fff":"#64748b", fontWeight:700, fontSize:13, cursor:"pointer" }}>
            {label}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <div style={{ padding:"0 16px 16px" }}>
        {tab === 0 && (
          <>
            <PriceChart />
            {sortedListings.map(item => <ListingCard key={item.id} item={item} />)}
          </>
        )}
        {tab === 1 && <DetailTab />}
      </div>

      {/* 면책 */}
      <div style={{ padding:"12px 16px 8px", textAlign:"center" }}>
        <div style={{ fontSize:10, color:"#aaa", lineHeight:1.6 }}>
          이 결과는 참고용이며, 실제 투자 판단은 현장 확인과 전문가 상담 후 결정하세요.
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding:"0 16px 24px" }}>
        <div style={{ borderTop:"1px solid #e5e7eb", paddingTop:16 }}>
          <div style={{ background:"linear-gradient(135deg,#fef9c3 0%,#fef3c7 100%)", border:"1.5px solid #fde68a", borderRadius:14, padding:"20px 18px", textAlign:"center" }}>
            <div style={{ fontSize:15, fontWeight:800, color:"#92400e", marginBottom:8 }}>급매 분석이 도움이 됐다면?</div>
            <div style={{ fontSize:13, color:"#78350f", lineHeight:1.7, marginBottom:14 }}>내집마련 스터디 정보방에서<br />실시간 급매정보를 받아보세요</div>
            <a href="https://open.kakao.com/o/gOvTSzci" target="_blank" rel="noopener noreferrer"
              style={{ display:"inline-block", background:"#f59e0b", color:"#fff", fontWeight:800, fontSize:14, padding:"12px 28px", borderRadius:99, textDecoration:"none", boxShadow:"0 2px 8px rgba(245,158,11,0.3)" }}>
              카카오톡 오픈채팅 입장하기
            </a>
            <div style={{ fontSize:11, color:"#a16207", marginTop:8 }}>비밀번호 : 1004</div>
          </div>
        </div>
      </div>
    </div>
  );
}