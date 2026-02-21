"use client";

import { useEffect, useState } from "react";

interface PlayerResponse {
  name: string;
  mmr: number;
  rank: string;
  rank_icon_url?: string;
  countryCode?: string;
  partnerAvg?: number;
  overallRank?: number;
  lastDiff?: number;
  averageScore?: number;
}

type ViewMode = "default" | "events" | "winloss" | "rank" | "lastmatch";

export default function Home() {
  const PLAYER_NAME = "Julian";
  const GAME_MODE = "12p";

  const [data, setData] = useState<PlayerResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<ViewMode>("default");
  const [nextViewMode, setNextViewMode] = useState<ViewMode | null>(null);

  useEffect(() => {
    const fetchPlayerData = async () => {
      try {
        const res = await fetch(
          `/api/player?name=${encodeURIComponent(
            PLAYER_NAME,
          )}&game=${GAME_MODE}`,
        );

        if (!res.ok) throw new Error();

        const json: PlayerResponse = await res.json();
        setData(json);
      } catch {
        setError("Player not found");
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerData();
  }, []);

  useEffect(() => {
    if (loading || error) return;

    const stats: ViewMode[] = ["lastmatch", "rank", "winloss"];
    let currentStatIndex = 0;
    let showingDefault = true;

    const scheduleNextTransition = () => {
      const displayTime = showingDefault ? 6000 : 4000;

      const timer = setTimeout(() => {
        const nextView = showingDefault ? stats[currentStatIndex] : "default";

        setNextViewMode(nextView);

        setTimeout(() => {
          setViewMode(nextView);
          setNextViewMode(null);

          if (showingDefault) {
            showingDefault = false;
          } else {
            showingDefault = true;
            currentStatIndex = (currentStatIndex + 1) % stats.length;
          }

          scheduleNextTransition();
        }, 600);
      }, displayTime);

      return timer;
    };

    const timer = scheduleNextTransition();
    return () => clearTimeout(timer);
  }, [loading, error]);

  if (loading) {
    return (
      <div id="app">
        <div className="player-card-scale">
          <div className="loading">Loading Stats...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div id="app">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  const flagUrl = data.countryCode
    ? `https://flagcdn.com/w40/${data.countryCode.toLowerCase()}.png`
    : null;

  const lastMatchText =
    data.lastDiff === null || data.lastDiff === undefined
      ? "N/A"
      : data.lastDiff > 0
        ? `+${data.lastDiff}`
        : data.lastDiff;

  const avgText = data.averageScore ?? "0";

  const rankClass = `rank-${data.rank.toLowerCase().replace(" ", "")}`;

  return (
    <div id="app">
      <div className="player-card-scale">
        <div className="overlay-ui">
          <div className="mode-badge">12P</div>
        </div>
        <div className="player-card">
          <div className="bg-layer" />
          {data.rank_icon_url && (
            <img
              src={data.rank_icon_url}
              alt="Rank"
              className={`rank-icon ${rankClass}`}
            />
          )}

          <div className="player-info-wrapper">
            {/* DEFAULT */}
            <div
              className={`player-info-container ${
                viewMode === "default" && !nextViewMode
                  ? "active"
                  : viewMode === "default" && nextViewMode
                    ? "active slide-out"
                    : nextViewMode === "default"
                      ? "active slide-in"
                      : "hidden"
              }`}
            >
              <div className="player-info">
                <span className="player-name" data-text={data.name}>
                  {data.name}
                </span>
                {flagUrl && (
                  <img
                    src={flagUrl}
                    className="country-flag"
                    alt={data.countryCode ?? "Country"}
                  />
                )}
              </div>
              <div className="stat-label" data-text={data.mmr}>
                {data.mmr}
              </div>
            </div>

            {/* WINLOSS */}
            <div
              className={`player-info-container ${
                viewMode === "winloss" && !nextViewMode
                  ? "active"
                  : viewMode === "winloss" && nextViewMode
                    ? "active slide-out"
                    : nextViewMode === "winloss"
                      ? "active slide-in"
                      : "hidden"
              }`}
            >
              <div className="stat-display">
                <div className="stat-label" data-text="AVG">
                  AVG
                </div>
                <div className="stat-value" data-text={avgText}>
                  {avgText}
                </div>
              </div>
            </div>

            {/* LASTMATCH */}
            <div
              className={`player-info-container ${
                viewMode === "lastmatch" && !nextViewMode
                  ? "active"
                  : viewMode === "lastmatch" && nextViewMode
                    ? "active slide-out"
                    : nextViewMode === "lastmatch"
                      ? "active slide-in"
                      : "hidden"
              }`}
            >
              <div className="stat-display-lm">
                <div className="stat-label-lm" data-text="Last Match">
                  Last Match
                </div>
                <div
                  className={`stat-value-lm ${
                    data.lastDiff === null
                      ? ""
                      : data?.lastDiff || 0 > 0
                        ? "positive"
                        : data?.lastDiff || 0 < 0
                          ? "negative"
                          : ""
                  }`}
                  data-text={lastMatchText}
                >
                  {lastMatchText}
                </div>
              </div>
            </div>

            {/* RANK */}
            <div
              className={`player-info-container ${
                viewMode === "rank" && !nextViewMode
                  ? "active"
                  : viewMode === "rank" && nextViewMode
                    ? "active slide-out"
                    : nextViewMode === "rank"
                      ? "active slide-in"
                      : "hidden"
              }`}
            >
              <div className="stat-display">
                <div className="stat-label" data-text="Rank">
                  Rank
                </div>
                <div
                  className="stat-value"
                  data-text={`#${data.overallRank ?? "N/A"}`}
                >
                  #{data.overallRank ?? "N/A"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
