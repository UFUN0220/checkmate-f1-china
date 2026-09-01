"use client";

import { ArrowDown, ArrowRight, CaretLeft, CaretRight, Info, MapPin } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { sortByCheckDateDescending } from "../lib/analytics/metrics";
import { DATA_SNAPSHOT } from "../lib/data/snapshot-config";
import { activeDatasetMetadata, activeSnapshot } from "../lib/demo-data";
import { loadPage2Snapshot } from "../lib/data/loaders";
import { formatDays } from "../lib/data/presentation";
import {
  LOCATIONS,
  type CaseStatus,
  type Location,
  type MonthlyF1Trend,
  type Page2Case,
  type Page2Metrics,
  type Page2Snapshot,
  type PublicCase,
  type PublicSnapshot,
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
export type AppView = "cities" | "peers";

const VIEW_ITEMS: Array<{ key: AppView; label: string }> = [
  { key: "cities", label: "白宫严选" },
  { key: "peers", label: "名人堂" },
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

function caseId(record: DisplayCase) {
  return record.publicId;
}

function statusLabel(status: Exclude<CaseStatus, "unknown">) {
  return STATUS_NAMES[status];
}

export function EvidenceAtlas() {
  const [activeView, setActiveView] = useState<AppView>("cities");
  const [selectedCity, setSelectedCity] = useState<Location | null>(null);

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

  const isStatic = !activeDatasetMetadata.isMock;

  return (
    <div className="checkmate-standalone">
      <header className="checkmate-header">
        <a
          className="checkmate-brand"
          href={viewHref("cities")}
          onClick={(event) => {
            event.preventDefault();
            navigateView("cities");
          }}
          aria-label="回到白宫严选"
        >
          <span className="checkmate-brand__mark" aria-hidden="true">
            C
          </span>
          <span>Checkmate</span>
        </a>
        <CheckmateNavigation activeView={activeView} onNavigate={navigateView} />
      </header>

      <main className="checkmate-main checkmate-feature">
        {activeView === "cities" && (
          <WhiteHouseSelection
            data={activeSnapshot}
            selectedCity={selectedCity}
            onSelectedCityChange={(city) => (city ? selectCity(city) : clearCity())}
          />
        )}
        {activeView === "peers" && <HallOfFame />}

        <section className="methodology-section" id="methods" aria-labelledby="methods-title">
          <details>
            <summary id="methods-title">
              <Info size={18} weight="bold" /> 数据说明 <ArrowDown size={17} />
            </summary>
            <div className="methodology-grid">
              <p>
                公开样本统计，仅供参考，不代表官方处理时间或个人结果。学校、备注和联系方式不在公开案例中。
              </p>
            </div>
          </details>
        </section>
      </main>

      <footer className="checkmate-footer">
        <span>
          Checkmate · {isStatic ? "公开样本" : "演示数据"} · {DATA_SNAPSHOT.label}
        </span>
        <span>公开样本统计，仅供参考，不代表官方处理时间或个人结果。</span>
      </footer>
    </div>
  );
}

export function CheckmateNavigation({
  activeView,
  onNavigate,
}: {
  activeView?: AppView;
  onNavigate?: (view: AppView) => void;
}) {
  return (
    <nav className="checkmate-nav" aria-label="页面导航">
      {VIEW_ITEMS.map((item) => (
        <a
          key={item.key}
          href={viewHref(item.key)}
          className={activeView === item.key ? "is-active" : undefined}
          aria-current={activeView === item.key ? "page" : undefined}
          onClick={(event) => {
            if (!onNavigate) return;
            event.preventDefault();
            onNavigate(item.key);
          }}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}

export interface WhiteHouseSelectionProps {
  data?: PublicSnapshot;
  initialCity?: Location | null;
  selectedCity?: Location | null;
  onSelectedCityChange?: (city: Location | null) => void;
}

export function WhiteHouseSelection({
  data = activeSnapshot,
  initialCity = null,
  selectedCity: controlledCity,
  onSelectedCityChange,
}: WhiteHouseSelectionProps) {
  const [internalCity, setInternalCity] = useState<Location | null>(initialCity);
  const [cityPage, setCityPage] = useState(1);
  const isControlled = controlledCity !== undefined;
  const selectedCity = isControlled ? controlledCity : internalCity;
  const selectCity = (city: Location) => {
    if (!isControlled) setInternalCity(city);
    onSelectedCityChange?.(city);
  };
  const clearCity = () => {
    if (!isControlled) setInternalCity(null);
    onSelectedCityChange?.(null);
  };
  const selectedCases = selectedCity
    ? sortByCheckDateDescending(data.cases.filter((item) => item.location === selectedCity))
    : [];
  const cityPageCount = Math.max(1, Math.ceil(selectedCases.length / 10));
  const visibleSelectedCases = selectedCases.slice((cityPage - 1) * 10, cityPage * 10);

  useEffect(() => {
    setCityPage(1);
  }, [selectedCity]);

  return (
    <>
      <PageHeader view="cities" />
      <CitiesView
        snapshot={data}
        selectedCity={selectedCity}
        selectedCases={visibleSelectedCases}
        totalCaseCount={selectedCases.length}
        cityPage={cityPage}
        cityPageCount={cityPageCount}
        onCityPageChange={setCityPage}
        selectCity={selectCity}
        clearCity={clearCity}
        trends={data.monthlyF1Trends ?? []}
      />
    </>
  );
}

export interface HallOfFameProps {
  data?: Page2Snapshot;
}

export function HallOfFame({ data = loadPage2Snapshot() }: HallOfFameProps) {
  return (
    <>
      <PageHeader view="peers" page2CaseCount={data.metrics.totalCases} />
      <Page2View snapshot={data} metrics={data.metrics} />
    </>
  );
}

function PageHeader({ view, page2CaseCount = 0 }: { view: AppView; page2CaseCount?: number }) {
  const copy = {
    cities: {
      title: "2026年度白宫严选中国F1硕博",
      meta: `截至 ${DATA_SNAPSHOT.displayTimestamp}`,
    },
    peers: {
      title: "名人堂",
      meta: `${page2CaseCount} 个案例 · 截至 2026-09-01`,
    },
  }[view];
  return (
    <section
      className={`checkmate-page-header checkmate-page-header--${view}`}
      aria-labelledby="page-title"
    >
      <div>
        <h1 id="page-title">{copy.title}</h1>
      </div>
      <div className="checkmate-page-header__meta">
        <strong>{copy.meta}</strong>
      </div>
    </section>
  );
}

function CitiesView({
  snapshot,
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
  snapshot: PublicSnapshot;
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
      aria-label="白宫严选城市数据"
    >
      <div className="city-grid" aria-label="五个城市的等待时长统计">
        {LOCATIONS.map((city) => (
          <CityCard
            key={city}
            city={city}
            stats={snapshot.locations[city].waitStats}
            sampleCount={snapshot.locations[city].sampleCount}
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
              snapshot={snapshot}
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
    <article className="trend-card" aria-label="月度趋势">
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

function Page2View({ snapshot, metrics }: { snapshot: Page2Snapshot; metrics: Page2Metrics }) {
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
    <section className="checkmate-view-section page2-section" id="page2-sample" aria-label="名人堂">
      <div className="page2-metrics" aria-label="名人堂核心统计">
        <article className="page2-metric page2-metric--counts">
          <div>
            <small>案例</small>
            <strong>{metrics.totalCases}</strong>
          </div>
          <div>
            <small>Approve</small>
            <strong>{metrics.approvedCases}</strong>
          </div>
        </article>
        <article className="page2-metric page2-metric--distribution">
          <small>Waiting distribution</small>
          <div className="page2-quartiles">
            <Page2Quartile label="Q1" value={metrics.waitingStats.q1} />
            <Page2Quartile label="Median" value={metrics.waitingStats.median} featured />
            <Page2Quartile label="Q3" value={metrics.waitingStats.q3} />
          </div>
        </article>
      </div>
      <div className="page2-hall-heading">
        <button
          type="button"
          className="page2-expand-button"
          onClick={toggleExpanded}
          aria-expanded={expanded}
        >
          {expanded ? "收起" : "展开案例"} <ArrowRight size={15} />
        </button>
      </div>
      {expanded && (
        <div className="page2-details">
          <p className="page2-details__note">
            全部 {snapshot.cases.length} 条记录 · 按面签日期升序 · 每页 10 条
          </p>
          <div className="page2-case-list" aria-label="名人堂案例列表">
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

function Page2Quartile({
  label,
  value,
  featured = false,
}: {
  label: string;
  value: number | null;
  featured?: boolean;
}) {
  return (
    <div className={`page2-quartile${featured ? " is-featured" : ""}`}>
      <small>{label}</small>
      <strong>
        {value ?? "—"}
        <em>天</em>
      </strong>
    </div>
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
    <nav className="page2-pagination" aria-label="名人堂案例分页">
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
  snapshot,
  cases,
  totalCaseCount,
  page,
  totalPages,
  onPageChange,
  onClose,
}: {
  city: Location;
  snapshot: PublicSnapshot;
  cases: PublicCase[];
  totalCaseCount: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onClose: () => void;
}) {
  const metrics = snapshot.locations[city];
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
        <span>{record.majorCategory}</span>
      </div>
    </article>
  );
}
