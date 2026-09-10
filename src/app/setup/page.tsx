import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isOwner } from "@/lib/auth";
export const dynamic = "force-dynamic";
export default async function Setup() {
  const db = getSupabaseAdmin();
  const owner = await isOwner();
  const services = [
    ["Supabase 資料庫", !!db], ["管理者帳號", !!process.env.ADMIN_EMAIL],
    ["Google Places", !!process.env.GOOGLE_PLACES_API_KEY], ["每日排程保護", !!process.env.CRON_SECRET],
    ["LINE 通知", !!(process.env.LINE_CHANNEL_ACCESS_TOKEN && process.env.LINE_USER_ID)],
  ] as const;
  const scan = db && owner ? await db.from("scan_runs").select("started_at,status,scanned,error").order("started_at", { ascending: false }).limit(1).maybeSingle() : null;
  return <main className="wrap narrow"><Link href="/">← 返回雷達</Link><h1>啟用正式資料</h1><p>先完成資料庫與管理者登入，就能匯入、收藏與審查物件。Google 與 LINE 可以分別接上。</p>
    <section className="panel"><h2>連線設定</h2><ul>{services.map(([label, ready]) => <li key={label}>{ready ? "✓ 已填寫" : "○ 尚未填寫"} · {label}</li>)}</ul><p className="muted">「已填寫」僅代表環境變數存在，仍需實際操作確認服務可用。金鑰不會顯示在此頁。</p>
      {scan?.data && <p>最近掃描：{new Date(scan.data.started_at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })} · {scan.data.status === "success" ? `完成 ${scan.data.scanned} 筆` : "失敗，請檢查設定"}</p>}
      {scan?.error && <p className="bad">請執行最新資料表 SQL，才能讀取掃描紀錄。</p>}
    </section>
    <section className="panel"><h2>1. 建立 Supabase</h2><ol>
      <li>登入 Supabase，建立專案。資料庫密碼請自行保管。</li>
      <li>在 SQL Editor 執行 <a href="/setup.sql" download>下載的完整資料表 SQL</a>。既有資料會保留，腳本可重跑。</li>
      <li>在 Authentication → Users 建立你的管理者使用者，設定 email 與密碼。此網站不開放自行註冊。</li>
      <li>在 Vercel 的 Project Settings → Environment Variables 填入以下值，然後重新部署。</li>
    </ol><dl><dt>SUPABASE_URL</dt><dd>Supabase 專案 URL</dd><dt>SUPABASE_SERVICE_ROLE_KEY</dt><dd>Supabase 伺服器端 service_role 金鑰，切勿使用 NEXT_PUBLIC_ 前綴</dd><dt>ADMIN_EMAIL</dt><dd>剛建立的管理者 email，必須完全對應</dd><dt>LISTING_SOURCE</dt><dd>填 manual，先從手動匯入的物件開始</dd></dl><p>完成後 <Link href="/login">登入管理者</Link>，再 <Link href="/import">匯入真實物件</Link>。登入過期時需重新登入。</p></section>
    <section className="panel"><h2>2. Google Places</h2><p>在 Google Cloud 啟用 Places API (New)，確認帳務可用；將伺服器 API key 填入 Vercel 的 <code>GOOGLE_PLACES_API_KEY</code>，限制僅可呼叫所需 API。每筆物件需提供 lat／lng 座標，未提供時保持待確認。</p><p>地圖連結可直接使用，不需瀏覽器金鑰。</p></section>
    <section className="panel"><h2>3. 每日掃描</h2><p>在 Vercel 填入一組自行產生、至少 32 字元的隨機 <code>CRON_SECRET</code>。未設定時掃描端點會拒絕執行。正式部署後每天台灣時間 08:00～08:59 觸發；預覽部署不執行排程。</p><p>manual 模式每天重新分析最久未更新的 25 筆有效物件；超過 25 筆會分日輪替。不會自行從 591 抓取新刊登。</p></section>
    <section className="panel"><h2>4. LINE 通知（可稍後設定）</h2><ol><li>建立 LINE Official Account，啟用 Messaging API。</li><li>在 LINE Developers 的 channel 取得長期 Channel access token 與 Your user ID，並將官方帳號加為好友。</li><li>填入 Vercel：<code>LINE_CHANNEL_ACCESS_TOKEN</code>、<code>LINE_USER_ID</code>。</li></ol><p>只有自動掃描首次發現的高分物件才發送通知；手動匯入與人工評分不會推播。尚未配置 LINE 不影響審查功能。</p></section>
  </main>;
}
