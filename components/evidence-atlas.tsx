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
import {
  calculateHallOfFame,
  calculateWaitStats,
  sortByDurationDescending,
} from "../lib/analytics/metrics";
import { DATA_SNAPSHOT } from "../lib/data/snapshot-config";
import { activeDatasetMetadata, activeSnapshot } from "../lib/demo-data";
import { loadHallOfFameDataset, loadPeerDataset } from "../lib/data/manual-datasets";
import { formatDays } from "../lib/data/presentation";
import {
  type CheckCase,
  LOCATIONS,
  type CaseStatus,
  type Location,
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

type DisplayCase = PublicCase | CheckCase;
type AppView = "cities" | "peers" | "hall";

const VIEW_ITEMS: Array<{ key: AppView; label: string }> = [
  { key: "cities", label: "城市等待" },
  { key: "peers", label: "同学样本" },
  { key: "hall", label: "Check 名人堂" },
];

function readView() {
  const view = new URLSearchParams(window.location.search).get("view");
  return VIEW_ITEMS.some((item) => item.key === view) ? (view as AppView) : "cities";
}

function viewHref(view: AppView) {
  return `/?view=${view}`;
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
  const [activeView, setActiveView] = useState<AppView>("cities");
  const [selectedCity, setSelectedCity] = useState<Location | null>(null);
  const [publicVisibleCount, setPublicVisibleCount] = useState(20);
  const [peerVisibleCount, setPeerVisibleCount] = useState(20);

  useEffect(() => {
    const sync = () => {
      const params = new URLSearchParams(window.location.search);
      const city = params.get("city");
      setActiveView(readView());
      setSelectedCity(city && LOCATIONS.includes(city as Location) ? (city as Location) : null);
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const navigateView = (view: AppView) => {
    const params = new URLSearchParams(window.location.search);
    params.set("view", view);
    if (view !== "cities") {
      params.delete("city");
      setSelectedCity(null);
    }
    window.history.pushState({}, "", `${window.location.pathname}?${params.toString()}`);
    setActiveView(view);
  };

  const selectCity = (city: Location) => {
    const params = new URLSearchParams(window.location.search);
    params.set("view", "cities");
    params.set("city", city);
    window.history.pushState({}, "", `${window.location.pathname}?${params.toString()}`);
    setActiveView("cities");
    setSelectedCity(city);
    setPublicVisibleCount(20);
  };

  const clearCity = () => {
    const params = new URLSearchParams(window.location.search);
    params.set("view", "cities");
    params.delete("city");
    window.history.pushState({}, "", `${window.location.pathname}?${params.toString()}`);
    setSelectedCity(null);
  };

  const peerDataset = useMemo(() => loadPeerDataset(), []);
  const hallDataset = useMemo(() => loadHallOfFameDataset(), []);
  const peerStats = useMemo(() => calculateWaitStats(peerDataset.cases), [peerDataset.cases]);
  const hallOfFame = useMemo(() => calculateHallOfFame(hallDataset.cases), [hallDataset.cases]);
  const selectedCases = selectedCity
    ? sortByDurationDescending(
        activeSnapshot.cases.filter((item) => item.location === selectedCity),
      )
    : [];
  const isStatic = !activeDatasetMetadata.isMock;

  return (
    <div className="checkmate-app">
      <header className="checkmate-header">
        <a
          className="checkmate-brand"
          href={viewHref("cities")}
          onClick={(event) => {
            event.preventDefault();
            navigateView("cities");
          }}
          aria-label="回到城市等待"
        >
          <span className="checkmate-brand__mark" aria-hidden="true">
            C
          </span>
          <span>Checkmate</span>
        </a>
        <nav className="checkmate-nav" aria-label="页面导航">
          {VIEW_ITEMS.map((item) => (
            <a
              key={item.key}
              href={viewHref(item.key)}
              className={activeView === item.key ? "is-active" : undefined}
              aria-current={activeView === item.key ? "page" : undefined}
              onClick={(event) => {
                event.preventDefault();
                navigateView(item.key);
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <span className="snapshot-badge">
          {activeView === "cities" ? "STATIC SNAPSHOT" : "DEMO DATA"}
        </span>
      </header>

      <main className="checkmate-main">
        <PageHeader view={activeView} />
        {activeView === "cities" && (
          <CitiesView
            selectedCity={selectedCity}
            selectedCases={selectedCases}
            publicVisibleCount={publicVisibleCount}
            selectCity={selectCity}
            clearCity={clearCity}
            setPublicVisibleCount={setPublicVisibleCount}
          />
        )}
        {activeView === "peers" && (
          <PeerView
            dataset={peerDataset}
            stats={peerStats}
            visibleCount={peerVisibleCount}
            setVisibleCount={setPeerVisibleCount}
          />
        )}
        {activeView === "hall" && <HallView dataset={hallDataset} records={hallOfFame} />}

        <section className="methodology-section" id="methods" aria-labelledby="methods-title">
          <details>
            <summary id="methods-title">
              <Info size={18} weight="bold" /> 数据说明 <ArrowDown size={17} />
            </summary>
            <div className="methodology-grid">
              <p>
                城市等待页的数据截止日期为 {DATA_SNAPSHOT.cutoffDate}，来自手工保存的 Checkee.info
                HTML 快照，经过清洗、标准化和去重；同学样本与名人堂使用独立数据入口。
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
                城市卡片的“公开案例”是该城市全部案例数；“统计样本 n”是实际拥有有效 duration
                的记录数。 Reject 计入等待分布，但不计入 resolved duration。
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
        <span>
          {activeView === "cities" ? "Checkee.info · 非实时 snapshot" : "开发 mock · 非实时"}
        </span>
      </footer>
    </div>
  );
}

function PageHeader({ view }: { view: AppView }) {
  const copy = {
    cities: {
      eyebrow: "中国 F-1 · Checkee 公开样本",
      title: "城市等待",
      lede: "看看不同领区大概要等多久，再下钻到组成这些数字的公开案例。",
      meta: `${activeSnapshot.national.sampleCount} 个公开 F-1 案例 · 截至 ${DATA_SNAPSHOT.cutoffDate}`,
      badge: activeDatasetMetadata.isMock ? "DEMO DATA" : "REAL PUBLIC DATA",
    },
    peers: {
      eyebrow: "独立匿名样本",
      title: "身边同学",
      lede: "一组不按城市划分的样本，用来感受等待时间的分布。",
      meta: "当前为开发 mock · 可替换手工数据",
      badge: "DEMO DATA",
    },
    hall: {
      eyebrow: "独立维护的精选案例",
      title: "Check 名人堂",
      lede: "把最长的等待时间留档，看看哪些 Check 已经成了长期项目。",
      meta: "Top 10 · 当前为开发 mock",
      badge: "DEMO DATA",
    },
  }[view];
  return (
    <section className="checkmate-page-header" aria-labelledby="page-title">
      <div>
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1 id="page-title">{copy.title}</h1>
        <p className="checkmate-page-header__lede">{copy.lede}</p>
      </div>
      <div className="checkmate-page-header__meta">
        <span>{copy.badge}</span>
        <strong>{copy.meta}</strong>
        <small>描述性统计 · 非官方处理时间</small>
      </div>
    </section>
  );
}

function CitiesView({
  selectedCity,
  selectedCases,
  publicVisibleCount,
  selectCity,
  clearCity,
  setPublicVisibleCount,
}: {
  selectedCity: Location | null;
  selectedCases: PublicCase[];
  publicVisibleCount: number;
  selectCity: (city: Location) => void;
  clearCity: () => void;
  setPublicVisibleCount: (value: number | ((value: number) => number)) => void;
}) {
  return (
    <>
      <section
        className="checkmate-view-section city-section"
        id="city-status"
        aria-labelledby="city-section-title"
      >
        <div className="section-intro">
          <div>
            <p className="section-kicker">
              <MapPin size={17} weight="bold" /> 五个核心领区
            </p>
            <h2 id="city-section-title">先看中位数，再看两边的人。</h2>
          </div>
          <p>Median 是主指标；Q1、Q3 帮你看到分布边界，案例数帮助判断样本分量。</p>
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
        className="checkmate-view-section public-cases-section"
        id="public-cases"
        aria-labelledby="public-cases-title"
      >
        <div className="section-intro section-intro--compact">
          <div>
            <p className="section-kicker">
              <CalendarBlank size={17} weight="bold" /> 标准化公开案例
            </p>
            <h2 id="public-cases-title">每条记录，都是一条时间线。</h2>
          </div>
          <p>
            {selectedCity
              ? `当前查看：${LOCATION_NAMES[selectedCity]}`
              : "点击城市卡片，展开对应案例。"}
          </p>
        </div>
        {selectedCity ? (
          <>
            <CaseList
              records={selectedCases.slice(0, publicVisibleCount)}
              emptyLabel="当前城市没有可展示的公开案例。"
            />
            {publicVisibleCount < selectedCases.length && (
              <button
                className="text-button load-more-button"
                onClick={() => setPublicVisibleCount((count) => count + 20)}
              >
                查看更多公开案例 <ArrowRight size={17} />
              </button>
            )}
          </>
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
    </>
  );
}

function PeerView({
  dataset,
  stats,
  visibleCount,
  setVisibleCount,
}: {
  dataset: ReturnType<typeof loadPeerDataset>;
  stats: WaitStats;
  visibleCount: number;
  setVisibleCount: (value: number | ((value: number) => number)) => void;
}) {
  return (
    <section
      className="checkmate-view-section peer-section"
      id="peer-sample"
      aria-labelledby="peer-title"
    >
      <div className="section-intro">
        <div>
          <p className="section-kicker">
            <UsersThree size={17} weight="bold" /> 独立匿名样本 ·{" "}
            {dataset.metadata.isMock ? "DEMO DATA" : "手工数据"}
          </p>
          <h2 id="peer-title">身边同学现在等多久？</h2>
        </div>
        <p>
          {dataset.metadata.isMock
            ? "当前为开发 mock 数据，可直接替换手工数据文件。"
            : "当前为手工数据，和公开样本保持独立。"}
        </p>
      </div>
      <WaitStatsPanel stats={stats} sampleLabel={`统计样本 n = ${stats.sampleSize}`} />
      <CaseList
        records={dataset.cases.slice(0, visibleCount)}
        emptyLabel="暂无同学样本。"
        mockLabel={dataset.metadata.isMock ? "DEMO DATA" : undefined}
      />
      {visibleCount < dataset.cases.length && (
        <button
          className="text-button load-more-button"
          onClick={() => setVisibleCount((count) => count + 20)}
        >
          查看更多同学样本 <ArrowRight size={17} />
        </button>
      )}
    </section>
  );
}

function HallView({
  dataset,
  records,
}: {
  dataset: ReturnType<typeof loadHallOfFameDataset>;
  records: CheckCase[];
}) {
  return (
    <section
      className="checkmate-view-section hall-section"
      id="hall-of-fame"
      aria-labelledby="hall-title"
    >
      <div className="section-intro">
        <div>
          <p className="section-kicker">
            <Crown size={17} weight="bold" /> 独立精选案例 ·{" "}
            {dataset.metadata.isMock ? "DEMO DATA" : "手工数据"}
          </p>
          <h2 id="hall-title">最长等待 Top 10</h2>
        </div>
        <p>按 duration 从长到短排列。Top 3 先看，#4–10 用更紧凑的方式保留。</p>
      </div>
      <div className="hall-top-three" aria-label="Check 名人堂 Top 3">
        {records.slice(0, 3).map((record, index) => (
          <HallRow key={caseId(record)} record={record} rank={index + 1} featured />
        ))}
      </div>
      <div className="hall-list" aria-label="Check 名人堂第 4 至 10 名">
        {records.slice(3, 10).map((record, index) => (
          <HallRow key={caseId(record)} record={record} rank={index + 4} />
        ))}
      </div>
    </section>
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
        <small>公开案例 {sampleCount}</small>
      </span>
      <span className="city-card__median">
        <strong>{formatDays(stats.median)}</strong>
        <em>天</em>
      </span>
      <span className="city-card__label">中位等待 · 统计 n={stats.sampleSize}</span>
      <span className="city-card__range">
        <span>
          <small>
            较快的 25% <i>Q1</i>
          </small>
          <b>{formatDays(stats.q1)} 天</b>
        </span>
        <span>
          <small>
            较慢的 25% <i>Q3</i>
          </small>
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
  const metrics = activeSnapshot.locations[city];
  const stats = metrics.waitStats;
  return (
    <div className="city-detail" aria-labelledby="city-detail-title">
      <div className="city-detail__heading">
        <div>
          <p className="section-kicker">
            <MapPin size={17} weight="bold" /> 当前查看：{LOCATION_NAMES[city]}
          </p>
          <h3 id="city-detail-title">{LOCATION_NAMES[city]}的公开案例</h3>
          <p>
            中位等待 <strong>{formatDays(stats.median)} 天</strong> · 公开案例 {cases.length} 条 ·
            统计样本 n={stats.sampleSize}
          </p>
          <div className="city-detail__counts" aria-label="城市案例状态构成">
            <span>Pending {metrics.pendingCount}</span>
            <span>Clear {metrics.clearCount}</span>
            <span>Reject {metrics.rejectCount}</span>
            <small>Reject 不参与 resolved duration</small>
          </div>
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

function HallRow({
  record,
  rank,
  featured = false,
}: {
  record: CheckCase;
  rank: number;
  featured?: boolean;
}) {
  const treatment = rank <= 3 ? ["gold", "silver", "bronze"][rank - 1] : "standard";
  const title =
    record.displayName ??
    (rank === 1
      ? "年度耐心奖"
      : rank === 2
        ? "长期观察员"
        : rank === 3
          ? "耐心值 MAX"
          : "长期项目候选");
  const subtitle =
    record.subtitle ??
    `${record.city ? LOCATION_NAMES[record.city] : "匿名案例"} · ${statusLabel(record.status)}`;
  return (
    <article className={`hall-row hall-row--${treatment}${featured ? " hall-row--featured" : ""}`}>
      <div className="hall-row__rank">
        {rank <= 3 ? <Medal size={23} weight="fill" aria-hidden="true" /> : "#" + rank}
      </div>
      <div className="hall-row__body">
        <div>
          <strong>{title}</strong>
          <span>{subtitle}</span>
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
