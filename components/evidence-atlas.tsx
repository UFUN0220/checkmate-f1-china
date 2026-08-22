"use client";

import {
  ArrowLeft,
  ArrowRight,
  CaretRight,
  ChartLineUp,
  FileText,
  GlobeHemisphereWest,
  Info,
  MapPin,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { activeDatasetMode, activeSnapshot } from "../lib/demo-data";
import { calculateMetrics } from "../lib/analytics/metrics";
import {
  filterPublicCases,
  filtersFromSearchParams,
  filtersToSearchParams,
  type CaseFilters,
} from "../lib/data/query";
import { LOCATIONS, type CaseStatus, type Location, type VisaEntry } from "../lib/data/models";

type AtlasView = "overview" | "location" | "cases";
type FilterValue = "all" | string;

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

const ENTRY_NAMES: Record<Exclude<VisaEntry, "unknown">, string> = {
  initial: "Initial",
  renewal: "Renewal",
};

type AtlasState = {
  view: AtlasView;
  location: FilterValue;
  status: FilterValue;
  month: FilterValue;
  degree: FilterValue;
  majorGroup: FilterValue;
  entry: FilterValue;
};

const defaultState: AtlasState = {
  view: "overview",
  location: "all",
  status: "all",
  month: "all",
  degree: "all",
  majorGroup: "all",
  entry: "all",
};

function filterValue(values: string[]) {
  return values.length ? values.join(",") : "all";
}

function valuesFromFilter(value: FilterValue) {
  return value === "all" ? [] : value.split(",").filter(Boolean);
}

function filtersFromState(state: AtlasState): CaseFilters {
  return {
    locations: valuesFromFilter(state.location) as Location[],
    statuses: valuesFromFilter(state.status) as CaseFilters["statuses"],
    months: valuesFromFilter(state.month),
    degrees: valuesFromFilter(state.degree),
    majorGroups: valuesFromFilter(state.majorGroup),
    entries: valuesFromFilter(state.entry) as VisaEntry[],
  };
}

function readUrlState(): AtlasState {
  if (typeof window === "undefined") return defaultState;
  const params = new URLSearchParams(window.location.search);
  const filters = filtersFromSearchParams(params);
  const view = params.get("view");
  return {
    view: view === "location" || view === "cases" ? view : "overview",
    location: filterValue(filters.locations),
    status: filterValue(filters.statuses),
    month: filterValue(filters.months),
    degree: filterValue(filters.degrees),
    majorGroup: filterValue(filters.majorGroups),
    entry: filterValue(filters.entries),
  };
}

function countLabel(value: number | null) {
  return value === null ? "—" : value;
}

function metricLabel(value: number | null, suffix = "天") {
  return value === null ? "—" : `${value}${suffix}`;
}

function visibleMetric(
  sampleBand: "insufficient" | "small" | "standard",
  value: number | null,
  suffix = "天",
) {
  return sampleBand === "insufficient" ? "—" : metricLabel(value, suffix);
}

export function EvidenceAtlas() {
  const [state, setState] = useState<AtlasState>(defaultState);

  useEffect(() => {
    const sync = () => setState(readUrlState());
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const updateUrl = (next: Partial<AtlasState>) => {
    const nextState = { ...state, ...next };
    const params = new URLSearchParams();
    const filters = filtersToSearchParams(filtersFromState(nextState));
    filters.forEach((value, key) => params.set(key, value));
    if (nextState.view !== "overview") params.set("view", nextState.view);
    const query = params.toString();
    window.history.pushState({}, "", query ? `/?${query}` : "/");
    setState(nextState);
  };

  const openLocation = (location: Location) => updateUrl({ view: "location", location });
  const openCases = (location = state.location) => updateUrl({ view: "cases", location });
  const goBack = () =>
    state.view === "cases"
      ? updateUrl({ view: state.location !== "all" ? "location" : "overview" })
      : updateUrl({ ...defaultState });

  const selectedLocations = valuesFromFilter(state.location) as Location[];
  const singleLocation = selectedLocations.length === 1 ? selectedLocations[0] : null;
  const snapshot = activeSnapshot;
  const isStatic = activeDatasetMode === "checkee-static";

  return (
    <div className="atlas-app">
      <header className="atlas-header">
        <div className="atlas-header__brand">
          <span className="atlas-header__mark" aria-hidden="true">
            <GlobeHemisphereWest size={22} weight="regular" />
          </span>
          <span>CheckMate F1 China</span>
          <span className="atlas-header__divider" aria-hidden="true" />
          <span className="atlas-header__descriptor">
            {isStatic ? "STATIC SNAPSHOT" : "DEMO DATA"}
          </span>
        </div>
        <div className="atlas-header__meta">
          <span>覆盖至：{snapshot.manifest.coverageThrough}</span>
          <a href="#methods">关于口径</a>
        </div>
      </header>

      <main className="atlas-layout">
        <aside className="atlas-sidebar">
          <div className="atlas-sidebar__intro">
            <p className="eyebrow">
              F-1 Checkee 数据观察 · {isStatic ? "STATIC SNAPSHOT" : "DEMO_DATA"}
            </p>
            <h1>证据图谱</h1>
            <p>
              {isStatic
                ? "数据来源：Checkee.info。当前为 2026 年 1 月至 8 月手工保存页面生成的静态快照，不是实时数据。"
                : "这是来源无关的数据产品演示。当前页面使用合成 DEMO_DATA，不代表真实 Checkee 样本。"}
            </p>
          </div>

          <div className="atlas-sidebar__summary" aria-label="数据快照概览">
            <span>{isStatic ? "静态快照 · 2026 年 1–8 月" : "演示快照 · 2026 年以来"}</span>
            <div className="atlas-summary-values atlas-summary-values--four">
              <SummaryValue label="总样本" value={snapshot.national.sampleCount} />
              <SummaryValue label="Pending" value={snapshot.national.pendingCount} />
              <SummaryValue label="Clear" value={snapshot.national.clearCount} />
              <SummaryValue label="Reject" value={snapshot.national.rejectCount} />
            </div>
          </div>

          <div className="atlas-sidebar__note">
            <div className="section-kicker">
              <Info size={16} weight="bold" />
              <span>来源状态</span>
            </div>
            <p>
              {isStatic
                ? "Checkee 为用户自报数据，本站与 Checkee.info 不存在隶属关系；当前快照非实时。"
                : "Checkee 访问状态为 CHECKEE_ACCESS_BLOCKED；真实来源 Adapter 保持 disabled，本页面仅用于离线开发和截图。"}
            </p>
            <a href="#methods">
              查看数据口径 <ArrowRight size={14} />
            </a>
          </div>
        </aside>

        <section className="atlas-content" aria-label="证据图谱内容">
          <nav className="atlas-breadcrumbs" aria-label="页面层级">
            <button
              className={state.view === "overview" ? "is-current" : ""}
              onClick={() => updateUrl(defaultState)}
            >
              全国概览
            </button>
            <CaretRight size={14} aria-hidden="true" />
            <button
              className={state.view === "location" ? "is-current" : ""}
              disabled={!singleLocation}
              onClick={() => updateUrl({ view: "location" })}
            >
              地点指标
            </button>
            <CaretRight size={14} aria-hidden="true" />
            <button
              className={state.view === "cases" ? "is-current" : ""}
              onClick={() => openCases()}
            >
              标准化案例
            </button>
          </nav>

          {state.view !== "overview" && (
            <button className="back-link" onClick={goBack}>
              <ArrowLeft size={16} /> 返回上一级
            </button>
          )}

          <div className="source-banner" role="status">
            <Info size={17} />
            <span>
              {isStatic ? (
                <>
                  <strong>数据来源：Checkee.info</strong>；当前为 2026 年 1 月至 8
                  月手工保存页面生成的静态快照，不是实时数据。Checkee 为用户自报数据，本站与
                  Checkee.info 不存在隶属关系。
                </>
              ) : (
                <>
                  当前为 <strong>DEMO_DATA</strong>，真实 Checkee 数据尚未接入。
                </>
              )}
            </span>
          </div>

          {state.view === "overview" && (
            <OverviewPanel onOpenCases={() => openCases()} onOpenLocation={openLocation} />
          )}
          {state.view === "location" && singleLocation && (
            <LocationPanel
              location={singleLocation}
              onOpenCases={() => openCases(singleLocation)}
            />
          )}
          {state.view === "cases" && (
            <CasesPanel
              state={state}
              onChange={updateUrl}
              onClear={() => updateUrl({ ...defaultState, view: "cases" })}
            />
          )}
        </section>
      </main>

      <footer id="methods" className="atlas-footer">
        <span>
          {isStatic
            ? "数据来源：Checkee.info · 2026 年 1–8 月手工保存页面静态快照"
            : "数据来源：DEMO_DATA（合成开发数据）"}
        </span>
        <span>Checkee 为用户自报数据 · 当前快照不是实时数据</span>
        <span>不代表总体概率，不提供个人出签时间预测。</span>
      </footer>
    </div>
  );
}

function SummaryValue({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <strong>{value}</strong>
      <small>{label}</small>
    </div>
  );
}

function OverviewPanel({
  onOpenCases,
  onOpenLocation,
}: {
  onOpenCases: () => void;
  onOpenLocation: (location: Location) => void;
}) {
  return (
    <>
      <div className="atlas-overview-head">
        <div>
          <p className="eyebrow">
            全国概览 · {activeDatasetMode === "checkee-static" ? "STATIC SNAPSHOT" : "DEMO_DATA"}
          </p>
          <h2>从样本范围开始，逐层了解数据。</h2>
          <p className="atlas-lede">
            先看全国状态构成和五个地点的静态分布，再进入地点指标或标准化案例列表。所有数值来自同一份快照。
          </p>
        </div>
        <div className="atlas-actions">
          <button className="button button--primary" onClick={onOpenCases}>
            查看标准化案例 <ArrowRight size={17} />
          </button>
          <a className="button button--secondary" href="#methods">
            了解数据口径 <ArrowRight size={17} />
          </a>
        </div>
      </div>

      <section className="atlas-trajectory" aria-labelledby="trajectory-title">
        <div className="atlas-trajectory__header">
          <div>
            <p className="section-kicker" id="trajectory-title">
              <MapPin size={16} weight="bold" /> Checkee F-1 公开样本分布
            </p>
            <p className="muted">
              按申请地点 · 共 {activeSnapshot.national.sampleCount} 条公开案例
            </p>
          </div>
          <span className="selection-readout">
            来源：{activeDatasetMode === "checkee-static" ? "Checkee.info" : "DEMO_DATA"}
          </span>
        </div>
        <div className="atlas-map-strip">
          <div className="atlas-map-strip__background" aria-hidden="true" />
          <div className="atlas-route" aria-label="五个地点的演示样本数量">
            <span className="atlas-route__origin">
              <span className="atlas-route__origin-label">全国</span>
              <strong>{activeSnapshot.national.sampleCount}</strong>
            </span>
            <span className="atlas-route__line" aria-hidden="true" />
            {LOCATIONS.map((location) => (
              <button
                key={location}
                className={`atlas-node atlas-node--${location}`}
                onClick={() => onOpenLocation(location)}
              >
                <span className="atlas-node__dot" aria-hidden="true" />
                <span>{LOCATION_NAMES[location]}</span>
                <strong>{activeSnapshot.locations[location].sampleCount}</strong>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="atlas-table-section" aria-labelledby="location-table-title">
        <div className="section-heading-row">
          <div>
            <p className="section-kicker" id="location-table-title">
              <FileText size={16} weight="bold" /> 地点指标
            </p>
            <p className="muted">选择地点，查看 Pending/Clear/Reject 和等待时间。</p>
          </div>
          <span className="data-status">
            {activeDatasetMode === "checkee-static" ? "STATIC" : "DEMO_DATA"}
          </span>
        </div>
        <div className="atlas-table-wrap">
          <table className="atlas-table">
            <thead>
              <tr>
                <th scope="col">地点</th>
                <th scope="col">样本</th>
                <th scope="col">占比</th>
                <th scope="col">Pending</th>
                <th scope="col">Clear</th>
                <th scope="col">进入</th>
              </tr>
            </thead>
            <tbody>
              {LOCATIONS.map((location) => {
                const metrics = activeSnapshot.locations[location];
                return (
                  <tr key={location}>
                    <th scope="row">
                      <button className="table-location" onClick={() => onOpenLocation(location)}>
                        <span className="table-location__dot" aria-hidden="true" />
                        {LOCATION_NAMES[location]}
                      </button>
                    </th>
                    <td>{metrics.sampleCount}</td>
                    <td>{(metrics.sampleShare * 100).toFixed(1)}%</td>
                    <td>{metrics.pendingCount}</td>
                    <td>{metrics.clearCount}</td>
                    <td>
                      <button
                        className="table-enter"
                        onClick={() => onOpenLocation(location)}
                        aria-label={`查看${LOCATION_NAMES[location]}地点指标`}
                      >
                        <CaretRight size={17} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="table-footnote">
          <Info size={14} /> 地点占比是公开快照的样本分布，不是领馆比例或风险。
        </p>
      </section>

      <TrendSection />
    </>
  );
}

function TrendSection() {
  const max = Math.max(...activeSnapshot.cohorts.map((cohort) => cohort.sampleCount));
  return (
    <section className="trend-section" aria-labelledby="trend-title">
      <div className="section-heading-row">
        <div>
          <p className="section-kicker" id="trend-title">
            <ChartLineUp size={16} weight="bold" /> 月度 cohort 趋势
          </p>
          <p className="muted">按 Check 月份分组；当前月标记为尚未完整。</p>
        </div>
        <span className="data-status">2026-01 → 2026-08</span>
      </div>
      <div className="trend-list">
        {activeSnapshot.cohorts.map((cohort) => (
          <div className="trend-row" key={cohort.month}>
            <span>
              {cohort.month}
              {cohort.partial ? " · 尚未完整" : ""}
            </span>
            <div className="trend-row__track">
              <span style={{ width: `${max ? (cohort.sampleCount / max) * 100 : 0}%` }} />
            </div>
            <strong>{cohort.sampleCount}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function LocationPanel({ location, onOpenCases }: { location: Location; onOpenCases: () => void }) {
  const metrics = activeSnapshot.locations[location];
  return (
    <section className="detail-panel" aria-labelledby="location-title">
      <div className="detail-panel__heading">
        <div>
          <p className="eyebrow">
            地点指标 · {LOCATION_NAMES[location]} ·{" "}
            {activeDatasetMode === "checkee-static" ? "STATIC SNAPSHOT" : "DEMO_DATA"}
          </p>
          <h2 id="location-title">{LOCATION_NAMES[location]} 的公开样本</h2>
          <p className="atlas-lede">
            本页严格区分 Pending 等待年龄与 Clear 已完成时长；小样本只做描述性展示。
          </p>
        </div>
        <button className="button button--primary" onClick={onOpenCases}>
          查看标准化案例 <ArrowRight size={17} />
        </button>
      </div>
      <div className="detail-stats">
        <Stat
          label="样本数"
          value={countLabel(metrics.sampleCount)}
          note={`${(metrics.sampleShare * 100).toFixed(1)}% of snapshot`}
        />
        <Stat
          label="Pending"
          value={countLabel(metrics.pendingCount)}
          note={`年龄中位数 ${visibleMetric(metrics.sampleBand, metrics.pendingAgeMedianDays)}`}
        />
        <Stat
          label="Clear"
          value={countLabel(metrics.clearCount)}
          note={`完成时长中位数 ${visibleMetric(metrics.sampleBand, metrics.resolvedDurationMedianDays)}`}
        />
      </div>
      <div className="detail-stats detail-stats--secondary">
        <Stat
          label="Pending P75"
          value={visibleMetric(metrics.sampleBand, metrics.pendingAgeP75Days)}
          note={`最长 ${visibleMetric(metrics.sampleBand, metrics.pendingAgeMaxDays)}`}
        />
        <Stat
          label="Clear P75"
          value={visibleMetric(metrics.sampleBand, metrics.resolvedDurationP75Days)}
          note={`有效完成样本 n=${metrics.resolvedSampleCount}`}
        />
        <Stat
          label="Check 日期"
          value={
            metrics.checkDateRange
              ? `${metrics.checkDateRange.start.slice(5)} → ${metrics.checkDateRange.end.slice(5)}`
              : "—"
          }
          note="来源快照字段"
        />
      </div>
      <div className="detail-empty">
        <Info size={22} />
        <div>
          <strong>快照状态说明</strong>
          <p>
            {metrics.sampleBand === "insufficient"
              ? "当前地点样本少于 5 条，因此隐藏等待和完成时长的描述性分位数；仅保留样本数和日期范围。"
              : metrics.sampleBand === "small"
                ? "当前地点为小样本（5–9 条），指标仅作描述性参考，不作地点间结论。"
                : "当前地点达到标准描述性样本量。"}
            以上指标由离线快照驱动。Pending 使用来源页面的静态 Waiting
            Day(s)，不会随页面打开自动增加；Clear 时长使用 Check Date 与 Complete Date 的日期差。
          </p>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, note }: { label: string; value: string | number; note: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function CasesPanel({
  state,
  onChange,
  onClear,
}: {
  state: AtlasState;
  onChange: (next: Partial<AtlasState>) => void;
  onClear: () => void;
}) {
  const majorGroups = [...new Set(activeSnapshot.cases.map((item) => item.majorGroup))].sort();
  const degrees = [...new Set(activeSnapshot.cases.map((item) => item.degree))].sort();
  const months = activeSnapshot.cohorts.map((cohort) => cohort.month);
  const filteredCases = useMemo(
    () => filterPublicCases(activeSnapshot.cases, filtersFromState(state)),
    [state],
  );
  const filteredMetrics = calculateMetrics(filteredCases);
  const hasFilters = [
    state.location,
    state.status,
    state.month,
    state.degree,
    state.majorGroup,
    state.entry,
  ].some((value) => value !== "all");
  const selectedLocationValues = valuesFromFilter(state.location);
  const locationLabel =
    selectedLocationValues.length === 1
      ? LOCATION_NAMES[selectedLocationValues[0] as Location]
      : selectedLocationValues.length > 1
        ? "多地点"
        : "全国";
  const changeMulti = (
    key: keyof Pick<
      AtlasState,
      "location" | "status" | "month" | "degree" | "majorGroup" | "entry"
    >,
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const values = [...event.target.selectedOptions].map((option) => option.value);
    onChange({ [key]: values.length ? values.join(",") : "all" });
  };
  return (
    <section className="detail-panel" aria-labelledby="cases-title">
      <div className="detail-panel__heading">
        <div>
          <p className="eyebrow">
            标准化案例 · {locationLabel} ·{" "}
            {activeDatasetMode === "checkee-static" ? "STATIC SNAPSHOT" : "DEMO_DATA"}
          </p>
          <h2 id="cases-title">Checkee F-1 标准化案例</h2>
          <p className="atlas-lede">
            仅展示 PublicCase 允许字段。同一字段多选为 OR，不同字段之间为
            AND；当前结果只作描述性展示。
          </p>
        </div>
        <span className="data-status">
          {filteredCases.length} 条结果 · P{filteredMetrics.pendingCount} / C
          {filteredMetrics.clearCount} / R{filteredMetrics.rejectCount}
        </span>
      </div>
      <div className="filter-bar" aria-label="案例筛选">
        <MultiSelectField
          label="地点"
          value={state.location}
          options={LOCATIONS.map((location) => [location, LOCATION_NAMES[location]])}
          onChange={(event) => changeMulti("location", event)}
        />
        <MultiSelectField
          label="状态"
          value={state.status}
          options={Object.entries(STATUS_NAMES)}
          onChange={(event) => changeMulti("status", event)}
        />
        <MultiSelectField
          label="Check 月份"
          value={state.month}
          options={months.map((month) => [month, month])}
          onChange={(event) => changeMulti("month", event)}
        />
        <MultiSelectField
          label="Degree"
          value={state.degree}
          options={degrees.map((degree) => [degree, degree])}
          onChange={(event) => changeMulti("degree", event)}
        />
        <MultiSelectField
          label="Major Group"
          value={state.majorGroup}
          options={majorGroups.map((majorGroup) => [majorGroup, majorGroup])}
          onChange={(event) => changeMulti("majorGroup", event)}
        />
        <MultiSelectField
          label="签证入口"
          value={state.entry}
          options={[
            ["initial", "Initial"],
            ["renewal", "Renewal"],
            ["unknown", "Unknown"],
          ]}
          onChange={(event) => changeMulti("entry", event)}
        />
        {hasFilters && (
          <button className="filter-clear" onClick={onClear}>
            清除筛选
          </button>
        )}
      </div>
      {filteredCases.length === 0 ? (
        <div className="detail-empty detail-empty--large">
          <FileText size={28} />
          <div>
            <strong>没有匹配的结果</strong>
            <p>清除筛选后查看全部静态案例；不会用合成数据补齐空结果。</p>
          </div>
        </div>
      ) : (
        <div className="case-list" aria-label="标准化案例列表">
          {filteredCases.map((item) => (
            <article className="case-row" key={item.publicId}>
              <div>
                <strong>{LOCATION_NAMES[item.location]}</strong>
                <span>
                  {item.majorGroup} · {item.degree} ·{" "}
                  {item.visaEntry === "unknown" ? "Unknown" : ENTRY_NAMES[item.visaEntry]}
                </span>
              </div>
              <div>
                <span className={`status-chip status-chip--${item.status}`}>
                  {STATUS_NAMES[item.status]}
                </span>
                <span>Check {item.checkDate}</span>
              </div>
              <div>
                <span>
                  {item.status === "pending"
                    ? `等待 ${item.pendingAgeDays} 天`
                    : item.status === "clear"
                      ? `完成 ${item.resolvedDurationDays ?? "—"} 天`
                      : "无完成时长"}
                </span>
                <small>
                  {item.sourceMonth} ·{" "}
                  {item.pendingAgeSource === "source_waiting_days"
                    ? "静态等待天数"
                    : item.dataOrigin}
                </small>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function MultiSelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: FilterValue;
  options: string[][];
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}) {
  const selectedValues = value === "all" ? [] : value.split(",");
  return (
    <label>
      {label}
      <select
        multiple
        value={selectedValues}
        size={Math.min(Math.max(options.length, 2), 4)}
        onChange={onChange}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
