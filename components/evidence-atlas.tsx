"use client";

import {
  ArrowLeft,
  ArrowRight,
  CaretRight,
  FileText,
  GlobeHemisphereWest,
  Info,
  MapPin,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import {
  demoMeta,
  formatCount,
  getLocation,
  getShare,
  locationData,
  type LocationKey,
} from "../lib/demo-data";

type AtlasView = "overview" | "location" | "cases";

function readUrlState() {
  if (typeof window === "undefined") {
    return { view: "overview" as AtlasView, location: null as LocationKey | null };
  }

  const params = new URLSearchParams(window.location.search);
  const view = params.get("view");
  const location = getLocation(params.get("location"))?.key ?? null;

  return {
    view: view === "location" || view === "cases" ? view : ("overview" as AtlasView),
    location,
  };
}

export function EvidenceAtlas() {
  const [view, setView] = useState<AtlasView>("overview");
  const [selectedLocation, setSelectedLocation] = useState<LocationKey | null>(null);
  const activeLocation = useMemo(() => getLocation(selectedLocation), [selectedLocation]);

  useEffect(() => {
    const syncFromUrl = () => {
      const next = readUrlState();
      setView(next.view);
      setSelectedLocation(next.location);
    };

    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  const updateUrl = (nextView: AtlasView, nextLocation = selectedLocation) => {
    const params = new URLSearchParams();
    if (nextLocation) params.set("location", nextLocation);
    if (nextView !== "overview") params.set("view", nextView);

    const query = params.toString();
    window.history.pushState({}, "", query ? `/?${query}` : "/");
    setView(nextView);
    setSelectedLocation(nextLocation);
  };

  const chooseLocation = (key: LocationKey) => updateUrl("overview", key);
  const openLocation = () => selectedLocation && updateUrl("location");
  const openCases = () => selectedLocation && updateUrl("cases");
  const goBack = () => (view === "cases" ? updateUrl("location") : updateUrl("overview", null));

  return (
    <div className="atlas-app">
      <header className="atlas-header">
        <div className="atlas-header__brand">
          <span className="atlas-header__mark" aria-hidden="true">
            <GlobeHemisphereWest size={22} weight="regular" />
          </span>
          <span>CheckMate F1 China</span>
          <span className="atlas-header__divider" aria-hidden="true" />
          <span className="atlas-header__descriptor">证据图谱</span>
        </div>
        <div className="atlas-header__meta">
          <span>数据更新：{demoMeta.lastSuccessfulSnapshot ?? "暂无成功快照"}</span>
          <a href="#methods">关于本图谱</a>
        </div>
      </header>

      <main className="atlas-layout">
        <aside className="atlas-sidebar">
          <div className="atlas-sidebar__intro">
            <p className="eyebrow">Checkee F-1 公开样本 · 中国大陆</p>
            <h1>证据图谱</h1>
            <p>
              基于 Checkee.info 的公开用户自报样本，聚焦 2026 年以来的中国大陆 F-1
              记录；当前来源月份页暂不可访问。
            </p>
          </div>

          <div className="atlas-sidebar__summary" aria-label="全国样本概览">
            <span>当前公开快照</span>
            <div className="atlas-summary-values">
              <div>
                <strong>{formatCount(demoMeta.total)}</strong>
                <small>总样本</small>
              </div>
              <div>
                <strong>{formatCount(demoMeta.pending)}</strong>
                <small>Pending</small>
              </div>
              <div>
                <strong>{formatCount(demoMeta.clear)}</strong>
                <small>Clear</small>
              </div>
            </div>
          </div>

          <div className="atlas-sidebar__note">
            <div className="section-kicker">
              <Info size={16} weight="bold" />
              <span>方法说明</span>
            </div>
            <p>数据来源为 Checkee.info 公开用户自报样本，不代表官方数据或普通申请者的总体概率。</p>
            <a href="#methods">
              查看口径与限制 <ArrowRight size={14} />
            </a>
          </div>
        </aside>

        <section className="atlas-content" aria-label="证据图谱内容">
          <nav className="atlas-breadcrumbs" aria-label="页面层级">
            <button
              className={view === "overview" ? "is-current" : ""}
              onClick={() => updateUrl("overview", null)}
            >
              全国概览
            </button>
            <CaretRight size={14} aria-hidden="true" />
            <button
              className={view === "location" ? "is-current" : ""}
              disabled={!selectedLocation}
              onClick={() => updateUrl("location")}
            >
              地点指标
            </button>
            <CaretRight size={14} aria-hidden="true" />
            <button
              className={view === "cases" ? "is-current" : ""}
              disabled={!selectedLocation}
              onClick={openCases}
            >
              标准化案例
            </button>
          </nav>

          {view !== "overview" && (
            <button className="back-link" onClick={goBack}>
              <ArrowLeft size={16} /> 返回上一级
            </button>
          )}

          {view === "overview" && (
            <OverviewPanel
              selectedLocation={selectedLocation}
              onChooseLocation={chooseLocation}
              onOpenLocation={openLocation}
              onOpenCases={openCases}
            />
          )}

          {view === "location" && activeLocation && (
            <LocationPanel location={activeLocation} onOpenCases={openCases} />
          )}

          {view === "cases" && activeLocation && <CasesPanel location={activeLocation} />}
        </section>
      </main>

      <footer id="methods" className="atlas-footer">
        <span>数据更新：{demoMeta.lastSuccessfulSnapshot ?? "暂无成功快照"}</span>
        <span>
          来源：{demoMeta.sourceName} · 范围：{demoMeta.rangeStart} 起
        </span>
        <span>非官方公开样本参考，不构成法律意见或个案预测。</span>
      </footer>
    </div>
  );
}

function OverviewPanel({
  selectedLocation,
  onChooseLocation,
  onOpenLocation,
  onOpenCases,
}: {
  selectedLocation: LocationKey | null;
  onChooseLocation: (key: LocationKey) => void;
  onOpenLocation: () => void;
  onOpenCases: () => void;
}) {
  return (
    <>
      <div className="atlas-overview-head">
        <div>
          <p className="eyebrow">全国概览</p>
          <h2>从公开来源开始，逐层了解证据。</h2>
          <p className="atlas-lede">
            当前 Checkee 月份页返回 403，尚未形成可用快照。来源恢复后，这里将展示 F-1
            样本、地点指标、Pending 等待年龄与 Clear 完成时长。
          </p>
        </div>
        <div className="atlas-actions">
          <button
            className="button button--primary"
            onClick={onOpenCases}
            disabled={!selectedLocation}
          >
            查看标准化案例 <ArrowRight size={17} />
          </button>
          <button
            className="button button--secondary"
            onClick={onOpenLocation}
            disabled={!selectedLocation}
          >
            进入地点指标 <ArrowRight size={17} />
          </button>
        </div>
      </div>

      <section className="atlas-trajectory" aria-labelledby="trajectory-title">
        <div className="atlas-trajectory__header">
          <div>
            <p className="section-kicker" id="trajectory-title">
              <MapPin size={16} weight="bold" />
              Checkee F-1 公开样本分布
            </p>
            <p className="muted">按申请地点 · 等待可用快照</p>
          </div>
          {selectedLocation && (
            <span className="selection-readout">
              当前选择：{getLocation(selectedLocation)?.name}
            </span>
          )}
        </div>
        <div className="atlas-map-strip">
          <div className="atlas-map-strip__background" aria-hidden="true" />
          <div className="atlas-route" aria-label="五个申请地点样本数量">
            <span className="atlas-route__origin">
              <span className="atlas-route__origin-label">全国</span>
              <strong>{formatCount(demoMeta.total)}</strong>
            </span>
            <span className="atlas-route__line" aria-hidden="true" />
            {locationData.map((location) => (
              <button
                key={location.key}
                className={`atlas-node ${selectedLocation === location.key ? "is-selected" : ""}`}
                onClick={() => onChooseLocation(location.key)}
                aria-pressed={selectedLocation === location.key}
              >
                <span className="atlas-node__dot" aria-hidden="true" />
                <span>{location.name}</span>
                <strong>{location.count}</strong>
              </button>
            ))}
            {locationData.length === 0 && (
              <span className="atlas-route__empty">暂无可用 Checkee 月份快照</span>
            )}
          </div>
        </div>
      </section>

      <section className="atlas-table-section" aria-labelledby="location-table-title">
        <div className="section-heading-row">
          <div>
            <p className="section-kicker" id="location-table-title">
              <FileText size={16} weight="bold" />
              地点索引
            </p>
            <p className="muted">选择一行，进入该地点的指标层。</p>
          </div>
          <span className="data-status">来源访问受限</span>
        </div>
        <div className="atlas-table-wrap">
          <table className="atlas-table">
            <thead>
              <tr>
                <th scope="col">地点</th>
                <th scope="col">公开样本</th>
                <th scope="col">样本占比</th>
                <th scope="col">等待年龄</th>
                <th scope="col">进入</th>
              </tr>
            </thead>
            <tbody>
              {locationData.map((location) => (
                <tr
                  key={location.key}
                  className={selectedLocation === location.key ? "is-selected" : ""}
                >
                  <th scope="row">
                    <button
                      className="table-location"
                      onClick={() => onChooseLocation(location.key)}
                    >
                      <span className="table-location__dot" aria-hidden="true" />
                      {location.name}
                    </button>
                  </th>
                  <td>{location.count}</td>
                  <td>{getShare(location.count, demoMeta.total)}</td>
                  <td className="table-muted">待数据层接入</td>
                  <td>
                    <button className="table-enter" onClick={() => onChooseLocation(location.key)}>
                      <CaretRight size={17} /> <span className="sr-only">查看{location.name}</span>
                    </button>
                  </td>
                </tr>
              ))}
              {locationData.length === 0 && (
                <tr>
                  <td colSpan={5} className="table-muted">
                    暂无可用公开快照；不会用旧数据填充地点表。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="table-footnote">
          <Info size={14} /> 地点占比将在 Checkee 快照建立后计算；不代表领馆比例。
        </p>
      </section>
    </>
  );
}

function LocationPanel({
  location,
  onOpenCases,
}: {
  location: NonNullable<ReturnType<typeof getLocation>>;
  onOpenCases: () => void;
}) {
  return (
    <section className="detail-panel" aria-labelledby="location-title">
      <div className="detail-panel__heading">
        <div>
          <p className="eyebrow">地点指标 · {location.name}</p>
          <h2 id="location-title">{location.name} 的 Checkee 样本</h2>
          <p className="atlas-lede">
            这里将呈现 Checkee 快照中的地点样本、状态和时间指标；当前来源访问受限。
          </p>
        </div>
        <button className="button button--primary" onClick={onOpenCases}>
          查看标准化案例 <ArrowRight size={17} />
        </button>
      </div>
      <div className="detail-stats">
        <div>
          <span>公开样本</span>
          <strong>{location.count}</strong>
          <small>{getShare(location.count, demoMeta.total)} of current snapshot</small>
        </div>
        <div>
          <span>状态构成</span>
          <strong className="detail-stats__pending">待数据层接入</strong>
          <small>保留 Checkee 来源语义</small>
        </div>
        <div>
          <span>等待年龄</span>
          <strong className="detail-stats__pending">—</strong>
          <small>以 snapshotDate 计算</small>
        </div>
      </div>
      <div className="detail-empty">
        <Info size={22} />
        <div>
          <strong>地点细分正在准备</strong>
          <p>
            当前阶段未取得可用来源快照。来源恢复后，这里会加入 Pending 等待年龄、Clear
            完成时长、日期范围和专业分类。
          </p>
        </div>
      </div>
    </section>
  );
}

function CasesPanel({ location }: { location: NonNullable<ReturnType<typeof getLocation>> }) {
  return (
    <section className="detail-panel" aria-labelledby="cases-title">
      <div className="detail-panel__heading">
        <div>
          <p className="eyebrow">标准化案例 · {location.name}</p>
          <h2 id="cases-title">Checkee F-1 标准化案例</h2>
          <p className="atlas-lede">只有公开快照中的最小字段会出现在这里。</p>
        </div>
        <span className="data-status">尚未建立</span>
      </div>
      <div className="detail-empty detail-empty--large">
        <FileText size={28} />
        <div>
          <strong>Checkee 公开快照尚未建立</strong>
          <p>
            当前没有可展示的案例记录。不会用虚构案例填充列表，也不会公开源表自由文本、联系方式或案件标识。
          </p>
        </div>
      </div>
    </section>
  );
}
