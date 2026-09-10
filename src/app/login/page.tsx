import { isOwner } from "@/lib/auth";
import Link from "next/link";
export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const owner = await isOwner();
  const { error } = await searchParams;
  const ready = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.ADMIN_EMAIL);
  return <main className="wrap narrow"><Link href="/">← 返回雷達</Link><h1>管理者登入</h1>
    <p>正式物件、筆記與人工修改僅開放管理者使用。</p>
    {owner && <form action="/api/auth/logout" method="post"><p>目前已登入。</p><button type="submit">登出</button></form>}
    {!ready ? <div className="panel">登入服務尚未設定。請先查看 <Link href="/setup">服務設定步驟</Link>。</div> : <form action="/api/auth/login" method="post" className="panel form-grid">
      {error && <p role="alert" className="bad">登入失敗，請確認密碼後重試。</p>}
      <label>管理者密碼<input name="password" type="password" autoComplete="current-password" required maxLength={200} /></label>
      <button type="submit">登入</button>
    </form>}
  </main>;
}
