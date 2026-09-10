import { businessConfig } from "@/lib/config";
import { getListingRows } from "@/lib/listings";
import type { ScoreBreakdown, ScoreInput } from "../types/listing";
interface ListingRow {
  source_id: string;
  source?: string;
  title: string;
  address: string;
  rent: number;
  first_floor_ping?: number | null;
  area_ping?: number;
  areaPing?: number;
  url: string;
  score_total: number;
  score_breakdown?: ScoreBreakdown;
  enrichment?: ScoreInput;
}
import { CompetitionSummary } from "./competition-summary";
export const dynamic = "force-dynamic";
export default async function Home(){
  const rows:ListingRow[]=await getListingRows();
  const high=rows.filter(x=>x.score_total>=80).length;
  const avg=rows.length?Math.round(rows.reduce((s,x)=>s+x.score_total,0)/rows.length):0;
  return <main className="wrap">
    <div className="top"><div><div className="muted">三重・Oday 加盟候選</div><h1>洗衣店選址雷達</h1><div className="muted">每 {businessConfig.scanIntervalHours} 小時掃描新物件，80 分以上推送通知</div></div><div className="tag">MVP v0.1</div></div>
    <section className="cards"><div className="card"><div className="muted">全部候選</div><div className="metric">{rows.length}</div></div><div className="card"><div className="muted">80+ 高分</div><div className="metric">{high}</div></div><div className="card"><div className="muted">平均分數</div><div className="metric">{avg}</div></div><div className="card"><div className="muted">掃描頻率</div><div className="metric">{businessConfig.scanIntervalHours}h</div></div></section>
    <div className="filters"><span className="pill">全部</span><span className="pill">80+ 高分</span><span className="pill">新物件</span><span className="pill">待現勘</span><span className="pill">已淘汰</span></div>
    <table className="table"><thead><tr><th>分數</th><th>物件</th><th>租金 / 坪數</th><th className="hide-sm">判斷</th><th>來源</th></tr></thead><tbody>{rows.map((x)=>{const s=x.score_breakdown;return <tr key={`${x.source}:${x.source_id}`}><td><span className={`score ${x.score_total>=80?"high":x.score_total>=70?"warn":"bad"}`}>{x.score_total}</span></td><td><strong>{x.title}</strong><div className="muted">{x.address}</div><CompetitionSummary enrichment={x.enrichment} score={x.score_breakdown} /></td><td>${Number(x.rent).toLocaleString()}<div className="muted">{x.first_floor_ping ?? x.area_ping ?? x.areaPing} 坪</div></td><td className="hide-sm"><div className="pros">{s?.pros?.slice(0,2).map((p:string)=><div key={p}>✓ {p}</div>)}</div><div className="cons">{s?.cons?.slice(0,2).map((p:string)=><div key={p}>△ {p}</div>)}</div></td><td><a href={x.url} target="_blank">查看物件 ↗</a></td></tr>})}</tbody></table>
    {!rows.length&&<div className="panel empty">尚無資料。未設定 Supabase 時會使用 mock collector；設定後執行 /api/cron/scan 即可寫入。</div>}
  </main>
}
