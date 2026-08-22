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
import { demoSnapshot } from "../lib/demo-data";
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
  location: Location | null;
  status: FilterValue;
  month: FilterValue;
  entry: FilterValue;
  major: FilterValue;
};

const defaultState: AtlasState = {
  view: "overview",
  location: null,
  status: "all",
  month: "all",
  entry: "all",
  major: "all",
};

function readUrlState(): AtlasState {
  if (typeof window === "undefined") return defaultState;
  const params = new URLSearchParams(window.location.search);
  const location = LOCATIONS.includes(params.get("location") as Location)
    ? (params.get("location") as Location)
    : null;
  const view = params.get("view");
  return {
    view: view === "location" || view === "cases" ? view : "overview",
    location,
    status: params.get("status") || "all",
    month: params.get("month") || "all",
    entry: params.get("entry") || "all",
    major: params.get("major") || "all",
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
    if (nextState.location) params.set("location", nextState.location);
    if (nextState.view !== "overview") params.set("view", nextState.view);
    if (nextState.status !== "all") params.set("status", nextState.status);
    if (nextState.month !== "all") params.set("month", nextState.month);
    if (nextState.entry !== "all") params.set("entry", nextState.entry);
    if (nextState.major !== "all") params.set("major", nextState.major);
    const query = params.toString();
    window.history.pushState({}, "", query ? `/?${query}` : "/");
    setState(nextState);
  };

  const openLocation = (location: Location) => updateUrl({ view: "location", location });
  const openCases = (location = state.location) => updateUrl({ view: "cases", location });
  const goBack = () =>
    state.view === "cases"
      ? updateUrl({ view: state.location ? "location" : "overview" })
      : updateUrl({
          view: "overview",
          location: null,
          status: "all",
          month: "all",
          entry: "all",
          major: "all",
        });

  return (
    <div className="atlas-app">
      <header className="atlas-header">
        <div className="atlas-header__brand">
          <span className="atlas-header__mark" aria-hidden="true">
            <GlobeHemisphereWest size={22} weight="regular" />
          </span>
          <span>CheckMate F1 China</span>
          <span className="atlas-header__divider" aria-hidden="true" />
          <span className="atlas-header__descriptor">DEMO DATA</span>
        </div>
        <div className="atlas-header__meta">
          <span>快照：{demoSnapshot.manifest.snapshotDate}</span>
          <a href="#methods">关于口径</a>
        </div>
      </header>

      <main className="atlas-layout">
        <aside className="atlas-sidebar">
          <div className="atlas-sidebar__intro">
            <p className="eyebrow">F-1 Checkee 数据观察 · DEMO_DATA</p>
            <h1>证据图谱</h1>
            <p>这是来源无关的数据产品演示。当前页面使用合成 DEMO_DATA，不代表真实 Checkee 样本。</p>
          </div>

          <div className="atlas-sidebar__summary" aria-label="演示数据快照概览">
            <span>演示快照 · 2026 年以来</span>
            <div className="atlas-summary-values atlas-summary-values--four">
              <SummaryValue label="总样本" value={demoSnapshot.national.sampleCount} />
              <SummaryValue label="Pending" value={demoSnapshot.national.pendingCount} />
              <SummaryValue label="Clear" value={demoSnapshot.national.clearCount} />
              <SummaryValue label="Reject" value={demoSnapshot.national.rejectCount} />
            </div>
          </div>

          <div className="atlas-sidebar__note">
            <div className="section-kicker">
              <Info size={16} weight="bold" />
              <span>来源状态</span>
            </div>
            <p>
              Checkee 访问状态为 CHECKEE_ACCESS_BLOCKED；真实来源 Adapter 保持
              disabled，本页面仅用于离线开发和截图。
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
              disabled={!state.location}
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
              当前为 <strong>DEMO_DATA</strong>，快照日期 {demoSnapshot.manifest.snapshotDate}；真实
              Checkee 数据尚未接入。
            </span>
          </div>

          {state.view === "overview" && (
            <OverviewPanel onOpenCases={() => openCases()} onOpenLocation={openLocation} />
          )}
          {state.view === "location" && state.location && (
            <LocationPanel
              location={state.location}
              onOpenCases={() => openCases(state.location)}
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
        <span>数据来源：DEMO_DATA（合成开发数据）</span>
        <span>范围：2026-01-01 起 · 当前月标记为尚未完整</span>
        <span>仅供开发和截图，不构成真实 Checkee 结论或个案预测。</span>
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
          <p className="eyebrow">全国概览 · DEMO_DATA</p>
          <h2>从样本范围开始，逐层了解数据。</h2>
          <p className="atlas-lede">
            先看全国状态构成和五个地点的演示分布，再进入地点指标或标准化案例列表。所有数值来自同一份合成快照。
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
              <MapPin size={16} weight="bold" /> Checkee F-1 公开样本分布（演示）
            </p>
            <p className="muted">
              按申请地点 · 共 {demoSnapshot.national.sampleCount} 条 DEMO_DATA
            </p>
          </div>
          <span className="selection-readout">来源：DEMO_DATA</span>
        </div>
        <div className="atlas-map-strip">
          <div className="atlas-map-strip__background" aria-hidden="true" />
          <div className="atlas-route" aria-label="五个地点的演示样本数量">
            <span className="atlas-route__origin">
              <span className="atlas-route__origin-label">全国</span>
              <strong>{demoSnapshot.national.sampleCount}</strong>
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
                <strong>{demoSnapshot.locations[location].sampleCount}</strong>
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
          <span className="data-status">DEMO_DATA</span>
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
                const metrics = demoSnapshot.locations[location];
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
          <Info size={14} /> 地点占比是 DEMO_DATA 的样本分布，不是领馆比例或风险。
        </p>
      </section>

      <TrendSection />
    </>
  );
}

function TrendSection() {
  const max = Math.max(...demoSnapshot.cohorts.map((cohort) => cohort.sampleCount));
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
        {demoSnapshot.cohorts.map((cohort) => (
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
  const metrics = demoSnapshot.locations[location];
  return (
    <section className="detail-panel" aria-labelledby="location-title">
      <div className="detail-panel__heading">
        <div>
          <p className="eyebrow">地点指标 · {LOCATION_NAMES[location]} · DEMO_DATA</p>
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
          note={`${(metrics.sampleShare * 100).toFixed(1)}% of demo snapshot`}
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
          <strong>DEMO_DATA 状态说明</strong>
          <p>
            {metrics.sampleBand === "insufficient"
              ? "当前地点样本少于 5 条，因此隐藏等待和完成时长的描述性分位数；仅保留样本数和日期范围。"
              : metrics.sampleBand === "small"
                ? "当前地点为小样本（5–9 条），指标仅作描述性参考，不作地点间结论。"
                : "当前地点达到标准描述性样本量。"}
            以上指标由离线合成数据驱动。真实 Checkee 快照接入后，页面消费同一 PublicSnapshot
            模型，不需要改写统计或展示组件。
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
  const majors = [...new Set(demoSnapshot.cases.map((item) => item.majorCategory))].sort();
  const months = demoSnapshot.cohorts.map((cohort) => cohort.month);
  const filteredCases = useMemo(
    () =>
      demoSnapshot.cases.filter(
        (item) =>
          (!state.location || item.location === state.location) &&
          (state.status === "all" || item.status === state.status) &&
          (state.month === "all" || item.checkDate.startsWith(state.month)) &&
          (state.entry === "all" || item.visaEntry === state.entry) &&
          (state.major === "all" || item.majorCategory === state.major),
      ),
    [state],
  );
  const hasFilters = [state.location, state.status, state.month, state.entry, state.major].some(
    (value) => value && value !== "all",
  );
  return (
    <section className="detail-panel" aria-labelledby="cases-title">
      <div className="detail-panel__heading">
        <div>
          <p className="eyebrow">
            标准化案例 · {state.location ? LOCATION_NAMES[state.location] : "全国"} · DEMO_DATA
          </p>
          <h2 id="cases-title">Checkee F-1 标准化案例</h2>
          <p className="atlas-lede">
            仅展示 PublicCase 允许字段。当前数据明确标记为 DEMO_DATA，不代表真实 Checkee 记录。
          </p>
        </div>
        <span className="data-status">{filteredCases.length} 条结果</span>
      </div>
      <div className="filter-bar" aria-label="案例筛选">
        <label>
          状态
          <select
            value={state.status}
            onChange={(event) => onChange({ status: event.target.value })}
          >
            <option value="all">全部</option>
            {Object.entries(STATUS_NAMES).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Check 月份
          <select value={state.month} onChange={(event) => onChange({ month: event.target.value })}>
            <option value="all">全部月份</option>
            {months.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
        </label>
        <label>
          签证入口
          <select value={state.entry} onChange={(event) => onChange({ entry: event.target.value })}>
            <option value="all">全部</option>
            <option value="initial">Initial</option>
            <option value="renewal">Renewal</option>
            <option value="unknown">Unknown</option>
          </select>
        </label>
        <label>
          专业分类
          <select value={state.major} onChange={(event) => onChange({ major: event.target.value })}>
            <option value="all">全部分类</option>
            {majors.map((major) => (
              <option key={major} value={major}>
                {major}
              </option>
            ))}
          </select>
        </label>
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
            <strong>没有匹配的 DEMO_DATA</strong>
            <p>清除筛选后查看全部合成案例。真实数据接入前不会用旧快照填充结果。</p>
          </div>
        </div>
      ) : (
        <div className="case-list" aria-label="标准化案例列表">
          {filteredCases.map((item) => (
            <article className="case-row" key={item.publicId}>
              <div>
                <strong>{LOCATION_NAMES[item.location]}</strong>
                <span>
                  {item.majorCategory} ·{" "}
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
                      ? `完成 ${item.resolvedDurationDays} 天`
                      : "无完成时长"}
                </span>
                <small>
                  {item.sourceMonth} · {item.dataOrigin}
                </small>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
