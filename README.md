# 洗衣店選址雷達

針對「新北市三重區 Oday 自助洗衣加盟」的店面監控 MVP。

## 目前已完成
- Next.js 16 Dashboard
- 100 分固定評分模型：住宅 30 / 競品 25 / 店面 20 / 租金 15 / 動線 10
- 致命條件降級（不可 24H、管線條件不符）
- Collector 抽象層：mock / 591 adapter
- Supabase schema 與 upsert 去重
- 每日一次 Vercel Cron endpoint
- 新物件且 >=80 分時 LINE Messaging API push
- 591 adapter 隔離，避免核心系統綁死特定抓取方式

## 尚待接線
1. 591 資料來源：先確認允許的來源/格式，再實作 HTML parser 或 JSON bridge。
2. Google Places 後續：地址定位、人工競品分類，以及超過單次結果上限的覆蓋改善。
3. 人口/GIS：500m、800m 戶數估算。
4. 後台人工編輯：競品強弱、臨停、面寬、24H、管線、現勘狀態。

## 本機啟動
```bash
cp .env.example .env.local
npm install
npm run dev
```
開啟 http://localhost:3000

## Supabase
建立專案後，把 `supabase/schema.sql` 貼到 SQL Editor 執行，再填：
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

## LINE 通知
建立 LINE Official Account / Messaging API channel，設定：
- LINE_CHANNEL_ACCESS_TOKEN
- LINE_USER_ID

高分通知使用官方 push endpoint `/v2/bot/message/push`。

## Cron
`vercel.json` 已設定 `0 0 * * *`，每日觸發 `/api/cron/scan`，符合 Vercel Hobby 的每日一次限制。Vercel 使用 UTC，對應台灣時間 08:00；Hobby 可能在 08:00–08:59 之間觸發，不保證整點執行。排程於正式環境部署後生效。
修改頻率時，同步更新 `vercel.json` 與 `src/lib/config.ts` 的 `scanIntervalHours`。
設定 `CRON_SECRET` 後，Vercel 會用 Bearer token 保護 cron endpoint。

## 591 collector 注意
591 未假設存在一般公開 API。`src/lib/collectors/source591.ts` 是可替換 adapter；請只使用當下服務條款/robots 允許的方式，不繞過 CAPTCHA、登入或反爬機制。若直接 HTML 不適合，可改成：
- 合法 JSON bridge/export
- 手動匯入
- 其他房仲平台 collector

## 下一步建議
先接 Google Places + 手動匯入 591 JSON，讓評分與 Dashboard 真正可用；確認 591 可接受的自動化方式後，再把 collector 換成全自動。


## Google Places 競爭分析

已接上 Places API (New) 的 Nearby Search。設定伺服器環境變數 `GOOGLE_PLACES_API_KEY`，並在來源物件提供有效 `lat` / `lng`；瀏覽器地圖另用 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`。伺服器金鑰使用 `server-only` 模組保護，不送到前端。

搜尋 1,200m 內 laundry 業者，顯示 500m / 800m 統計、Oday、評分、評論數、營業時間與直線距離。Dashboard 可展開「競爭與評分明細」。資料存於既有 `enrichment` JSONB，不需 schema migration。

未設定金鑰、沒有座標、API 失敗時顯示待確認，不視為零競爭；mock 不呼叫 Google。單次達 20 筆或部分資料無效時標為不完整。未回傳 Oday 不代表附近沒有同品牌店。所有自動發現業者先標為未知強弱（laundry 可能包含送洗店），等待後續人工審查。缺失／不完整資料的競爭分上限為 12/25；未知業者在 500m 內每間扣 3 分。

目前不自動定位地址，來源未提供座標就不會執行 Places。實際 Google API／Supabase／LINE 整合需另以已設定的服務驗證。每次真實物件掃描都會查詢 Places，請依使用量設定 Google 配額。

參考：[Google Nearby Search (New)](https://developers.google.com/maps/documentation/places/web-service/nearby-search)。

## 開發檢查

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

測試使用模擬回應，不連線 Google 或發送 LINE。涵蓋缺失資料、API 失敗、距離與 Oday 邊界、結果去重／上限、重跑保留人工欄位及高分通知去重。通知目前維持「首次發現」語意；發送失敗重試與並行排程鎖屬排程／通知後續工作。
