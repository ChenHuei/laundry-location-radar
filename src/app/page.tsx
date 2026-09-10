import Link from "next/link";
import { businessConfig } from "@/lib/config";
import { getListingRows } from "@/lib/listings";
import { listingPath } from "@/lib/models";
import { statuses } from "@/lib/review";
import { requirePrivateRead } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
export const dynamic = "force-dynamic";
const filters = { all: "全部", high: "80+ 高分", ...statuses, inactive: "已下架" };
export default async function Home({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  await requirePrivateRead();
  const { filter = "all" } = await searchParams;
  const rows = await getListingRows();
  const high = (x: typeof rows[number]) => x.score_total >= businessConfig.notificationThreshold && !x.score_breakdown.fatalFlags.length && x.is_active && x.status !== "rejected";
  const shown = rows.filter(x => filter === "all" || (filter === "high" ? high(x) : filter === "inactive" ? !x.is_active : x.status === filter));
  const demo = !getSupabaseAdmin();
  return <main className="wrap">
    <div className="top"><div><div className="muted">三重・Oday 加盟候選</div><h1>洗衣店選址雷達</h1><div className="muted">每日掃描 · 分數與實際開店條件一起檢查</div></div><nav><Link href="/setup">服務設定</Link> · <Link href="/import">匯入物件</Link> · <Link href="/login">管理者</Link></nav></div>
    {demo && <p className="notice">目前為示範資料，尚未連接正式資料庫。你可以查看詳情與審查欄位；設定完成後即可保存真實物件。</p>}
    <section className="cards"><div className="card"><div className="muted">全部候選</div><div className="metric">{rows.length}</div></div><div className="card"><div className="muted">80+ 可審查</div><div className="metric">{rows.filter(high).length}</div></div><div className="card"><div className="muted">待現勘</div><div className="metric">{rows.filter(x => x.status === "pending_visit").length}</div></div><div className="card"><div className="muted">排程頻率</div><div className="metric">{businessConfig.scanIntervalHours}h</div></div></section>
    <nav className="filters" aria-label="篩選物件">{Object.entries(filters).map(([key,label]) => <Link className={`pill ${filter === key ? "selected" : ""}`} aria-current={filter === key ? "page" : undefined} href={`/?filter=${key}`} key={key}>{label}</Link>)}</nav>
    <div className="listing-grid">{shown.map(x => <article className="panel listing-card" key={`${x.source}:${x.source_id}`}>
      <div className="listing-top"><span className={`score ${high(x) ? "high" : ""}`}>{x.score_total}<small> / 100</small></span><span className="tag">{statuses[x.status as keyof typeof statuses] ?? x.status}</span></div>
      <h2><Link href={listingPath(x)}>{x.title}</Link></h2><p className="muted">{x.address}</p><p><strong>${x.rent.toLocaleString()} / 月</strong> · 一樓 {x.first_floor_ping == null ? "待確認" : `${x.first_floor_ping} 坪`}</p>
      {x.score_breakdown.fatalFlags.map(flag => <p className="bad" key={flag}>阻擋：{flag}</p>)}
      <div className="pros">{x.score_breakdown.pros.slice(0,2).map(p => <p key={p}>✓ {p}</p>)}</div><div className="cons">{x.score_breakdown.cons.slice(0,2).map(p => <p key={p}>△ {p}</p>)}</div>
      <Link className="button-link" href={listingPath(x)}>查看詳情與審查 →</Link>
    </article>)}</div>
    {!shown.length && <div className="panel empty">此篩選沒有物件。<Link href="/import">匯入真實物件</Link> 或切換其他篩選。</div>}
    {!demo && <p className="muted">顯示最近出現的 300 筆物件；下架紀錄不會刪除。</p>}
  </main>;
}
