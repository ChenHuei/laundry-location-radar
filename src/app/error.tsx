"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="wrap narrow"><h1>暫時無法載入資料</h1><p>請確認資料庫連線與資料表設定；既有資料不會因此刪除。</p><button onClick={reset}>重新載入</button> <Link href="/setup">服務設定</Link></main>;
}
