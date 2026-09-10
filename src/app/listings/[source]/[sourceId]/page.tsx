import Link from "next/link";
import { notFound } from "next/navigation";
import { getListing } from "@/lib/listings";
import { requirePrivateRead, isOwner } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { CompetitionSummary } from "@/app/competition-summary";
import { ReviewForm } from "@/app/review-form";
export const dynamic = "force-dynamic";
export default async function Detail({ params }: { params: Promise<{ source: string; sourceId: string }> }) {
  await requirePrivateRead();
  const { source, sourceId } = await params;
  const row = await getListing(source, sourceId);
  if (!row) notFound();
  const db = getSupabaseAdmin();
  const history = db ? await db.from("listing_history").select("id,observed_at,rent,area_ping,first_floor_ping,is_active").eq("listing_id", row.id).order("observed_at", { ascending: false }).limit(50) : null;
  const score = row.score_breakdown;
  const input = row.enrichment;
  const checks = [input.firstFloorPing == null && "一樓可用坪數", input.utilitiesReady == null && "電力／排水／排風", input.allow24h == null && "24 小時營業", input.laundryAllowed == null && "建物用途與管理規約", input.franchiseConflict == null && "Oday 加盟區域確認", input.parking == null || input.parking === "unknown" ? "機車臨停與搬運" : false].filter(Boolean);
  const mapQuery = input.lat != null && input.lng != null ? `${input.lat},${input.lng}` : row.address;
  const date = (value?: string) => value ? new Date(value).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" }) : "尚無紀錄";
  return <main className="wrap">
    <Link href="/">← 全部物件</Link><h1>{row.title}</h1><p>{row.address}</p>
    <p><a href={row.url} target="_blank" rel="noreferrer">原始物件 ↗</a> · <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`} target="_blank" rel="noreferrer">Google 地圖 ↗</a></p>
    <section className="cards"><div className="card"><div className="muted">總分</div><div className="metric">{score.total}/100</div>{score.fatalFlags.length > 0 && <strong className="bad">有阻擋條件</strong>}</div><div className="card"><div className="muted">月租</div><div className="metric">${row.rent.toLocaleString()}</div></div><div className="card"><div className="muted">一樓可用坪數</div><div className="metric">{row.first_floor_ping ?? "待確認"}</div><small>來源總面積 {row.area_ping} 坪</small></div><div className="card"><div className="muted">刊登狀態</div><div className="metric">{row.is_active ? "有效" : "已下架"}</div></div></section>
    <div className="detail-grid"><div>
      <section className="panel"><h2>評分與現場確認</h2><p>住宅 {score.housing}/30 · 競爭 {score.competition}/25 · 店面 {score.storefront}/20 · 租金 {score.rentValue}/15 · 動線 {score.access}/10</p>
        {score.fatalFlags.length > 0 && <div className="notice bad"><strong>阻擋條件（總分上限 59）</strong><ul>{score.fatalFlags.map(x => <li key={x}>{x}</li>)}</ul></div>}
        <h3>優點</h3><ul>{score.pros.map(x => <li key={x}>{x}</li>)}</ul><h3>風險</h3><ul>{score.cons.map(x => <li key={x}>{x}</li>)}</ul>
        <h3>待現場確認</h3><ul>{checks.map(x => <li key={String(x)}>{x}</li>)}</ul>
        <CompetitionSummary enrichment={input} score={score} />
      </section>
      <section className="panel"><h2>物件歷史</h2><p>來源：{row.source} / {row.source_id}</p><p>首次發現：{date(row.first_seen_at)}<br />最近出現：{date(row.last_seen_at)}</p>
        {history?.error && <p className="bad">尚無法讀取歷史，請完成資料庫 migration。</p>}
        {!history?.data?.length && <p>目前沒有價格或刊登狀態變動紀錄。</p>}
        <ul>{history?.data?.map(x => <li key={x.id}>{date(x.observed_at)} · ${Number(x.rent).toLocaleString()} · {x.first_floor_ping ?? "一樓待確認"} 坪 · {x.is_active ? "有效" : "下架"}</li>)}</ul>
      </section>
    </div><ReviewForm key={row.review_version ?? 0} row={row} editable={!!db && await isOwner()} /></div>
  </main>;
}
