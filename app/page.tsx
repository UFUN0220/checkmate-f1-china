import { projectBoundary } from "@/lib/project-boundary";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
      <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-sky-700">项目骨架 · 阶段 0</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{projectBoundary.name}</h1>
        <p className="mt-4 max-w-2xl leading-7 text-slate-600">{projectBoundary.description}</p>
        <p className="mt-6 rounded-lg bg-slate-100 px-4 py-3 text-sm leading-6 text-slate-600">
          当前仅建立工程基础与产品边界；公开数据、统计分析和完整看板将在后续阶段按契约实现。
        </p>
      </section>
    </main>
  );
}
