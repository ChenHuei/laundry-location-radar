"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { reviewSchema, statuses, type ManualReview } from "@/lib/review";
import type { ListingRow } from "@/lib/models";

export function ReviewForm({ row, editable }: { row: ListingRow; editable: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const input = row.enrichment;
  const initial = row.manual_review ?? reviewSchema.parse({ status: row.status in statuses ? row.status : "new", notes: row.notes ?? "", firstFloorPing: input.firstFloorPing ?? null,
    frontage: input.frontage, parking: input.parking, utilitiesReady: input.utilitiesReady, allow24h: input.allow24h });
  const [review, setReview] = useState<ManualReview>(initial);
  const change = <K extends keyof ManualReview>(key: K, value: ManualReview[K]) => setReview(current => ({ ...current, [key]: value }));
  async function save(event: React.FormEvent) {
    event.preventDefault(); setMessage("");
    const parsed = reviewSchema.safeParse(review);
    if (!parsed.success) { setMessage(parsed.error.issues[0].message); return; }
    setSaving(true);
    try {
      const response = await fetch(`/api/listings/${encodeURIComponent(row.source)}/${encodeURIComponent(row.source_id)}/review`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ review: parsed.data, version: row.review_version ?? 0 }),
      });
      const data = await response.json();
      if (!response.ok) { setMessage(data.error ?? "儲存失敗"); return; }
      setMessage("已儲存，評分已重新計算。"); router.refresh();
    } catch { setMessage("連線失敗，尚未確認是否儲存，請重新載入確認。"); }
    finally { setSaving(false); }
  }
  return <form onSubmit={save} className="panel">
    <h2>人工審查</h2>
    {!editable && <p className="notice">目前為唯讀示範。完成資料庫與管理者設定後，可匯入真實物件並保存審查結果。</p>}
    <fieldset disabled={!editable || saving}>
      <div className="form-grid">
        <label>處理狀態<select value={review.status} onChange={e => change("status", e.target.value as ManualReview["status"])}>{Object.entries(statuses).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>
        <label>一樓實際可用面積（坪）<input type="number" step="0.1" min="0.1" max="1000" value={review.firstFloorPing ?? ""} onChange={e => change("firstFloorPing", e.target.value === "" ? null : Number(e.target.value))} placeholder="待確認" /></label>
        {([ ["frontage", "面寬與曝光"], ["parking", "機車臨停與搬運"] ] as const).map(([key,label]) => <label key={key}>{label}<select value={review[key]} onChange={e => change(key, e.target.value as ManualReview[typeof key])}><option value="unknown">待確認</option><option value="good">良好</option><option value="average">普通</option><option value="poor">不佳</option></select></label>)}
        {([ ["utilitiesReady", "電力／排水／排風符合需求"], ["allow24h", "允許 24 小時營業"], ["laundryAllowed", "建物規約允許洗衣店"], ["franchiseConflict", "已確認有 Oday 加盟區域衝突"] ] as const).map(([key,label]) => <label key={key}>{label}<select value={review[key] == null ? "unknown" : String(review[key])} onChange={e => change(key, e.target.value === "unknown" ? null : e.target.value === "true")}><option value="unknown">待確認</option><option value="true">是（已確認）</option><option value="false">否（已確認）</option></select></label>)}
      </div>
      <h3>住宅需求證據</h3><p className="muted">里級總戶數不能直接當成 500m／800m 戶數。請僅填有來源與估算方法的商圈數字；未知請留白。</p>
      <div className="form-grid">{(["households500m", "households800m"] as const).map((key, i) => <label key={key}>{i === 0 ? "500m" : "800m"} 估計戶數<input type="number" min="0" step="1" value={review[key] ?? ""} onChange={e => change(key, e.target.value === "" ? null : Number(e.target.value))} /></label>)}</div>
      <label>戶數來源、資料日期與估算方法<textarea value={review.demandSource} onChange={e => change("demandSource", e.target.value)} maxLength={2000} /></label>
      <h3>競爭業者審查</h3>
      {!input.competitionAnalysis?.competitors.length && <p>尚無競爭業者資料；需先有有效座標並完成 Places 查詢。</p>}
      {input.competitionAnalysis?.competitors.map(p => {
        const item = review.competitors[p.placeId] ?? { strength: p.strength, isOday: p.isOday, excluded: false, notes: "" };
        const edit = (patch: Partial<typeof item>) => change("competitors", { ...review.competitors, [p.placeId]: { ...item, ...patch } });
        return <div className="competitor-edit" key={p.placeId}><strong>{p.name}</strong> · 約 {Math.round(p.distanceMeters)}m
          <div className="form-grid"><label>競爭強弱<select value={item.strength} onChange={e => edit({ strength: e.target.value as typeof item.strength })}><option value="unknown">未知</option><option value="strong">強</option><option value="normal">中</option><option value="weak">弱</option></select></label>
          <label className="check"><input type="checkbox" checked={item.isOday} onChange={e => edit({ isOday: e.target.checked })} />Oday 同品牌</label>
          <label className="check"><input type="checkbox" checked={item.excluded} onChange={e => edit({ excluded: e.target.checked })} />排除（非競爭業者／已歇業）</label></div>
          <label>判斷依據<textarea maxLength={2000} value={item.notes} onChange={e => edit({ notes: e.target.value })} placeholder="例如現場設備數、店況、送洗店或歇業證據" /></label>
        </div>;
      })}
      <label>現勘筆記<textarea rows={5} maxLength={10000} value={review.notes} onChange={e => change("notes", e.target.value)} /></label>
      <button type="submit">{saving ? "儲存中…" : "儲存並重新評分"}</button>
    </fieldset>
    <p role="status">{message}</p>
  </form>;
}
