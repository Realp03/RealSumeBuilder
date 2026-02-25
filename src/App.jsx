import React, { useEffect, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import ResumeForm from "./components/ResumeForm";
import ResumePreview from "./components/ResumePreview";
import { defaultResume } from "./data/defaultResume";

function safeParseJson(text) {
  try {
    const x = JSON.parse(text);
    return x && typeof x === "object" ? x : null;
  } catch {
    return null;
  }
}

function filenameSlug(s) {
  return String(s || "resume")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-_]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function formatDateYYYYMMDD(d = new Date()) {
  const y = String(d.getFullYear());
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function cleanResumeData(data) {
  const next = structuredClone(data || {});
  next.basics = next.basics || {};
  next.skills = Array.from(
    new Set(
      (next.skills || [])
        .map((s) => String(s || "").trim())
        .filter(Boolean)
        .map((s) =>
          s
            .split(" ")
            .filter(Boolean)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ")
        )
    )
  );

  next.experience = (next.experience || [])
    .map((x) => {
      const bullets = Array.isArray(x?.bullets) ? x.bullets : [];
      const cleanBullets = bullets
        .map((b) => String(b || "").trim())
        .filter(Boolean)
        .map((b) => b.replace(/\s+/g, " "));
      return { ...x, bullets: cleanBullets.length ? cleanBullets : [""] };
    })
    .filter(
      (x) =>
        x &&
        (x.company ||
          x.role ||
          x.start ||
          x.end ||
          (x.bullets || []).some((b) => String(b || "").trim()))
    );

  next.education = (next.education || []).filter(
    (e) => e && (e.school || e.degree || e.start || e.end)
  );

  next.projects = (next.projects || []).filter(
    (p) => p && (p.name || p.link || p.desc)
  );

  next.settings = next.settings || {};
  next.sections =
    Array.isArray(next.sections) && next.sections.length
      ? next.sections
      : ["summary", "experience", "projects", "education"];

  if (typeof next.settings.zoom !== "number") next.settings.zoom = 1;
  if (typeof next.settings.showPhoto !== "boolean") next.settings.showPhoto = true;
  if (typeof next.settings.showFullProjectLinks !== "boolean")
    next.settings.showFullProjectLinks = true;
  if (typeof next.settings.fileBaseName !== "string") next.settings.fileBaseName = "";
  if (typeof next.settings.includeDateInFilename !== "boolean")
    next.settings.includeDateInFilename = false;

  return next;
}

export default function App() {
  const key = "resume_builder_v1";
  const [data, setData] = useState(() => {
    const raw = localStorage.getItem(key);
    if (!raw) return cleanResumeData(defaultResume);
    const parsed = safeParseJson(raw);
    return cleanResumeData(parsed || defaultResume);
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(data));
  }, [data]);

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 1024;
  });

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const previewRef = useRef(null);
  const exportRef = useRef(null);
  const modalFitRef = useRef(null);

  const [exporting, setExporting] = useState(false);
  const [mobileTab, setMobileTab] = useState("edit");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [fitScale, setFitScale] = useState(1);

  useEffect(() => {
    if (!isMobile) setPreviewOpen(false);
  }, [isMobile]);

  useEffect(() => {
    if (!previewOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setPreviewOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewOpen]);

  useEffect(() => {
    if (!isMobile) return;
    document.body.style.overflow = previewOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [previewOpen, isMobile]);

  useEffect(() => {
    if (!previewOpen) return;

    const A4W = 794;

    const calc = () => {
      const el = modalFitRef.current;
      if (!el) return;
      const w = el.getBoundingClientRect().width;
      const s = Math.min(1, (w - 16) / A4W);
      setFitScale(s > 0 ? s : 1);
    };

    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [previewOpen]);

  const settings = data.settings || {};
  const zoom = settings.zoom ?? 1;

  const updateSettings = (patch) =>
    setData((prev) => ({
      ...prev,
      settings: { ...(prev.settings || {}), ...patch },
    }));

  const onExportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const base = settings.fileBaseName || data.basics?.fullName || "resume";
    a.href = url;
    a.download = `${filenameSlug(base)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const onImportJSON = async (file) => {
    if (!file) return;
    const text = await file.text();
    const parsed = safeParseJson(text);
    if (!parsed) return;
    setData(cleanResumeData(parsed));
  };

  const onClean = () => setData((prev) => cleanResumeData(prev));

  const onExportPDF = async () => {
    if (!exportRef.current) return;
    setExporting(true);

    const el = exportRef.current;

    const pdf = new jsPDF("p", "mm", "a4");
    const pageW = pdf.internal.pageSize.getWidth();

    const base = settings.fileBaseName || data.basics?.fullName || "resume";
    const baseSlug = filenameSlug(base);
    const fileName = settings.includeDateInFilename
      ? `${baseSlug}-resume-${formatDateYYYYMMDD(new Date())}.pdf`
      : `${baseSlug}-resume.pdf`;

    await pdf.html(el, {
      x: 0,
      y: 0,
      width: pageW,
      windowWidth: 794,
      autoPaging: "text",
      html2canvas: {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        scrollX: 0,
        scrollY: 0,
      },
    });

    pdf.save(fileName);
    setExporting(false);
  };

  const theme = data.theme || "split";

  const Tabs = (
    <div className="flex w-full gap-2 rounded-2xl border border-white/10 bg-white/5 p-1">
      <button
        type="button"
        onClick={() => setMobileTab("edit")}
        className={`flex-1 rounded-2xl px-3 py-2 text-sm font-extrabold ${
          mobileTab === "edit"
            ? "bg-white/15 text-white"
            : "text-white/70 hover:bg-white/10"
        }`}
      >
        Edit
      </button>
      <button
        type="button"
        onClick={() => setMobileTab("preview")}
        className={`flex-1 rounded-2xl px-3 py-2 text-sm font-extrabold ${
          mobileTab === "preview"
            ? "bg-white/15 text-white"
            : "text-white/70 hover:bg-white/10"
        }`}
      >
        Preview
      </button>
    </div>
  );

  const PreviewPanel = (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-white/80">Live Preview (A4)</div>
        <div className="text-xs text-white/50">auto-saved</div>
      </div>

      <div className="overflow-auto rounded-2xl border border-white/10 bg-black/20 p-2 sm:p-3">
        <div className="mx-auto w-full max-w-[820px]">
          <div style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}>
            <div ref={previewRef}>
              <ResumePreview data={data} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <div className="mb-1 text-xs font-semibold text-white/60">
              PDF filename base
            </div>
            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 outline-none placeholder:text-white/30 focus:border-white/20"
              value={settings.fileBaseName || ""}
              onChange={(e) => updateSettings({ fileBaseName: e.target.value })}
              placeholder="e.g. Mark Daryl Pineda"
            />
          </label>

          <button
            onClick={() =>
              updateSettings({
                includeDateInFilename: !(settings.includeDateInFilename ?? false),
              })
            }
            className="h-[44px] sm:h-[54px] rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold text-white/90 hover:bg-white/15"
            type="button"
          >
            {settings.includeDateInFilename ?? false
              ? "Date in filename: ON"
              : "Date in filename: OFF"}
          </button>
        </div>
      </div>
    </div>
  );

  const FormPanel = (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-3 sm:p-4">
      <div className="mb-3 text-sm font-semibold text-white/80">Edit Resume</div>
      <ResumeForm value={data} onChange={setData} />
    </div>
  );

  const MobilePreviewModal = previewOpen ? (
    <div className="fixed inset-0 z-[9999] lg:hidden">
      <div className="absolute inset-0 bg-black/70" onClick={() => setPreviewOpen(false)} />
      <div className="absolute inset-x-0 bottom-0 top-10 rounded-t-3xl border border-white/10 bg-slate-950 shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="text-sm font-extrabold text-white">Live Preview</div>
          <button
            type="button"
            onClick={() => setPreviewOpen(false)}
            className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white/90 hover:bg-white/15"
          >
            Close
          </button>
        </div>

        <div className="h-[calc(100%-52px)] overflow-auto p-3">
          <div ref={modalFitRef} className="w-full overflow-hidden">
            <div className="flex justify-center">
              <div style={{ transform: `scale(${fitScale})`, transformOrigin: "top center" }}>
                <ResumePreview data={data} />
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="grid grid-cols-1 gap-3">
              <label className="block">
                <div className="mb-1 text-xs font-semibold text-white/60">
                  PDF filename base
                </div>
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 outline-none placeholder:text-white/30 focus:border-white/20"
                  value={settings.fileBaseName || ""}
                  onChange={(e) => updateSettings({ fileBaseName: e.target.value })}
                  placeholder="e.g. Mark Daryl Pineda"
                />
              </label>

              <button
                onClick={() =>
                  updateSettings({
                    includeDateInFilename: !(settings.includeDateInFilename ?? false),
                  })
                }
                className="h-[48px] rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold text-white/90 hover:bg-white/15"
                type="button"
              >
                {settings.includeDateInFilename ?? false
                  ? "Date in filename: ON"
                  : "Date in filename: OFF"}
              </button>
            </div>
          </div>

          <div className="h-6" />
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="fixed left-[-99999px] top-0 bg-white">
        <div ref={exportRef} className="bg-white">
          <ResumePreview
            data={{ ...data, settings: { ...(data.settings || {}), zoom: 1 } }}
          />
        </div>
      </div>

      {MobilePreviewModal}

      <div className="mx-auto max-w-7xl px-3 sm:px-4 py-5 sm:py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xl font-extrabold">Resume Builder</div>
            <div className="text-sm text-white/50">Form ➜ Live Preview ➜ PDF Export</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={theme}
              onChange={(e) => setData({ ...data, theme: e.target.value })}
              className="w-full sm:w-auto rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 outline-none hover:bg-white/15"
            >
              <option value="split">Split (Modern)</option>
              <option value="sidebar">Sidebar (Left)</option>
              <option value="classic">Classic (Top Header)</option>
              <option value="compact">Compact (Dense)</option>
            </select>

            <button
              onClick={onClean}
              className="flex-1 sm:flex-none rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/15"
              type="button"
            >
              Clean
            </button>

            <button
              onClick={() => setData(cleanResumeData(defaultResume))}
              className="flex-1 sm:flex-none rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/15"
              type="button"
            >
              Reset
            </button>

            <button
              onClick={onExportPDF}
              disabled={exporting}
              className="w-full sm:w-auto rounded-2xl border border-white/10 bg-white/15 px-4 py-2 text-sm font-extrabold text-white hover:bg-white/20 disabled:opacity-60"
              type="button"
            >
              {exporting ? "Exporting..." : "Download PDF"}
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
              Zoom
            </div>
            <input
              type="range"
              min="0.8"
              max="1.2"
              step="0.05"
              value={zoom}
              onChange={(e) => updateSettings({ zoom: Number(e.target.value) })}
              className="w-full sm:w-[220px]"
            />
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
              {(Math.round(zoom * 100) || 100) + "%"}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => updateSettings({ showPhoto: !(settings.showPhoto ?? true) })}
              className="flex-1 sm:flex-none rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/15"
              type="button"
            >
              {settings.showPhoto ?? true ? "Hide Photo" : "Show Photo"}
            </button>

            <button
              onClick={() =>
                updateSettings({
                  showFullProjectLinks: !(settings.showFullProjectLinks ?? true),
                })
              }
              className="flex-1 sm:flex-none rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/15"
              type="button"
            >
              {settings.showFullProjectLinks ?? true ? "Short Links" : "Full Links"}
            </button>

            <button
              onClick={onExportJSON}
              className="flex-1 sm:flex-none rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/15"
              type="button"
            >
              Export JSON
            </button>

            <label className="flex-1 sm:flex-none cursor-pointer rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/15 text-center">
              Import JSON
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => onImportJSON(e.target.files?.[0])}
              />
            </label>
          </div>

          <div className="lg:hidden">{Tabs}</div>
        </div>

        <div className="mt-6 hidden lg:grid grid-cols-1 gap-6 lg:grid-cols-2">
          {FormPanel}
          {PreviewPanel}
        </div>

        <div className="mt-6 lg:hidden">
          {mobileTab === "edit" ? (
            <div className="space-y-4">
              {FormPanel}

              <div className="sticky bottom-4 z-40">
                <div className="mx-auto flex max-w-md justify-center px-2">
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    className="w-full rounded-2xl border border-white/10 bg-white/15 px-4 py-3 text-sm font-extrabold text-white shadow-xl hover:bg-white/20"
                  >
                    Live Preview
                  </button>
                </div>
              </div>
            </div>
          ) : (
            PreviewPanel
          )}
        </div>

        <div className="mt-6 text-xs text-white/45">
          This website is a practice project built with Vite and Tailwind. Thank you for your patience as I continue improving it.
        </div>
      </div>
    </div>
  );
}
