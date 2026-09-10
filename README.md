# 洗衣店選址雷達

針對新北市三重區 Oday 自助洗衣加盟的選址與審查工具。

線上示範：https://laundry-location-radar.vercel.app

## 已完成

- Next.js Dashboard、可操作的狀態篩選、物件詳情頁與手機版排版。
- 固定 100 分評分：住宅 30／競爭 25／店面 20／租金 15／動線 10；已確認的致命條件另列並將總分限制在 59。
- Places API (New) 競爭分析，500m／800m 統計、Oday 分開處理，缺失資料不視為零競爭。
- 收藏、現勘狀態、筆記、面積／管線條件／加盟衝突確認、人工競品強弱／同品牌／排除分類。
- 人工審查存入獨立 `manual_review`，掃描不覆蓋；版本檢查避免舊視窗覆寫新編輯。
- 一般表單新增真實物件、進階 JSON 批次匯入；驗證來源、數字與連結，重送去重。
- Supabase Auth 管理者登入；正式資料與修改端點需登入，資料表啟用 RLS。
- 價格／坪數／刊登狀態變動歷史、掃描成功／失敗紀錄。
- Vercel Hobby 每日排程與 LINE 首次高分通知程式；正式運作仍需服務設定。
- `/setup` 服務設定清單與可下載的完整資料表 SQL。

## 先啟用 Supabase

1. 建立 Supabase 專案。
2. 執行 `supabase/schema.sql`，再執行 `supabase/migrations/002_review.sql`；或下載 `/setup.sql` 一次執行完整腳本。可重跑，不刪除既有資料。
3. 在 Authentication → Users 建立管理者 email/password 使用者。
4. 設定 Vercel 環境變數並重新部署：
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`（僅伺服器使用）
   - `ADMIN_EMAIL`（對應上一步的帳號）
   - `LISTING_SOURCE=manual`
5. 從 `/login` 登入，使用 `/import` 新增真實物件。

登入 session 使用 HttpOnly、SameSite=Strict cookie，正式環境為 Secure。每次存取以 Supabase 驗證使用者及管理者 email；token 過期後重新登入。不在前端提供 service_role key。

沒有資料庫時只顯示唯讀 mock，不會在讀取頁面時抓取真實來源或呼叫付費 Places。表單會清楚標示尚未能保存。

## Google Places

在 Google Cloud 啟用 Places API (New)，設定伺服器 `GOOGLE_PLACES_API_KEY` 並限制可用 API。來源需提供有效 `lat` / `lng`；目前未自動定位地址。

查詢 1,200m 內、依距離排序的 laundry 業者。20 筆飽和或部分資料無效標為不完整；無金鑰、無座標或 API 失敗標為未知。500m 內未知業者每間扣 3 分；不完整／未知覆蓋的競爭分上限 12/25，再套用 Oday 扣分。

人工強弱、Oday 與排除覆寫以 Place ID 保存。Google laundry 類型可能含送洗店；評分／評論數不直接推定設備與利用率。未回傳 Oday 不等於附近沒有同品牌店。地圖使用外連，不需瀏覽器金鑰；`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` 保留供未來互動地圖使用。

參考：[Google Nearby Search (New)](https://developers.google.com/maps/documentation/places/web-service/nearby-search)。

## 戶數與場勘

可輸入 500m／800m 戶數，必須附來源、日期與估算方法；800m 戶數不得小於 500m。里級總戶數不可直接當成半徑戶數。尚未完成官方人口自動匯入／GIS 估算。

一樓面積未知時不再用總坪數替代。租金坪效與店型加分只使用已提供的一樓面積。建物用途禁止、24H 禁止、管線不符與已確認加盟衝突均列為阻擋條件。

## 每日掃描與 LINE

`vercel.json` 使用 `0 0 * * *`，正式環境每日台灣時間 08:00–08:59 執行。頻率與 `src/lib/config.ts` 的 `scanIntervalHours` 需同步調整。

設定隨機 `CRON_SECRET`；未設定或未帶正確 Bearer token 時一律 401，不執行掃描。manual 模式依最久未更新排序，每次重查至多 25 筆有效物件，超過時分日輪替。它不會自動發現新的 591 刊登。

LINE 需要建立官方帳號／Messaging API，並設定：

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_USER_ID`（接收者需先加好友）

自動掃描首次發現 >=80 且無致命條件的物件才通知；手動匯入與人工修改不推播。未設定 LINE 時不標記已送出。已通知的相同物件不重複通知。

目前通知仍是首次發現語意，持久化失敗重試／並行排程鎖待完成；發送失敗或缺少 LINE 設定後不會自動補發。正式大量掃描前需補上可靠的通知佇列。不要把示範部署視為已在監控真實資料。

## 591 與替代来源

591 維持 adapter；只接受事先確認允許的 JSON bridge/export，不繞過 CAPTCHA、登入或反爬。`LISTING_SOURCE=591` 搭配 `LISTING_SOURCE_URL`，資料需符合匯入格式，每批最多 25 筆。

未提供可信完整快照前，不因來源缺少某筆就自動判定下架。歷史資料保留；目前刊登有效狀態由來源／資料庫維護，人工審查可淘汰物件。

## 本機與驗證

```bash
cp .env.example .env.local
npm install
npm run dev
npm test
npm run typecheck
npm run lint
npm run build
```

`predev`／`prebuild` 會從 schema 與 migration 產生 `public/setup.sql`，不要手改產物。

測試包含純函式、API 模擬與 PGlite PostgreSQL migration 實測：人工覆寫、戶數來源、未知一樓面積、阻擋條件、匯入驗證、重掃去重與通知、歷史 trigger、重跑 migration、RLS 與舊版本編輯衝突。尚未以真實 Supabase Auth／Google／LINE 驗證完整串接。
