"use client";

import {
  ArrowDown,
  ArrowRight,
  CalendarBlank,
  Crown,
  Info,
  Medal,
  MapPin,
  UsersThree,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { calculateHallOfFame, calculateWaitStats } from "../lib/analytics/metrics";
import { DATA_SNAPSHOT } from "../lib/data/snapshot-config";
import { activeDatasetMode, activeSnapshot } from "../lib/demo-data";
import { MOCK_HALL_OF_FAME, MOCK_PEER_CASES } from "../lib/data/mock-snapshot";
import {
  LOCATIONS,
  type CaseStatus,
  type Location,
  type MockCheckCase,
  type PublicCase,
  type WaitStats,
} from "../lib/data/models";

const LOCATION_NAMES: Record<Location, string> = {
  beijing: "北京",
  shanghai: "上海",
  guangzhou: "广州",
  shenyang: "沈阳",
  wuhan: "武汉",
};

const STATUS_NAMES: Record<Exclude<CaseStatus, "unknown">, string> = {
  pending: "Pending",
  clear: "Clear",
  reject: "Reject",
};

const CITY_TONES: Record<Location, string> = {
  beijing: "coral",
  shanghai: "blue",
  guangzhou: "green",
  wuhan: "purple",
  shenyang: "amber",
};

type DisplayCase = PublicCase | MockCheckCase;

function formatDays(value: number | null) {
  if (value === null) return "—";
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return value.replace(/^2026-/, "").replace("-", ".");
}

function startDate(record: DisplayCase) {
  return "checkDate" in record ? record.checkDate : record.startDate;
}

function endDate(record: DisplayCase) {
  return "completeDate" in record ? record.completeDate : record.endDate;
}

function locationOf(record: DisplayCase) {
  return "location" in record ? record.location : record.city;
}

function caseId(record: DisplayCase) {
  return "publicId" in record ? record.publicId : record.id;
}

function statusLabel(status: Exclude<CaseStatus, "unknown">) {
  return STATUS_NAMES[status];
}

function scrollToSection(id: string) {
  window.history.replaceState({}, "", `${window.location.pathname}${window.location.search}#${id}`);
  const target = document.getElementById(id);
  if (target && typeof target.scrollIntoView === "function") {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export function EvidenceAtlas() {
  const [selectedCity, setSelectedCity] = useState<Location | null>(null);
  const [peerVisibleCount, setPeerVisibleCount] = useState(12);

  useEffect(() => {
    const sync = () => {
      const city = new URLSearchParams(window.location.search).get("city");
      setSelectedCity(city && LOCATIONS.includes(city as Location) ? (city as Location) : null);
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const selectCity = (city: Location) => {
    const params = new URLSearchParams(window.location.search);
    params.set("city", city);
    window.history.pushState({}, "", `/?${params.toString()}`);
    setSelectedCity(city);
  };

  const clearCity = () => {
    window.history.pushState({}, "", "/");
    setSelectedCity(null);
  };

  const peerStats = useMemo(() => calculateWaitStats(MOCK_PEER_CASES), []);
  const hallOfFame = useMemo(() => calculateHallOfFame(MOCK_HALL_OF_FAME), []);
  const selectedCases = selectedCity
    ? activeSnapshot.cases.filter((item) => item.location === selectedCity)
    : [];
  const isStatic = activeDatasetMode === "checkee-static";

  return (
    <div className="checkmate-app">
      <header className="checkmate-header">
        <a className="checkmate-brand" href="#city-status" aria-label="回到城市等待情况">
          <span className="checkmate-brand__mark" aria-hidden="true">
            C
          </span>
          <span>Checkmate</span>
        </a>
        <nav className="checkmate-nav" aria-label="页面导航">
          <a href="#city-status">城市情况</a>
          <a href="#peer-sample">同学样本</a>
          <a href="#hall-of-fame">名人堂</a>
        </nav>
        <span className="snapshot-badge">STATIC SNAPSHOT</span>
      </header>

      <main>
        <section className="stage3d-hero" id="city-status" aria-labelledby="page-title">
          <div className="stage3d-hero__copy">
            <p className="eyebrow">中国 F-1 Check 等待情况</p>
            <h1 id="page-title">不同领区，通常等多久？</h1>
            <p className="stage3d-hero__lede">
              基于公开案例整理，数据截至 {DATA_SNAPSHOT.cutoffDate}
              。先看城市中位等待，再看看构成这些数字的真实样本。
            </p>
          </div>
          <div className="hero-trust-note">
            <span>公开数据集</span>
            <strong>{activeSnapshot.national.sampleCount} 个 F-1 案例</strong>
            <small>{DATA_SNAPSHOT.label} · 非官方处理时间</small>
          </div>
        </section>

        <section className="stage3d-section city-section" aria-labelledby="city-section-title">
          <div className="section-intro">
            <div>
              <p className="section-kicker">
                <MapPin size={17} weight="bold" /> 城市等待情况
              </p>
              <h2 id="city-section-title">先看中位数，再看两边的人。</h2>
            </div>
            <p>每个城市只突出较快 25%、中位数和较慢 25%。样本量放在旁边，帮助你判断数字的分量。</p>
          </div>

          <div className="city-grid" aria-label="五个城市的等待时长统计">
            {LOCATIONS.map((city) => (
              <CityCard
                key={city}
                city={city}
                stats={activeSnapshot.locations[city].waitStats}
                sampleCount={activeSnapshot.locations[city].sampleCount}
                selected={selectedCity === city}
                onClick={() => selectCity(city)}
              />
            ))}
          </div>

          {selectedCity && (
            <CityDetail
              city={selectedCity}
              cases={selectedCases}
              onClose={clearCity}
              onScrollToCases={() => scrollToSection("public-cases")}
            />
          )}
        </section>

        <section
          className="stage3d-section public-cases-section"
          id="public-cases"
          aria-labelledby="public-cases-title"
        >
          <div className="section-intro section-intro--compact">
            <div>
              <p className="section-kicker">
                <CalendarBlank size={17} weight="bold" /> 身边的公开案例
              </p>
              <h2 id="public-cases-title">数字背后，是一条条时间线。</h2>
            </div>
            <p>
              {selectedCity
                ? `当前查看：${LOCATION_NAMES[selectedCity]}`
                : "点击上面的城市，展开对应的案例。"}
            </p>
          </div>
          {selectedCity ? (
            <CaseList records={selectedCases} emptyLabel="当前城市没有可展示的公开案例。" />
          ) : (
            <div className="selection-prompt">
              <span className="selection-prompt__number">5</span>
              <div>
                <strong>选择一个城市</strong>
                <p>从城市中位数开始，再进入当前城市的公开案例。</p>
              </div>
              <ArrowDown size={20} aria-hidden="true" />
            </div>
          )}
        </section>

        <section
          className="stage3d-section peer-section"
          id="peer-sample"
          aria-labelledby="peer-title"
        >
          <div className="section-intro">
            <div>
              <p className="section-kicker">
                <UsersThree size={17} weight="bold" /> 个人匿名样本 · DEMO DATA
              </p>
              <h2 id="peer-title">身边同学现在等多久？</h2>
            </div>
            <p>一组不按城市划分的独立样本。开发阶段使用匿名 mock 数据，未来可直接替换文件。</p>
          </div>
          <WaitStatsPanel stats={peerStats} sampleLabel="样本 n = 100" />
          <CaseList
            records={MOCK_PEER_CASES.slice(0, peerVisibleCount)}
            emptyLabel="暂无同学样本。"
            mockLabel="DEMO DATA"
          />
          {peerVisibleCount < MOCK_PEER_CASES.length && (
            <button
              className="text-button"
              onClick={() => setPeerVisibleCount((count) => count + 12)}
            >
              查看更多同学样本 <ArrowRight size={17} />
            </button>
          )}
        </section>

        <section
          className="stage3d-section hall-section"
          id="hall-of-fame"
          aria-labelledby="hall-title"
        >
          <div className="section-intro">
            <div>
              <p className="section-kicker">
                <Crown size={17} weight="bold" /> 精选真实案例 · DEMO DATA
              </p>
              <h2 id="hall-title">Check 名人堂</h2>
            </div>
            <p>
              有些 Check 是等待，有些已经快成为长期项目了。开发阶段先用合理范围的 mock 案例占位。
            </p>
          </div>
          <div className="hall-list" aria-label="Check 名人堂 Top 10">
            {hallOfFame.map((record, index) => (
              <HallRow key={caseId(record)} record={record} rank={index + 1} />
            ))}
          </div>
        </section>

        <section className="methodology-section" id="methods" aria-labelledby="methods-title">
          <details>
            <summary id="methods-title">
              <Info size={18} weight="bold" /> 数据说明 <ArrowDown size={17} />
            </summary>
            <div className="methodology-grid">
              <p>
                数据截止日期：{DATA_SNAPSHOT.cutoffDate}。公开数据来自手工保存的 Checkee.info HTML
                快照，经过清洗、标准化和去重。
              </p>
              <p>
                Pending 案例统一计算到截止日；已结束案例使用原始记录中的合法结束日期。所有 duration
                使用 calendar day difference，同一天为 0 天。
              </p>
              <p>
                较快 25%、中位数和较慢 25%分别对应
                Q1、Median、Q3。样本不代表官方签证处理时间，也不能预测个人结果。
              </p>
              <p>
                Checkmate
                展示的是公开样本的统计情况，不是美国领馆官方处理时间，也无法预测某一个人的签证结果。
              </p>
            </div>
          </details>
        </section>
      </main>

      <footer className="checkmate-footer">
        <span>
          Checkmate · {isStatic ? "公开数据集" : "DEMO DATA"} · {DATA_SNAPSHOT.label}
        </span>
        <span>Checkee.info · 非实时 snapshot</span>
      </footer>
    </div>
  );
}

function CityCard({
  city,
  stats,
  sampleCount,
  selected,
  onClick,
}: {
  city: Location;
  stats: WaitStats;
  sampleCount: number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`city-card city-card--${CITY_TONES[city]}${selected ? " is-selected" : ""}`}
      onClick={onClick}
      aria-pressed={selected}
      aria-label={`${LOCATION_NAMES[city]} ${sampleCount} 个样本，中位数 ${formatDays(stats.median)} 天`}
    >
      <span className="city-card__topline">
        <span className="city-card__dot" />
        {LOCATION_NAMES[city]}
        <small>n={sampleCount}</small>
      </span>
      <span className="city-card__median">
        <strong>{formatDays(stats.median)}</strong>
        <em>天</em>
      </span>
      <span className="city-card__label">中位等待</span>
      <span className="city-card__range">
        <span>
          <small>较快 25%</small>
          <b>{formatDays(stats.q1)} 天</b>
        </span>
        <span>
          <small>较慢 25%</small>
          <b>{formatDays(stats.q3)} 天</b>
        </span>
      </span>
      <span className="city-card__action">
        {selected ? "正在查看" : "查看案例"} <ArrowRight size={16} />
      </span>
    </button>
  );
}

function CityDetail({
  city,
  cases,
  onClose,
  onScrollToCases,
}: {
  city: Location;
  cases: PublicCase[];
  onClose: () => void;
  onScrollToCases: () => void;
}) {
  const stats = activeSnapshot.locations[city].waitStats;
  return (
    <div className="city-detail" aria-labelledby="city-detail-title">
      <div className="city-detail__heading">
        <div>
          <p className="section-kicker">
            <MapPin size={17} weight="bold" /> 当前查看：{LOCATION_NAMES[city]}
          </p>
          <h3 id="city-detail-title">{LOCATION_NAMES[city]}的公开案例</h3>
          <p>
            中位等待 <strong>{formatDays(stats.median)} 天</strong> · {cases.length} 条样本 ·
            案例按最近 Check 日期排列
          </p>
        </div>
        <div className="city-detail__actions">
          <button className="text-button" onClick={onScrollToCases}>
            查看案例列表 <ArrowRight size={17} />
          </button>
          <button className="quiet-button" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
      <CaseList records={cases.slice(0, 6)} emptyLabel="当前样本不足" />
    </div>
  );
}

function WaitStatsPanel({ stats, sampleLabel }: { stats: WaitStats; sampleLabel: string }) {
  return (
    <div className="wait-stats-panel" aria-label="Q1、中位数和 Q3 等待时长">
      <WaitStat label="较快 25%" detail="Q1" value={stats.q1} />
      <WaitStat label="中位数" detail="Median" value={stats.median} featured />
      <WaitStat label="较慢 25%" detail="Q3" value={stats.q3} />
      <small className="wait-stats-panel__sample">{sampleLabel}</small>
    </div>
  );
}

function WaitStat({
  label,
  detail,
  value,
  featured = false,
}: {
  label: string;
  detail: string;
  value: number | null;
  featured?: boolean;
}) {
  return (
    <div className={`wait-stat${featured ? " is-featured" : ""}`}>
      <small>
        {label} <i>{detail}</i>
      </small>
      <strong>{formatDays(value)}</strong>
      <span>天</span>
    </div>
  );
}

function CaseList({
  records,
  emptyLabel,
  mockLabel,
}: {
  records: DisplayCase[];
  emptyLabel: string;
  mockLabel?: string;
}) {
  if (!records.length) return <div className="case-empty">{emptyLabel}</div>;
  return (
    <div className="case-list" aria-label="案例列表">
      {records.map((record) => (
        <CaseCard key={caseId(record)} record={record} mockLabel={mockLabel} />
      ))}
    </div>
  );
}

function CaseCard({ record, mockLabel }: { record: DisplayCase; mockLabel?: string }) {
  const city = locationOf(record);
  const end = endDate(record);
  return (
    <article className="case-card">
      <div className="case-card__duration">
        <strong>{formatDays(record.durationDays)}</strong>
        <span>天</span>
      </div>
      <div className="case-card__main">
        <div className="case-card__status-line">
          <span className={`status-chip status-chip--${record.status}`}>
            {statusLabel(record.status)}
          </span>
          {mockLabel && <span className="mock-chip">{mockLabel}</span>}
        </div>
        <p>
          {formatDate(startDate(record))} <span>→</span>{" "}
          {record.status === "pending"
            ? `截至 ${formatDate(record.effectiveEndDate)}`
            : formatDate(end)}
        </p>
      </div>
      <div className="case-card__meta">
        <span>{city ? LOCATION_NAMES[city] : "匿名样本"}</span>
        <span>
          {"visaEntry" in record
            ? record.visaEntry === "initial"
              ? "Initial"
              : record.visaEntry === "renewal"
                ? "Renewal"
                : "Unknown"
            : "F-1"}
        </span>
      </div>
    </article>
  );
}

function HallRow({ record, rank }: { record: MockCheckCase; rank: number }) {
  const treatment = rank <= 3 ? ["gold", "silver", "bronze"][rank - 1] : "standard";
  const title =
    rank === 1
      ? "年度耐心奖"
      : rank === 2
        ? "长期观察员"
        : rank === 3
          ? "耐心值 MAX"
          : "长期项目候选";
  return (
    <article className={`hall-row hall-row--${treatment}`}>
      <div className="hall-row__rank">
        {rank <= 3 ? <Medal size={23} weight="fill" aria-hidden="true" /> : "#" + rank}
      </div>
      <div className="hall-row__body">
        <div>
          <strong>{title}</strong>
          <span>
            {record.city ? LOCATION_NAMES[record.city] : "匿名案例"} · {statusLabel(record.status)}
          </span>
        </div>
        <p>
          {formatDate(record.startDate)} <span>→</span>{" "}
          {record.status === "pending"
            ? `截至 ${formatDate(record.effectiveEndDate)}`
            : formatDate(record.endDate)}
        </p>
      </div>
      <div className="hall-row__duration">
        <strong>{formatDays(record.durationDays)}</strong>
        <span>天</span>
        {rank === 1 && <Crown size={18} aria-label="第一名" />}
      </div>
    </article>
  );
}
