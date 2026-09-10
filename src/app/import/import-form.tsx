"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function ImportForm({ enabled }: { enabled: boolean }) {
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false); const router = useRouter();
  async function submit(body: string) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/import", { method: "POST", headers: { "Content-Type": "application/json" }, body });
      const data = await response.json();
      if (!response.ok) { setMessage(data.error); return; }
      router.push("/"); router.refresh();
    } catch { setMessage("連線失敗，請重新確認資料後匯入。"); } finally { setBusy(false); }
  }
  return <>
    <form className="panel" onSubmit={async e => {
      e.preventDefault(); const data = new FormData(e.currentTarget);
      const url = String(data.get("url")).trim();
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(url));
      const sourceId = "url-" + Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2,"0")).join("").slice(0,32);
      const optionalNumber = (name: string) => data.get(name) ? Number(data.get(name)) : null;
      await submit(JSON.stringify([{ source: "manual", sourceId, title: String(data.get("title")), url, address: String(data.get("address")), district: "三重區", rent: Number(data.get("rent")), areaPing: Number(data.get("areaPing")), firstFloorPing: optionalNumber("firstFloorPing"), lat: optionalNumber("lat"), lng: optionalNumber("lng") }]));
    }}><h2>新增一筆物件</h2><fieldset disabled={!enabled || busy}>
      <label>物件名稱<input name="title" required maxLength={300} placeholder="例如：○○路一樓店面" /></label>
      <label>刊登連結<input name="url" type="url" required maxLength={2000} placeholder="貼上原始物件網址" /></label>
      <label>三重區完整地址<input name="address" required maxLength={500} /></label>
      <div className="form-grid"><label>月租（元）<input name="rent" type="number" min="1" max="10000000" step="1" required /></label><label>刊登總面積（坪）<input name="areaPing" type="number" min="0.1" max="10000" step="0.1" required /></label><label>一樓實際可用面積（坪）<input name="firstFloorPing" type="number" min="0.1" max="10000" step="0.1" placeholder="未知請留白" /></label></div>
      <details><summary>位置座標（查詢競爭業者需要）</summary><p className="muted">可從 Google 地圖確認座標。未知先留白，之後可用相同刊登連結更新資料。</p><div className="form-grid"><label>緯度<input name="lat" type="number" min="-90" max="90" step="any" placeholder="例如 25.x" /></label><label>經度<input name="lng" type="number" min="-180" max="180" step="any" placeholder="例如 121.x" /></label></div></details>
      <p className="muted">相同刊登連結會更新既有物件，保留現勘筆記與人工審查。</p><button disabled={!enabled || busy}>{busy ? "儲存與分析中…" : "新增並分析物件"}</button>
    </fieldset></form>
    <details className="panel"><summary>進階：批次 JSON 匯入</summary><form onSubmit={async e => { e.preventDefault(); await submit(String(new FormData(e.currentTarget).get("json"))); }}>
      <label>物件 JSON<textarea name="json" rows={12} maxLength={100000} required disabled={!enabled || busy} placeholder="貼上物件 JSON 陣列" /></label><button disabled={!enabled || busy}>{busy ? "處理中…" : "批次匯入"}</button>
    </form></details><p role="status">{message}</p>
  </>;
}
