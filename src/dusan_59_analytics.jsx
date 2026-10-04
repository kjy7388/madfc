import { useState, useRef } from "react";
import html2canvas from "html2canvas"; // html2canvas 라이브러리 추가
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DATA 객체: 실제 분석 결과
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const DATA = {
  complex: "집주인두산위브",
  type: "81/59m² (24평형)",
  analysisDate: "2026.04.14",
  baselines: {
    real: { value: 6.45, label: "실거래 기준가", desc: "180일 이내 중층 실거래 중위가", color: "#ef4444" },
    ask: { value: 6.9, label: "호가 기준가", desc: "중층 매물 호가 중위가", color: "#f59e0b" },
    jeonse: { value: 3.7, label: "전세 기준가", desc: "180일 이내 실거래 중위가", color: "#3b82f6" },
  },
  summary: { text: "총 29건 매물 중 급매/관심 매물은 없으며, 호가가 높게 형성되어 있어요.", color: "blue" },
  deductions: [
    { condition: "1층", dynamic: true, value: 9.3, note: "실거래 기반 편차 적용 (5.9억 등 거래)" },
    { condition: "저층", dynamic: false, value: 4.0, note: "기본 추정치 ⚠ (명확한 저층 실거래 분리 한계)" }
  ],
  realTx: [
    { date: "2026.04", floor: 8, price: 6.35, included: true },
    { date: "2026.03", floor: 14, price: 6.7, included: true },
    { date: "2026.02", floor: 16, price: 6.7, included: true },
    { date: "2026.02", floor: 4, price: 6.4, included: true },
    { date: "2026.02", floor: 1, price: 5.9, included: false, note: "1층 — 감점 산출용" },
    { date: "2026.01", floor: 23, price: 6.0, included: true },
  ],
  jeonseTx: [
    { source: "실거래", date: "2026.04", floor: 13, price: 3.78, included: true },
    { source: "실거래", date: "2026.02", floor: 8, price: 4.0, included: true },
    { source: "실거래", date: "2026.02", floor: 2, price: 3.46, included: true },
    { source: "실거래", date: "2026.01", floor: 18, price: 4.0, included: true },
  ],
  listings: [
    {
      id: 1, dong: "114", floor: "5층", price: 6.3, dir: "남서향", note: "세안고 급매",
      rawDiscount: -2.3, deductTotal: 0, adjustedDiscount: -2.3,
      deductDetail: "",
      signals: [
        { type: "urgent", label: "⚡ 급처분" }
      ],
      gap: 2.6, jeonseRate: 59,
      comment: "현재 제일 싼 매물이지만, 실거래가랑 비교하면 그냥 시세 수준이에요.",
      beginnerGuide: [
        "실거래 기준가 6.45억: 최근 6개월간 비슷한 중층에서 실제 거래된 중간 가격이에요.",
        "보정 할인율 -2.3%: 이 매물이 최근 실거래가보다 2.3% 싸다는 뜻이에요.",
        "갭 2.6억: 이 집을 사고 전세를 놓으면 내 돈이 2.6억 필요해요.",
        "전세가율 59%: 집값의 59%가 전세금이에요.",
        "⚡ 급처분: 부동산에서 '급매'라고 올렸어요.",
        "⚪ 시세 수준: 0~4% 할인이면 '시세 수준'으로 분류해요. 엄청 싼 건 아니에요."
      ]
    },
    {
      id: 2, dong: "112", floor: "6층", price: 6.3, dir: "남동향", note: "내부수리",
      rawDiscount: -2.3, deductTotal: 0, adjustedDiscount: -2.3,
      deductDetail: "",
      signals: [],
      gap: 2.6, jeonseRate: 59,
      comment: "무난한 시세 수준의 매물이에요. 급매는 아닙니다.",
      beginnerGuide: [
        "실거래 기준가 6.45억: 최근 6개월간 비슷한 중층에서 실제 거래된 중간 가격이에요.",
        "보정 할인율 -2.3%: 실거래보다 2.3% 저렴한 시세 수준이에요.",
        "갭 2.6억: 이 집을 사고 전세를 놓으면 내 돈이 2.6억 필요해요.",
        "⚪ 시세 수준: 특별히 비싸지도, 엄청 싸지도 않은 평범한 가격이에요."
      ]
    },
    {
      id: 3, dong: "114", floor: "저층", price: 6.2, dir: "남서향", note: "수리",
      rawDiscount: -3.8, deductTotal: 4.0, adjustedDiscount: 0.2,
      deductDetail: "저층 +4.0%p ⚠기본추정치",
      signals: [],
      gap: 2.5, jeonseRate: 60,
      comment: "보이는 표면 가격만 싸고 저층인 걸 감안하면 살짝 비싸네요.",
      beginnerGuide: [
        "실거래 기준가 6.45억: 최근 6개월간 실제 거래된 중간 가격이에요.",
        "보정 할인율 +0.2%: 원래 3.8% 싸 보이지만, 저층이라서 원래 싼 만큼(4%p)을 빼면 실제로는 0.2% 비싼 거예요.",
        "감점 +4.0%p: 이 매물은 저층이라서 4%p 패널티를 줬어요.",
        "🔵 비싼 매물: 조건을 감안했을 때 실거래 최고 기준치보다 비싸다는 의미예요."
      ]
    },
    {
      id: 4, dong: "114", floor: "고층", price: 6.6, dir: "남서향", note: "올수리",
      rawDiscount: 2.3, deductTotal: 0, adjustedDiscount: 2.3,
      deductDetail: "",
      signals: [
        { type: "repair", label: "✨ 올수리 (비싼편)" }
      ],
      gap: 2.9, jeonseRate: 56,
      comment: "올수리인 걸 감안해도 평균 실거래가보다는 확실히 값이 높게 나왔어요.",
      beginnerGuide: [
        "실거래 기준가 6.45억: 최근 6개월간 실제 거래된 중간 가격이에요.",
        "보정 할인율 +2.3%: 이 매물이 실거래 중위가보다 2.3% 비싸다는 뜻이에요. +는 비싸다는 뜻.",
        "갭 2.9억: 실투자금으로 2.9억이 필요해요."
      ]
    },
    {
      id: 5, dong: "101", floor: "24층", price: 6.9, dir: "남동향", note: "",
      rawDiscount: 6.9, deductTotal: 0, adjustedDiscount: 6.9,
      deductDetail: "",
      signals: [],
      gap: 3.2, jeonseRate: 53,
      comment: "실거래가 기준보다 확연히 비쌉니다. 호가 중심으로 나온 가격입니다.",
      beginnerGuide: [
        "실거래 기준가 6.45억: 최근 실제 거래된 중간 가격이에요.",
        "보정 할인율 +6.9%: 실거래보다 6.9%나 비싸게 나왔어요.",
        "🔵 비싼 매물: 요즘 거래 분위기 대비 매도자가 가격을 꽤 높게 부른 상태예요."
      ]
    }
  ],
};
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 유틸리티
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function getGrade(d) {
  if (d <= -8) return { label: "🔴 찐 급매", bg: "#fef2f2", border: "#fca5a5", text: "#dc2626", bar: "#ef4444" };
  if (d <= -4) return { label: "🟡 관심 매물", bg: "#fefce8", border: "#fde047", text: "#ca8a04", bar: "#eab308" };
  if (d <= 0) return { label: "⚪ 시세 수준", bg: "#f9fafb", border: "#d1d5db", text: "#6b7280", bar: "#9ca3af" };
  return { label: "🔵 비싼 매물", bg: "#eff6ff", border: "#93c5fd", text: "#2563eb", bar: "#3b82f6" };
}
function fmt(v) { return v >= 1 ? `${v}억` : `${Math.round(v * 10000)}만`; }
function fmtFull(v) {
  const e = Math.floor(v); const m = Math.round((v - e) * 10000);
  return m === 0 ? `${e}억` : `${e}억 ${m.toLocaleString()}만`;
}
const summaryBg = { red: "#fef2f2", yellow: "#fefce8", blue: "#eff6ff" };
const summaryText = { red: "#dc2626", yellow: "#92400e", blue: "#1e40af" };
const sortedListings = [...DATA.listings].sort((a, b) => a.adjustedDiscount - b.adjustedDiscount);
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 이하 서브 컴포넌트들 ...
// (BaselineCard, SignalBadge, BeginnerToggle, ListingCard, PriceChart, DetailTab 내부 구조는 기존과 동일하게 유지됩니다)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function BaselineCard({ item }) {
  return (
    <div style={{ flex: "1 1 0", minWidth: 90, background: "#fff", borderRadius: 10, padding: "10px 12px", border: `1.5px solid ${item.color}22`, textAlign: "center" }}>
      <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>{item.label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: item.color }}>{fmt(item.value)}</div>
      <div style={{ fontSize: 10, color: "#aaa", marginTop: 2 }}>{item.desc}</div>
    </div>
  );
}
function SignalBadge({ signal }) {
  const colors = { priceDown: { bg: "#fef2f2", text: "#dc2626" }, repair: { bg: "#f0fdf4", text: "#16a34a" }, urgent: { bg: "#fefce8", text: "#ca8a04" }, negotiate: { bg: "#eff6ff", text: "#2563eb" } };
  const c = colors[signal.type] || { bg: "#f9fafb", text: "#6b7280" };
  return <span style={{ display: "inline-block", fontSize: 11, padding: "2px 8px", borderRadius: 99, background: c.bg, color: c.text, marginRight: 4, marginBottom: 4 }}>{signal.label}</span>;
}
function BeginnerToggle({ items }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 8 }}>
      <button onClick={() => setOpen(!open)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12.5, color: "#6b7280", padding: 0, display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s", display: "inline-block" }}>▶</span>
        이게 뭔 뜻이에요?
      </button>
      {open && (
        <div style={{ background: "#F9FAFB", borderRadius: 8, padding: "10px 12px", marginTop: 6, fontSize: 12, color: "#555", lineHeight: 1.8 }}>
          {items.map((item, i) => <div key={i}>• {item}</div>)}
        </div>
      )}
    </div>
  );
}
function ListingCard({ item }) {
  const grade = getGrade(item.adjustedDiscount);
  const diffAmount = Math.abs(Math.round((DATA.baselines.real.value - item.price) * 10000));
  const diffLabel = item.adjustedDiscount <= 0 ? `${diffAmount.toLocaleString()}만 저렴` : `${diffAmount.toLocaleString()}만 비쌈`;
  return (
    <div style={{ background: grade.bg, border: `1.5px solid ${grade.border}`, borderRadius: 14, padding: "16px 16px 14px", marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#333" }}>{item.dong}동 {item.floor}</span>
          <span style={{ fontSize: 11, color: "#999", marginLeft: 6 }}>{item.dir}</span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: grade.text, background: `${grade.text}15`, padding: "3px 10px", borderRadius: 99 }}>{grade.label}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <div style={{ fontSize: 26, fontWeight: 900, color: "#111" }}>{fmtFull(item.price)}</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: grade.bar }}>{item.adjustedDiscount <= 0 ? "" : "+"}{item.adjustedDiscount.toFixed(1)}%</div>
      </div>
      <div style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>실거래 대비 {diffLabel}</div>
      {item.deductTotal > 0 && (
        <div style={{ background: "#fffbeb", borderRadius: 8, padding: "6px 10px", marginBottom: 8, fontSize: 11 }}>
          <span style={{ color: "#f59e0b", fontWeight: 600 }}>감점:</span> <span style={{ color: "#92400e" }}>{item.deductDetail}</span>
          <span style={{ color: "#92400e", marginLeft: 8 }}>원시 {item.rawDiscount.toFixed(1)}% → 보정 {item.adjustedDiscount.toFixed(1)}%</span>
        </div>
      )}
      {item.signals.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          {item.signals.map((s, i) => <SignalBadge key={i} signal={s} />)}
        </div>
      )}
      <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#666", marginBottom: 8, background: "#fff", borderRadius: 8, padding: "6px 10px" }}>
        <span>갭 <b style={{ color: "#111" }}>{fmt(item.gap)}</b></span>
        <span>전세가율 <b style={{ color: "#111" }}>{item.jeonseRate}%</b></span>
      </div>
      <div style={{ fontSize: 12.5, color: "#444", lineHeight: 1.6, background: "#fff", borderRadius: 8, padding: "8px 10px" }}>
        💬 {item.comment}
      </div>
      <BeginnerToggle items={item.beginnerGuide} />
    </div>
  );
}
function PriceChart() {
  const allP = DATA.listings.map(l => l.price);
  const minP = Math.min(...allP, DATA.baselines.real.value, DATA.baselines.jeonse.value) - 0.3;
  const maxP = Math.max(...allP) + 0.3;
  const range = maxP - minP;
  const W = 340;
  const toX = (v) => ((v - minP) / range) * W;
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 16, marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "#333" }}>기준선 vs 매물 가격 분포</div>
      <svg width={W + 40} height={sortedListings.length * 28 + 40} style={{ display: "block" }}>
        {[Math.ceil(minP), Math.ceil(minP) + 0.5, Math.ceil(minP) + 1, Math.ceil(minP) + 1.5, Math.ceil(minP) + 2].filter(v => v >= minP && v <= maxP).map(v => (
          <g key={v}>
            <line x1={toX(v) + 20} y1={15} x2={toX(v) + 20} y2={sortedListings.length * 28 + 10} stroke="#f0f0f0" strokeWidth={1} />
            <text x={toX(v) + 20} y={sortedListings.length * 28 + 30} textAnchor="middle" fontSize={10} fill="#bbb">{v}억</text>
          </g>
        ))}
        <line x1={toX(DATA.baselines.jeonse.value) + 20} y1={15} x2={toX(DATA.baselines.jeonse.value) + 20} y2={sortedListings.length * 28 + 10} stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4,3" />
        <line x1={toX(DATA.baselines.real.value) + 20} y1={15} x2={toX(DATA.baselines.real.value) + 20} y2={sortedListings.length * 28 + 10} stroke="#ef4444" strokeWidth={2} strokeDasharray="6,3" />
        <text x={toX(DATA.baselines.real.value) + 20} y={10} textAnchor="middle" fontSize={9} fill="#ef4444" fontWeight={700}>실거래 {fmt(DATA.baselines.real.value)}</text>
        {sortedListings.map((item, i) => {
          const grade = getGrade(item.adjustedDiscount);
          const y = 25 + i * 28;
          return (
            <g key={item.id}>
              <circle cx={toX(item.price) + 20} cy={y} r={5} fill={grade.bar} stroke="#fff" strokeWidth={1.5} />
              <text x={toX(item.price) + 28} y={y + 3.5} fontSize={9} fill="#666">{item.dong}동 {item.floor} {fmtFull(item.price)}</text>
            </g>
          );
        })}
      </svg>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 4, fontSize: 10, color: "#999" }}>
        <span>🔴 실거래 기준</span><span>🔵 전세 기준</span><span>● 매물</span>
      </div>
    </div>
  );
}
function DetailTab() {
  return (
    <>
      <div style={{ background: "#fff", borderRadius: 12, padding: 16, marginBottom: 12, overflowX: "auto" }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>전체 매물 비교표</div>
        <table style={{ width: "100%", minWidth: 580, borderCollapse: "collapse", fontSize: 11.5 }}>
          <thead>
            <tr style={{ background: "#f8f9fa" }}>
              {["매물", "층", "매매가", "원시", "감점", "보정", "신호", "갭", "판정"].map(h => (
                <th key={h} style={{ padding: "8px 5px", textAlign: "center", borderBottom: "2px solid #e5e7eb", fontWeight: 700, color: "#555", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedListings.map(item => {
              const grade = getGrade(item.adjustedDiscount);
              return (
                <tr key={item.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "7px 5px", fontWeight: 600 }}>{item.dong}동</td>
                  <td style={{ padding: "7px 5px", textAlign: "center" }}>{item.floor}</td>
                  <td style={{ padding: "7px 5px", textAlign: "right", fontWeight: 700 }}>{fmtFull(item.price)}</td>
                  <td style={{ padding: "7px 5px", textAlign: "center", color: item.rawDiscount <= 0 ? "#16a34a" : "#dc2626" }}>{item.rawDiscount.toFixed(1)}%</td>
                  <td style={{ padding: "7px 5px", textAlign: "center", fontSize: 10, color: "#f59e0b" }}>{item.deductTotal > 0 ? `+${item.deductTotal}%p⚠` : "-"}</td>
                  <td style={{ padding: "7px 5px", textAlign: "center", fontWeight: 700, color: grade.text }}>{item.adjustedDiscount.toFixed(1)}%</td>
                  <td style={{ padding: "7px 5px", textAlign: "center", fontSize: 10 }}>{item.signals.length > 0 ? item.signals.map(s => s.label.split(" ")[0]).join(" ") : "-"}</td>
                  <td style={{ padding: "7px 5px", textAlign: "right" }}>{fmt(item.gap)}</td>
                  <td style={{ padding: "7px 5px", textAlign: "center" }}><span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 99, background: `${grade.text}15`, color: grade.text, fontWeight: 700, whiteSpace: "nowrap" }}>{grade.label}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ background: "#fff", borderRadius: 12, padding: 16, marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>매매 실거래 이력</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
          <thead><tr style={{ background: "#f8f9fa" }}>{["계약월", "층", "거래가", "포함 여부"].map(h => <th key={h} style={{ padding: "7px 6px", textAlign: "center", borderBottom: "2px solid #e5e7eb", fontWeight: 700, color: "#555" }}>{h}</th>)}</tr></thead>
          <tbody>
            {DATA.realTx.map((tx, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #f0f0f0", background: tx.included ? "#f0fdf4" : "transparent" }}>
                <td style={{ padding: "6px", textAlign: "center" }}>{tx.date}</td>
                <td style={{ padding: "6px", textAlign: "center" }}>{tx.floor}층</td>
                <td style={{ padding: "6px", textAlign: "right", fontWeight: 600 }}>{fmtFull(tx.price)}</td>
                <td style={{ padding: "6px", textAlign: "center", fontSize: 10 }}>{tx.included ? "✅ 포함" : tx.note || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 메인 앱
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function App() {
  const [tab, setTab] = useState(0);
  const containerRef = useRef(null);
  // 📝 화면 캡처 및 다운로드 기능 추가
  const handleDownloadImage = async () => {
    if (!containerRef.current) return;
    try {
      const canvas = await html2canvas(containerRef.current, { useCORS: true, backgroundColor: "#f5f5f7" });
      const imgData = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = imgData;
      link.download = `부동산_급매판별_${DATA.complex}_${DATA.analysisDate.replace(/\./g,"")}.png`;
      link.click();
    } catch (e) {
      alert("이미지 저장 중 오류가 발생했습니다.");
    }
  };
  return (
    <>
      <div ref={containerRef} style={{ maxWidth: 480, margin: "0 auto", fontFamily: '-apple-system, "Pretendard", sans-serif', background: "#f5f5f7", minHeight: "100vh" }}>
        {/* 헤더 */}
        <div style={{ background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)", color: "#fff", padding: "20px 16px 16px" }}>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>급매 판별 리포트</div>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{DATA.complex}</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>{DATA.type} · {DATA.analysisDate} 분석 · 대표매물 {DATA.listings.length}건 · 중층실거래 {DATA.realTx.filter(t => t.included).length}건</div>
        </div>
        {/* 기준선 카드 */}
        <div style={{ display: "flex", gap: 8, padding: "12px 16px 0", flexWrap: "wrap" }}>
          {Object.values(DATA.baselines).map((b, i) => <BaselineCard key={i} item={b} />)}
        </div>
        {/* 요약 배너 */}
        <div style={{ margin: "12px 16px 0", background: summaryBg[DATA.summary.color], borderRadius: 10, padding: "10px 14px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: summaryText[DATA.summary.color] }}>{DATA.summary.text}</div>
        </div>
        {/* 탭 */}
        <div style={{ display: "flex", padding: "12px 16px 0", gap: 8, marginBottom: 12 }}>
          {["📊 급매 판정", "📋 상세 비교"].map((label, i) => (
            <button key={i} onClick={() => setTab(i)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: tab === i ? "#1e293b" : "#e2e8f0", color: tab === i ? "#fff" : "#64748b", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{label}</button>
          ))}
        </div>
        {/* 탭 콘텐츠 */}
        <div style={{ padding: "0 16px 16px" }}>
          {tab === 0 && (
            <>
              <PriceChart />
              {sortedListings.map(item => <ListingCard key={item.id} item={item} />)}
            </>
          )}
          {tab === 1 && <DetailTab />}
        </div>
        {/* 면책 */}
        <div style={{ padding: "12px 16px 8px", textAlign: "center" }}>
          <div style={{ fontSize: 10, color: "#aaa", lineHeight: 1.6 }}>
            이 결과는 참고용이며, 실제 투자 판단은 현장 확인과 전문가 상담 후 결정하세요.
          </div>
        </div>
        {/* CTA */}
        <div style={{ padding: "0 16px 24px" }}>
          <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 16 }}>
            <div style={{ background: "linear-gradient(135deg, #fef9c3 0%, #fef3c7 100%)", border: "1.5px solid #fde68a", borderRadius: 14, padding: "20px 18px", textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#92400e", marginBottom: 8 }}>급매 분석이 도움이 됐다면?</div>
              <div style={{ fontSize: 13, color: "#78350f", lineHeight: 1.7, marginBottom: 14 }}>내집마련 스터디 정보방에서<br />실시간 급매정보를 받아보세요</div>
              <a href="https://open.kakao.com/o/gOvTSzci" target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", background: "#f59e0b", color: "#fff", fontWeight: 800, fontSize: 14, padding: "12px 28px", borderRadius: 99, textDecoration: "none", boxShadow: "0 2px 8px rgba(245,158,11,0.3)" }}>카카오톡 오픈채팅 입장하기</a>
              <div style={{ fontSize: 11, color: "#a16207", marginTop: 8 }}>비밀번호 : 1004</div>
            </div>
          </div>
        </div>
      </div>
      {/* 다운로드 버튼 (앱 캡처 범위 바깥에 위치하여 화면을 깔끔하게 유지) */}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px 30px", textAlign: "center" }}>
        <button 
          onClick={handleDownloadImage}
          style={{ width: "100%", padding: "16px", borderRadius: 12, background: "#1e293b", color: "#fff", fontSize: 16, fontWeight: 800, border: "none", cursor: "pointer", boxShadow: "0 4px 12px rgba(30,41,59,0.2)" }}
        >
          🖼 리포트 이미지로 저장하기
        </button>
        <p style={{marginTop: 8, fontSize: 11, color: "#888"}}>
          * 코드펜/코드샌드박스 등 React 환경에서는 npm i html2canvas 패키지 설치가 필요합니다.
        </p>
      </div>
    </>
  );
}