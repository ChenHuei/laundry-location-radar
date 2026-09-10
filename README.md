# 洗衣店選址雷達

針對「新北市三重區 Oday 自助洗衣加盟」的店面監控 MVP。

## 目前已完成
- Next.js 16 Dashboard
- 100 分固定評分模型：住宅 30 / 競品 25 / 店面 20 / 租金 15 / 動線 10
- 致命條件降級（不可 24H、管線條件不符）
- Collector 抽象層：mock / 591 adapter
- Supabase schema 與 upsert 去重
- 每小時 Vercel Cron endpoint
- 新物件且 >=80 分時 LINE Messaging API push
- 591 adapter 隔離，避免核心系統綁死特定抓取方式

## 尚待接線
1. 591 資料來源：先確認允許的來源/格式，再實作 HTML parser 或 JSON bridge。
2. Google Places：競品數、評分、距離、Oday 最近距離。
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
`vercel.json` 已設定 `0 * * * *`，每小時整點觸發 `/api/cron/scan`。Vercel cron 使用 UTC，但每小時一次不受時區影響。
設定 `CRON_SECRET` 後，Vercel 會用 Bearer token 保護 cron endpoint。

## 591 collector 注意
591 未假設存在一般公開 API。`src/lib/collectors/source591.ts` 是可替換 adapter；請只使用當下服務條款/robots 允許的方式，不繞過 CAPTCHA、登入或反爬機制。若直接 HTML 不適合，可改成：
- 合法 JSON bridge/export
- 手動匯入
- 其他房仲平台 collector

## 下一步建議
先接 Google Places + 手動匯入 591 JSON，讓評分與 Dashboard 真正可用；確認 591 可接受的自動化方式後，再把 collector 換成全自動。
