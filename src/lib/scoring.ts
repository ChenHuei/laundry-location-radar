import { ScoreBreakdown, ScoreInput } from "@/types/listing";

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export function scoreListing(x: ScoreInput): ScoreBreakdown {
  const pros: string[] = [];
  const cons: string[] = [];
  const fatalFlags: string[] = [];

  let housing = 14;
  if ((x.households500m ?? 0) >= 4500) housing += 8;
  else if ((x.households500m ?? 0) >= 3000) housing += 6;
  else if ((x.households500m ?? 0) >= 1800) housing += 3;
  if (x.rentalDemand === "high") housing += 4;
  else if (x.rentalDemand === "medium") housing += 2;
  if (x.oldApartmentDemand === "high") housing += 4;
  else if (x.oldApartmentDemand === "medium") housing += 2;
  housing = clamp(housing, 0, 30);
  if (housing >= 24) pros.push("住宅與洗衣需求條件佳");

  let competition = 25;
  competition -= (x.strongCompetitors500m ?? 0) * 5;
  competition -= (x.normalCompetitors500m ?? 0) * 3;
  competition -= (x.weakCompetitors500m ?? 0) * 1;
  const oday = x.nearestOdayMeters;
  if (oday != null) {
    if (oday < 500) { competition -= 15; cons.push(`Oday 約 ${oday}m，商圈高度重疊`); }
    else if (oday < 800) { competition -= 9; cons.push(`Oday 約 ${oday}m，需確認加盟保護距離`); }
    else if (oday < 1200) { competition -= 4; cons.push(`Oday 約 ${oday}m，仍需確認商圈切割`); }
    else pros.push("附近 Oday 距離相對安全");
  }
  competition = clamp(competition, 0, 25);

  const effectivePing = x.firstFloorPing ?? x.areaPing;
  let storefront = 8;
  if (effectivePing >= 18 && effectivePing <= 26) { storefront += 7; pros.push("一樓有效坪數接近 Oday 理想店型"); }
  else if (effectivePing >= 15 && effectivePing < 18) storefront += 4;
  else if (effectivePing < 13) { storefront -= 3; cons.push("一樓有效坪數偏小"); }
  if (x.utilitiesReady === true) storefront += 3;
  if (x.allow24h === true) storefront += 2;
  if (x.utilitiesReady === false) fatalFlags.push("三相電／排水／排風或瓦斯條件不符");
  if (x.allow24h === false) fatalFlags.push("不可 24 小時營業");
  storefront = clamp(storefront, 0, 20);

  let rentValue = 0;
  if (x.rent <= 26000) rentValue = 15;
  else if (x.rent <= 30000) rentValue = 13;
  else if (x.rent <= 35000) rentValue = 10;
  else if (x.rent <= 40000) rentValue = 7;
  else { rentValue = 3; cons.push("租金超過 4 萬目標"); }
  const rentPerPing = x.rent / Math.max(effectivePing, 1);
  if (rentPerPing < 1600) pros.push("有效坪租具競爭力");

  let access = 5;
  if (x.frontage === "good") access += 3;
  else if (x.frontage === "poor") { access -= 2; cons.push("店面曝光偏弱"); }
  if (x.parking === "good") access += 2;
  else if (x.parking === "poor") { access -= 2; cons.push("搬棉被/衣物臨停不便"); }
  access = clamp(access, 0, 10);

  let total = Math.round(housing + competition + storefront + rentValue + access);
  if (fatalFlags.length) total = Math.min(total, 59);
  if (total >= 80) pros.unshift("達到高分通知門檻");

  return { housing, competition, storefront, rentValue, access, total, pros, cons, fatalFlags };
}
