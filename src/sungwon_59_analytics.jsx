import { useState, useRef } from "react";
import html2canvas from "html2canvas";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DATA 객체: 실제 분석 결과
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const DATA = {
  complex: "성원2차",
  type: "84/59m² (24평형)",
  analysisDate: "2026.04.14",
  baselines: {
    real: { value: 6.76, label: "실거래 기준가", desc: "180일 이내 중층 실거래 중위가", color: "#ef4444" },
    ask: { value: 7.5, label: "호가 기준가", desc: "중층 매물 호가 중위가", color: "#f59e0b" },
    jeonse: { value: 4.1, label: "전세 기준가", desc: "180일 이내 실거래 중위가", color: "#3b82f6" },
  },
  summary: { text: "요즘 호가가 최근 실거래가들보다 확연히 비싸게 불리고 있어요. 관심 매물은 없습니다.", color: "blue" },
  deductions: [
    { condition: "1층", dynamic: true, value: 14.2, note: "실거래 기반 편차 적용 (5.8억 거래 참고)" },
    { condition: "저층", dynamic: false, value: 4.0, note: "기본 추정치 ⚠ (명확한 저층 실거래 분리 한계)" }
  ],
  realTx: [
    { date: "2026.03", floor: 10, price: 7.3, included: true },
    { date: "2026.03", floor: 6, price: 7.1, included: true },
    { date: "2026.01", floor: 3, price: 6.425, included: true },
    { date: "2026.01", floor: 6, price: 6.4, included: true },
    { date: "2026.01", floor: 1, price: 5.8, included: false, note: "1층 — 감점 산출용" },
  ],
  jeonseTx: [
    { source: "실거래", date: "2026.04", floor: 12, price: 4.4, included: true },
    { source: "실거래", date: "2026.02", floor: 4, price: 4.2, included: true },
    { source: "실거래", date: "2025.12", floor: 11, price: 4.5, included: true },
    { source: "실거래", date: "2025.11", floor: 6, price: 3.99, included: true },
    { source: "실거래", date: "2025.10", floor: 5, price: 3.78, included: true },
  ],
  listings: [
    {
      id: 1, dong: "102", floor: "5층", price: 7.5, dir: "남서향", note: "다주택자급매",
      rawDiscount: 10.9, deductTotal: 0, adjustedDiscount: 10.9,
      deductDetail: "",
      signals: [
        { type: "urgent", label: "⚡ 급처분 (다주택급매 표기)" },
        { type: "repair", label: "✨ 올수리 여부" }
      ],
      gap: 3.4, jeonseRate: 55,
      comment: "다주택자 급매라고 홍보 중이지만, 실제 거래되던 가격들보다 꽤 비싼 편이에요.",
      beginnerGuide: [
        "실거래 기준가 6.76억: 최근 6개월간 비슷한 중층에서 실제 거래된 중간 가격이에요.",
        "보정 할인율 +10.9%: 이 매물이 최근 실거래가보다 10.9% 비싸다는 뜻이에요. (+는 비싸다는 뜻)",
        "갭 3.4억: 이 집을 사고 전세를 놓으면 내 돈이 3.4억 필요해요.",
        "전세가율 55%: 집값의 절반보다 조금 더 되는 금액(55%)이 전세금이에요.",
        "🔵 비싼 매물: 실거래 기준보다 훨씬 비싸서 급매로 보기 어려워요."
      ]
    },
    {
      id: 2, dong: "102", floor: "저층", price: 7.5, dir: "남서향", note: "최고급인테리어",
      rawDiscount: 10.9, deductTotal: 4.0, adjustedDiscount: 14.9,
      deductDetail: "저층 +4.0%p ⚠기본추정치",
      signals: [],
      gap: 3.4, jeonseRate: 55,
      comment: "저층인데도 로얄층과 같은 가격으로 나와 있어서, 조건을 감안하면 더 비싼 물건이에요.",
      beginnerGuide: [
        "실거래 기준가 6.76억: 최근 실제 거래된 중간 가격이에요.",
        "보정 할인율 +14.9%: 안 그래도 호가가 비싼 편(10.9%)인데 저층이라는 패널티(4%)를 더하면 실거래가 대비 체감 상 14.9%나 비싼 거예요.",
        "감점 +4.0%p: 이 매물은 저층이라서 기본 4%p 패널티를 더해 계산했어요.",
        "🔵 비싼 매물: 조건을 감안했을 때 좋은 가격은 아니에요."
      ]
    },
    {
      id: 3, dong: "101", floor: "고층", price: 7.8, dir: "남향", note: "조망좋음",
      rawDiscount: 15.4, deductTotal: 0, adjustedDiscount: 15.4,
      deductDetail: "",
      signals: [],
      gap: 3.7, jeonseRate: 53,
      comment: "요즘 이 단지 역대 최근 실거래 최고점(7.3억)보다도 5천만 원이나 비싼 완전한 호가 위주 매물입니다.",
      beginnerGuide: [
        "실거래 기준가 6.76억: 최근 실제 거래된 중간 가격이에요.",
        "보정 할인율 +15.4%: 지금 나와 있는 다른 매물 중에서도 꽤 높은 수준으로 비싸요.",
        "🔵 비싼 매물: 급매와는 거리가 멀고 매도자가 받고 싶은 최고 가격인 것 같아요."
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
// 부분 컴포넌트들
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
        {[Math.ceil(minP), Math.ceil(minP) + 0.5, Math.ceil(minP) + 1, Math.ceil(minP) + 1.5, Math.ceil(minP) + 2, Math.ceil(minP) + 3, Math.ceil(minP) + 4].filter(v => v >= minP && v <= maxP).map(v => (
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

      <div style={{ background: "#fff", borderRadius: 12, padding: 16, marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>전세 기준가 출처</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
          <thead><tr style={{ background: "#f8f9fa" }}>{["출처", "계약월", "층", "전세가", "포함"].map(h => <th key={h} style={{ padding: "7px 6px", textAlign: "center", borderBottom: "2px solid #e5e7eb", fontWeight: 700, color: "#555" }}>{h}</th>)}</tr></thead>
          <tbody>
            {DATA.jeonseTx.map((tx, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "6px", textAlign: "center", fontSize: 10, color: tx.source === "실거래" ? "#16a34a" : "#f59e0b" }}>{tx.source}</td>
                <td style={{ padding: "6px", textAlign: "center" }}>{tx.date}</td>
                <td style={{ padding: "6px", textAlign: "center" }}>{tx.floor}층</td>
                <td style={{ padding: "6px", textAlign: "right", fontWeight: 600 }}>{fmtFull(tx.price)}</td>
                <td style={{ padding: "6px", textAlign: "center" }}>{tx.included ? "✅" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ background: "#fffbeb", borderRadius: 10, padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "#92400e" }}>감점 산출 근거</div>
        {DATA.deductions.map((d, i) => (
          <div key={i} style={{ fontSize: 12, color: "#78350f", marginBottom: 4 }}>
            ■ {d.condition}: {d.dynamic ? `실거래 기반 +${d.value}%p` : `기본 추정치 +${d.value}%p ⚠`} — {d.note}
          </div>
        ))}
      </div>
    </>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 메인 앱 컨테이너
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function App() {
  const [tab, setTab] = useState(0);
  const containerRef = useRef(null);

  // 📝 화면 캡처 및 다운로드 기능
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

        {/* 탭 네비게이션 */}
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

        {/* 면책사항 문구 */}
        <div style={{ padding: "12px 16px 8px", textAlign: "center" }}>
          <div style={{ fontSize: 10, color: "#aaa", lineHeight: 1.6 }}>
            이 결과는 참고용이며, 실제 투자 판단은 현장 확인과 전문가 상담 후 결정하세요.
          </div>
        </div>

        {/* CTA 영역 */}
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

      {/* 다운로드 버튼 (앱 캡처 범위 바깥에 위치) */}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px 30px", textAlign: "center" }}>
        <button 
          onClick={handleDownloadImage}
          style={{ width: "100%", padding: "16px", borderRadius: 12, background: "#1e293b", color: "#fff", fontSize: 16, fontWeight: 800, border: "none", cursor: "pointer", boxShadow: "0 4px 12px rgba(30,41,59,0.2)" }}
        >
          🖼 리포트 이미지로 저장하기
        </button>
      </div>
    </>
  );
}
