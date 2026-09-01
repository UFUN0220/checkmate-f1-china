"use client";

import {
  ArrowDown,
  ArrowRight,
  CaretLeft,
  CaretRight,
  Crown,
  Info,
  MapPin,
  UsersThree,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { sortByCheckDateDescending } from "../lib/analytics/metrics";
import { DATA_SNAPSHOT } from "../lib/data/snapshot-config";
import { activeDatasetMetadata, activeSnapshot } from "../lib/demo-data";
import { PAGE2_STATIC_SNAPSHOT } from "../lib/data/page2-static-snapshot";
import { formatDays } from "../lib/data/presentation";
import {
  LOCATIONS,
  type CaseStatus,
  type Location,
  type MonthlyF1Trend,
  type Page2Case,
  type Page2Metrics,
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

type DisplayCase = PublicCase;
type AppView = "cities" | "peers";

const VIEW_ITEMS: Array<{ key: AppView; label: string }> = [
  { key: "cities", label: "城市等待" },
  { key: "peers", label: "同学样本" },
];

function readView() {
  const view = new URLSearchParams(window.location.search).get("view");
  return view === "peers" || view === "hall" ? "peers" : "cities";
}

function viewHref(view: AppView) {
  return `/?view=${view}`;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return value.replace(/^2026-/, "").replace("-", ".");
}

function startDate(record: DisplayCase) {
  return record.checkDate;
}

function endDate(record: DisplayCase) {
  return record.completeDate;
}

function locationOf(record: DisplayCase) {
  return record.location;
}

function caseId(record: DisplayCase) {
  return record.publicId;
}

function statusLabel(status: Exclude<CaseStatus, "unknown">) {
  return STATUS_NAMES[status];
}

export function EvidenceAtlas() {
  const [activeView, setActiveView] = useState<AppView>("cities");
  const [selectedCity, setSelectedCity] = useState<Location | null>(null);
  const [cityPage, setCityPage] = useState(1);

  useEffect(() => {
    const sync = () => {
      const params = new URLSearchParams(window.location.search);
      const city = params.get("city");
      const view = readView();
      if (params.get("view") === "hall") {
        params.set("view", "peers");
        params.delete("city");
        window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
      }
      setActiveView(view);
      setSelectedCity(
        view === "cities" && city && LOCATIONS.includes(city as Location)
          ? (city as Location)
          : null,
      );
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  useEffect(() => {
    setCityPage(1);
  }, [selectedCity]);

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
  };

  const clearCity = () => {
    const params = new URLSearchParams(window.location.search);
    params.set("view", "cities");
    params.delete("city");
    window.history.pushState({}, "", `${window.location.pathname}?${params.toString()}`);
    setSelectedCity(null);
  };

  const selectedCases = selectedCity
    ? sortByCheckDateDescending(
        activeSnapshot.cases.filter((item) => item.location === selectedCity),
      )
    : [];
  const cityPageCount = Math.max(1, Math.ceil(selectedCases.length / 10));
  const visibleSelectedCases = selectedCases.slice((cityPage - 1) * 10, cityPage * 10);
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
          {activeView === "cities" ? "STATIC SNAPSHOT" : "PAGE2 STATIC"}
        </span>
      </header>

      <main className="checkmate-main">
        <PageHeader view={activeView} />
        {activeView === "cities" && (
          <CitiesView
            selectedCity={selectedCity}
            selectedCases={visibleSelectedCases}
            totalCaseCount={selectedCases.length}
            cityPage={cityPage}
            cityPageCount={cityPageCount}
            onCityPageChange={setCityPage}
            selectCity={selectCity}
            clearCity={clearCity}
            trends={activeSnapshot.monthlyF1Trends ?? []}
          />
        )}
        {activeView === "peers" && (
          <Page2View snapshot={PAGE2_STATIC_SNAPSHOT} metrics={PAGE2_STATIC_SNAPSHOT.metrics} />
        )}

        <section className="methodology-section" id="methods" aria-labelledby="methods-title">
          <details>
            <summary id="methods-title">
              <Info size={18} weight="bold" /> 数据说明 <ArrowDown size={17} />
            </summary>
            <div className="methodology-grid">
              <p>
                城市等待页使用 {DATA_SNAPSHOT.displayTimestamp} 的 Checkee.info
                静态快照；同学样本使用独立的 page2.xlsx 静态公开产物，名人堂已合并为 Page2
                的展开列表。
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
          {activeView === "cities"
            ? "Checkee.info · 非实时 snapshot"
            : "page2.xlsx · 非实时静态数据"}
        </span>
      </footer>
    </div>
  );
}

function PageHeader({ view }: { view: AppView }) {
  const copy = {
    cities: {
      eyebrow: "F-1 CHECK · CHINA SNAPSHOT",
      title: "2026年度白宫严选中国F1硕博",
      lede: null,
      meta: `截至 ${DATA_SNAPSHOT.displayTimestamp}`,
      badge: activeDatasetMetadata.isMock ? "DEMO DATA" : "REAL PUBLIC DATA",
    },
    peers: {
      eyebrow: "PAGE2 · 独立数据集",
      title: "同学样本",
      lede: null,
      meta: "97 条静态记录 · 2026-09-01",
      badge: "PAGE2 STATIC",
    },
  }[view];
  return (
    <section className="checkmate-page-header" aria-labelledby="page-title">
      <div>
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1 id="page-title">{copy.title}</h1>
        {copy.lede && <p className="checkmate-page-header__lede">{copy.lede}</p>}
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
  totalCaseCount,
  cityPage,
  cityPageCount,
  onCityPageChange,
  selectCity,
  clearCity,
  trends,
}: {
  selectedCity: Location | null;
  selectedCases: PublicCase[];
  totalCaseCount: number;
  cityPage: number;
  cityPageCount: number;
  onCityPageChange: (page: number) => void;
  selectCity: (city: Location) => void;
  clearCity: () => void;
  trends: MonthlyF1Trend[];
}) {
  return (
    <section
      className="checkmate-view-section city-section"
      id="city-status"
      aria-labelledby="city-section-title"
    >
      <div className="city-overview-heading">
        <div>
          <p className="section-kicker">
            <MapPin size={17} weight="bold" /> 五个核心领区
          </p>
          <h2 id="city-section-title">五城等待分布</h2>
        </div>
        <p>点击城市查看最新 Check Date 的案例。</p>
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
      <div className="cities-lower-grid">
        <TrendView trends={trends} />
        <div className="city-detail-column">
          {selectedCity ? (
            <CityDetail
              city={selectedCity}
              cases={selectedCases}
              totalCaseCount={totalCaseCount}
              page={cityPage}
              totalPages={cityPageCount}
              onPageChange={onCityPageChange}
              onClose={clearCity}
            />
          ) : (
            <div className="selection-prompt" role="status">
              <strong>选择一个城市</strong>
              <span>查看该地区最新的 10 条案例</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function TrendView({ trends }: { trends: MonthlyF1Trend[] }) {
  const summary = trends.reduce(
    (result, trend) => {
      result.pendingCount += trend.pendingCount;
      result.clearCount += trend.clearCount;
      result.totalCount += trend.totalCount;
      result.waitingDays += trend.waitingDaysTotal;
      result.waitingCount += trend.averageSampleSize;
      return result;
    },
    { pendingCount: 0, clearCount: 0, totalCount: 0, waitingDays: 0, waitingCount: 0 },
  );
  const average = summary.waitingCount ? summary.waitingDays / summary.waitingCount : null;
  return (
    <article className="trend-card" aria-labelledby="trend-title">
      <div className="section-intro trend-card__intro">
        <div>
          <p className="section-kicker">F-1 · 全国月度统计</p>
          <h2 id="trend-title">月度趋势</h2>
        </div>
        <p>按 Check Date；Reject 不计入。</p>
      </div>
      <div className="trend-table" role="table" aria-label="2026 年 F-1 月度等待统计">
        <div className="trend-table__header" role="row">
          <span>月份</span>
          <span>Pending</span>
          <span>Clear</span>
          <span>Total</span>
          <span>平均等待</span>
        </div>
        {trends.map((trend) => (
          <div className="trend-row" role="row" key={trend.month}>
            <strong>{formatMonth(trend.month)}</strong>
            <span>
              <small>Pending</small>
              {trend.pendingCount}
            </span>
            <span>
              <small>Clear</small>
              {trend.clearCount}
            </span>
            <span>
              <small>Total</small>
              {trend.totalCount}
            </span>
            <span>
              <small>Avg Wait</small>
              {formatDays(trend.averageWaitingDays)} 天
            </span>
          </div>
        ))}
      </div>
      <div className="trend-summary" aria-label="2026 年 1 月至 8 月累计统计">
        <small>2026 Jan–Aug Total</small>
        <strong>
          {summary.totalCount} <span>cases</span>
        </strong>
        <span>Pending {summary.pendingCount}</span>
        <span>Clear {summary.clearCount}</span>
        <span>Avg Wait {formatDays(average)} 天</span>
      </div>
    </article>
  );
}

function formatMonth(month: string) {
  const monthNumber = Number(month.slice(5));
  return `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][monthNumber - 1]} ${month.slice(0, 4)}`;
}

function Page2View({
  snapshot,
  metrics,
}: {
  snapshot: typeof PAGE2_STATIC_SNAPSHOT;
  metrics: Page2Metrics;
}) {
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(snapshot.cases.length / pageSize));
  const visibleCases = snapshot.cases.slice((page - 1) * pageSize, page * pageSize);
  const toggleExpanded = () => {
    setExpanded((value) => !value);
    setPage(1);
  };
  return (
    <section
      className="checkmate-view-section page2-section"
      id="page2-sample"
      aria-labelledby="page2-title"
    >
      <div className="page2-source-line">
        <p className="section-kicker">
          <UsersThree size={17} weight="bold" /> PAGE2 · 独立数据集
        </p>
        <span>真实静态数据 · {snapshot.snapshotDate}</span>
      </div>
      <div className="page2-metrics" aria-label="Page2 核心统计">
        <Page2Metric label="Total Cases" value={metrics.totalCases} detail="合法记录" />
        <Page2Metric label="Approved Cases" value={metrics.approvedCases} detail="Approve" />
        <Page2Metric
          label="Average Waiting Days"
          value={metrics.averageWaitingDays}
          detail="calendar days"
          suffix="天"
        />
      </div>
      <div className="page2-hall-heading">
        <div>
          <p className="section-kicker">
            <Crown size={17} weight="bold" /> PAGE2 CASES
          </p>
          <h2 id="page2-title" className="page2-hall-title">
            名人堂
          </h2>
        </div>
        <button
          type="button"
          className="page2-expand-button"
          onClick={toggleExpanded}
          aria-expanded={expanded}
        >
          {expanded ? "收起" : "展开"} <ArrowRight size={15} />
        </button>
      </div>
      {expanded && (
        <div className="page2-details">
          <p className="page2-details__note">
            全部 {snapshot.cases.length} 条记录 · 按面签日期升序 · 每页 10 条
          </p>
          <div className="page2-case-list" aria-label="Page2 案例列表">
            {visibleCases.map((record) => (
              <Page2CaseRow key={record.id} record={record} />
            ))}
          </div>
          <Page2Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </section>
  );
}

function Page2Metric({
  label,
  value,
  detail,
  suffix = "",
}: {
  label: string;
  value: number | null;
  detail: string;
  suffix?: string;
}) {
  return (
    <article className="page2-metric">
      <small>{label}</small>
      <strong>
        {value ?? "—"}
        <em>{suffix}</em>
      </strong>
      <span>{detail}</span>
    </article>
  );
}

function Page2CaseRow({ record }: { record: Page2Case }) {
  return (
    <article className="page2-case-row">
      <div className="page2-case-row__dates">
        <strong>{formatDate(record.startDate)}</strong>
        <span>
          →{" "}
          {record.endDate
            ? formatDate(record.endDate)
            : `截至 ${formatDate(record.effectiveEndDate)}`}
        </span>
      </div>
      <span className={`page2-status page2-status--${record.status}`}>
        {record.status === "approved"
          ? "Approved"
          : record.status === "pending"
            ? "Pending"
            : "Other"}
      </span>
      <strong className="page2-case-row__days">
        {record.waitingDays}
        <small>天</small>
      </strong>
      <span className="page2-case-row__info">
        {[record.degree, record.major, record.mergedInfo].filter(Boolean).join(" · ") || "—"}
      </span>
    </article>
  );
}

function Page2Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav className="page2-pagination" aria-label="Page2 案例分页">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
      >
        上一页
      </button>
      <span>
        {page} / {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
      >
        下一页
      </button>
    </nav>
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
      </span>
      <span className="city-card__stats">
        <span>
          <small>Q1</small>
          <b>{formatDays(stats.q1)}</b>
          <em>天</em>
        </span>
        <span className="is-median">
          <small>Median</small>
          <b>{formatDays(stats.median)}</b>
          <em>天</em>
        </span>
        <span>
          <small>Q3</small>
          <b>{formatDays(stats.q3)}</b>
          <em>天</em>
        </span>
      </span>
      <span className="city-card__action" aria-hidden="true">
        {selected ? "已选择" : "查看"} <ArrowRight size={16} />
      </span>
    </button>
  );
}

function CityDetail({
  city,
  cases,
  totalCaseCount,
  page,
  totalPages,
  onPageChange,
  onClose,
}: {
  city: Location;
  cases: PublicCase[];
  totalCaseCount: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onClose: () => void;
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
          <h3 id="city-detail-title">{LOCATION_NAMES[city]} · 最新案例</h3>
          <p>
            中位 {formatDays(stats.median)} 天 · {totalCaseCount} 条公开案例 · 第 {page} /{" "}
            {totalPages} 页
          </p>
          <div className="city-detail__counts" aria-label="城市案例状态构成">
            <span>Pending {metrics.pendingCount}</span>
            <span>Clear {metrics.clearCount}</span>
            <span>Reject {metrics.rejectCount}</span>
            <small>Reject 不参与 resolved duration</small>
          </div>
        </div>
        <div className="city-detail__actions">
          <button className="quiet-button" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
      <CaseList records={cases} emptyLabel="当前样本不足" />
      <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav className="case-pagination" aria-label="案例分页">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        aria-label="上一页"
      >
        <CaretLeft size={15} />
      </button>
      <span>
        {page} <i>/</i> {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        aria-label="下一页"
      >
        <CaretRight size={15} />
      </button>
    </nav>
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
      <div className="case-card__duration">
        <strong>{formatDays(record.durationDays)}</strong>
        <span>天</span>
      </div>
      <div className="case-card__meta">
        <span>{city ? LOCATION_NAMES[city] : "匿名样本"}</span>
        <span>{record.majorCategory}</span>
      </div>
    </article>
  );
}
