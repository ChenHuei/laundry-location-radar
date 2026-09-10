import { ListingCandidate } from "@/types/listing";
import { ScoreBreakdown } from "@/types/listing";

export async function sendHighScoreNotification(listing: ListingCandidate, score: ScoreBreakdown) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const userId = process.env.LINE_USER_ID;
  if (!token || !userId) return { skipped: true, reason: "LINE credentials not configured" };
  const text = [
    "🏠 發現高分洗衣店候選",
    `${listing.title}`,
    `⭐ ${score.total} 分`,
    `💰 $${listing.rent.toLocaleString()} / 月`,
    `📐 ${listing.firstFloorPing ?? listing.areaPing} 坪`,
    listing.address,
    score.pros.slice(0,2).map(x=>`✅ ${x}`).join("\n"),
    score.cons.slice(0,2).map(x=>`⚠️ ${x}`).join("\n"),
    listing.url
  ].filter(Boolean).join("\n");

  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method:"POST",
    headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
    body: JSON.stringify({ to:userId, messages:[{ type:"text", text }] })
  });
  if (!res.ok) throw new Error(`LINE push failed: ${res.status} ${await res.text()}`);
  return { skipped:false };
}
