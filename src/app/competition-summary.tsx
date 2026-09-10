import type { ScoreInput, ScoreBreakdown } from "../types/listing";

export function CompetitionSummary({ enrichment, score }: { enrichment?: ScoreInput; score?: ScoreBreakdown }) {
  const analysis = enrichment?.competitionAnalysis;
  return <details className="competition-details">
    <summary>競爭與評分明細{analysis?.status !== "available" ? " · 資料待確認" : ""}</summary>
    {score && <p>住宅 {score.housing}/30 · 競爭 {score.competition}/25 · 店面 {score.storefront}/20 · 租金 {score.rentValue}/15 · 動線 {score.access}/10</p>}
    {score?.fatalFlags?.map(flag => <p className="bad" key={flag}>阻擋條件：{flag}</p>)}
    <p>{analysis?.reason ?? (!analysis ? "尚未查詢競爭資料" : "Google Places 已回傳附近洗衣業者，仍需現場確認店型與營運狀況。")}</p>
    {analysis && analysis.status !== "unavailable" && <>
      <p>500m：強 {enrichment?.strongCompetitors500m ?? 0} / 中 {enrichment?.normalCompetitors500m ?? 0} / 弱 {enrichment?.weakCompetitors500m ?? 0} / 未知 {enrichment?.unknownCompetitors500m ?? 0}（不含 Oday）<br />800m 內共 {enrichment?.competitors800m ?? 0} 間一般業者。</p>
      <p>{enrichment?.nearestOdayMeters != null ? `已找到最近的 Oday：約 ${Math.round(enrichment.nearestOdayMeters)}m，加盟範圍需向品牌確認。` : `本次 ${analysis.searchRadiusMeters}m 搜尋未回傳 Oday，不代表不存在。`}</p>
      <ul>{analysis.competitors.map(p => <li key={p.placeId}>
        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name)}&query_place_id=${encodeURIComponent(p.placeId)}`} target="_blank" rel="noreferrer">{p.name}</a>
        {p.isOday ? " · 同品牌" : " · 強弱待確認"} · 約 {Math.round(p.distanceMeters)}m<br />
        評分 {p.rating ?? "未知"} · 評論 {p.reviewCount ?? "未知"} 筆
        {p.businessStatus === "CLOSED_TEMPORARILY" && " · 暫停營業"}
        {p.openingHours && <div>{p.openingHours.join("；")}</div>}
      </li>)}</ul>
      <p className="muted">距離為座標直線距離；laundry 類型可能包含送洗店。評分與評論數不足以證明設備、利用率或競爭強弱。</p>
    </>}
  </details>;
}
