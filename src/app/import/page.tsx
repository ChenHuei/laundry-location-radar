import Link from "next/link";
import { requirePrivateRead, isOwner } from "@/lib/auth";
import { ImportForm } from "./import-form";
export const dynamic = "force-dynamic";
export default async function ImportPage() {
  await requirePrivateRead(); const enabled = await isOwner();
  return <main className="wrap narrow"><Link href="/">← 返回雷達</Link><h1>匯入真實物件</h1><p>填寫真實店面資訊，或以進階匯入加入多筆資料。相同刊登連結會更新原紀錄並保留人工審查。</p>
    {!enabled && <p className="notice">需先完成 <Link href="/setup">Supabase 設定</Link> 並以管理者登入，才能儲存物件。</p>}
    <ImportForm enabled={enabled} />
    <details className="panel"><summary>批次資料格式範例</summary><p>下列僅為格式示例，請替換成真實資料。source 可用 manual 或 591；district 必須是三重區。未知的一樓面積與座標請留 null。</p><pre>{JSON.stringify([{ source: "manual", sourceId: "your-listing-id", title: "請填真實物件名稱", url: "https://example.com/replace-with-real-listing", address: "請填真實地址", district: "三重區", rent: 30000, areaPing: 20, firstFloorPing: null, lat: null, lng: null }], null, 2)}</pre>
      <p>Places 需要有效座標。可由 Google 地圖確認後填入；匯入操作不會發送 LINE 通知。</p></details>
  </main>;
}
