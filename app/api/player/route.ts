import { NextResponse } from "next/server";

const cache = new Map<string, { data: any; timestamp: number }>();

const CACHE_TTL = 60_000;

function rankToUrl(rank: string) {
  const map: Record<string, string> = {
    gold: "/images/gold.png",
    platinum: "/images/platinum.png",
    sapphire: "/images/sapphire.png",
    ruby: "/images/ruby.png",
    diamond: "/images/diamond.png",
    master: "/images/master.png",
    "grand master": "/images/grandmaster.png",
    grandmaster: "/images/grandmaster.png",
  };

  return map[rank.toLowerCase()];
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");
  const game = searchParams.get("game") ?? "24p";

  if (!name) {
    return NextResponse.json(
      { error: "Player name required" },
      { status: 400 },
    );
  }

  const gameParam = game === "12p" ? "mkworld12p" : "mkworld24p";
  const key = `${name.toLowerCase()}:${gameParam}`;

  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  const res = await fetch(
    `https://lounge.mkcentral.com/api/player/details?name=${encodeURIComponent(
      name,
    )}&game=${gameParam}`,
    { cache: "no-store" },
  );

  if (!res.ok) {
    return NextResponse.json({ error: "Upstream error" }, { status: 502 });
  }

  const upstream = await res.json();

  const tableEvents =
    upstream.mmrChanges?.filter((c: any) => c.reason === "Table") ?? [];

  const allScores = tableEvents.flatMap((c: any) => c.partnerScores ?? []);

  const partnerAvg =
    allScores.length === 0
      ? null
      : Math.round(
          (allScores.reduce((a: number, b: number) => a + b, 0) /
            allScores.length) *
            100,
        ) / 100;

  const lastDiff = tableEvents[0]?.mmrDelta ?? null;

  const player = {
    name: upstream.name,
    mmr: upstream.mmr,
    maxMmr: upstream.maxMmr,
    overallRank: upstream.overallRank,
    eventsPlayed: upstream.eventsPlayed,
    winRate: upstream.winRate,
    winLossLastTen: upstream.winLossLastTen,
    averageScore: upstream.averageScore,
    averageLastTen: upstream.averageLastTen,
    rank: upstream.rank,
    countryCode: upstream.countryCode,
    countryName: upstream.countryName,
    partnerAvg,
    lastDiff,
    rank_icon_url: rankToUrl(upstream.rank),
  };

  cache.set(key, { data: player, timestamp: Date.now() });

  return NextResponse.json(player);
}
