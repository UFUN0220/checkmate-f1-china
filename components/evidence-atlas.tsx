"use client";

import {
  ArrowDown,
  ArrowRight,
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
  type MonthlyF1Trend,
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
type AppView = "cities" | "trend" | "peers" | "hall";

const VIEW_ITEMS: Array<{ key: AppView; label: string }> = [
  { key: "cities", label: "城市等待" },
  { key: "trend", label: "趋势分析" },
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

export function EvidenceAtlas() {
  const [activeView, setActiveView] = useState<AppView>("cities");
  const [selectedCity, setSelectedCity] = useState<Location | null>(null);

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
          {activeView === "cities" || activeView === "trend" ? "STATIC SNAPSHOT" : "DEMO DATA"}
        </span>
      </header>

      <main className="checkmate-main">
        <PageHeader view={activeView} />
        {activeView === "cities" && (
          <CitiesView
            selectedCity={selectedCity}
            selectedCases={selectedCases}
            selectCity={selectCity}
            clearCity={clearCity}
          />
        )}
        {activeView === "trend" && <TrendView trends={activeSnapshot.monthlyF1Trends ?? []} />}
        {activeView === "peers" && <PeerView dataset={peerDataset} stats={peerStats} />}
        {activeView === "hall" && <HallView dataset={hallDataset} records={hallOfFame} />}

        <section className="methodology-section" id="methods" aria-labelledby="methods-title">
          <details>
            <summary id="methods-title">
              <Info size={18} weight="bold" /> 数据说明 <ArrowDown size={17} />
            </summary>
            <div className="methodology-grid">
              <p>
                城市等待与趋势页使用 {DATA_SNAPSHOT.displayTimestamp} 的 Checkee.info
                静态快照；同学样本与名人堂使用独立数据入口。
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
          {activeView === "cities" || activeView === "trend"
            ? "Checkee.info · 非实时 snapshot"
            : "开发 mock · 非实时"}
        </span>
      </footer>
    </div>
  );
}

function PageHeader({ view }: { view: AppView }) {
  const copy = {
    cities: {
      eyebrow: "F-1 Check · Checkee 公开快照",
      title: "中国 F-1 Check 等待情况",
      lede: null,
      meta: `截至 ${DATA_SNAPSHOT.displayTimestamp}`,
      badge: activeDatasetMetadata.isMock ? "DEMO DATA" : "REAL PUBLIC DATA",
    },
    trend: {
      eyebrow: "F-1 Check · 月度快照",
      title: "趋势分析",
      lede: "按 Check Date 归属月份，看 Pending、Clear 与平均等待天数。",
      meta: `${DATA_SNAPSHOT.coverageLabel} · 不区分城市`,
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
  selectCity,
  clearCity,
}: {
  selectedCity: Location | null;
  selectedCases: PublicCase[];
  selectCity: (city: Location) => void;
  clearCity: () => void;
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
          <CityDetail city={selectedCity} cases={selectedCases} onClose={clearCity} />
        )}
      </section>
    </>
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
    <section className="checkmate-view-section trend-section" aria-labelledby="trend-title">
      <div className="section-intro">
        <div>
          <p className="section-kicker">F-1 · 全国月度统计</p>
          <h2 id="trend-title">今年到目前为止，整体怎么走？</h2>
        </div>
        <p>只看 F-1；按 Check Date 归属月份。Reject 不进入此指标。</p>
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
    </section>
  );
}

function formatMonth(month: string) {
  const monthNumber = Number(month.slice(5));
  return `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][monthNumber - 1]} ${month.slice(0, 4)}`;
}

function PeerView({
  dataset,
  stats,
}: {
  dataset: ReturnType<typeof loadPeerDataset>;
  stats: WaitStats;
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
        records={dataset.cases.slice(0, 5)}
        emptyLabel="暂无同学样本。"
        mockLabel={dataset.metadata.isMock ? "DEMO DATA" : undefined}
      />
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
  onClose,
}: {
  city: Location;
  cases: PublicCase[];
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
          {"majorCategory" in record
            ? record.majorCategory
            : "visaEntry" in record
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
