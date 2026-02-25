import React, { useEffect, useMemo, useRef, useState } from "react";
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
    .filter((x) => x && (x.company || x.role || x.start || x.end || (x.bullets || []).some((b) => String(b || "").trim())));

  next.education = (next.education || []).filter(
    (e) => e && (e.school || e.degree || e.start || e.end)
  );

  next.projects = (next.projects || []).filter(
    (p) => p && (p.name || p.link || p.desc)
  );

  next.settings = next.settings || {};
  next.sections = Array.isArray(next.sections) && next.sections.length
    ? next.sections
    : ["summary", "experience", "projects", "education"];

  if (typeof next.settings.zoom !== "number") next.settings.zoom = 1;
  if (typeof next.settings.showPhoto !== "boolean") next.settings.showPhoto = true;
  if (typeof next.settings.showFullProjectLinks !== "boolean") next.settings.showFullProjectLinks = true;
  if (typeof next.settings.fileBaseName !== "string") next.settings.fileBaseName = "";
  if (typeof next.settings.includeDateInFilename !== "boolean") next.settings.includeDateInFilename = false;

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

  const previewRef = useRef(null);
  const [exporting, setExporting] = useState(false);

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
    if (!previewRef.current) return;
    setExporting(true);

    const el = previewRef.current;

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
      windowWidth: el.scrollWidth,
      autoPaging: "text",
      html2canvas: {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      },
    });

    pdf.save(fileName);
    setExporting(false);
  };

  const theme = data.theme || "split";

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xl font-extrabold">Resume Builder</div>
            <div className="text-sm text-white/50">
              Form ➜ Live Preview ➜ PDF Export
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={theme}
              onChange={(e) => setData({ ...data, theme: e.target.value })}
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 outline-none hover:bg-white/15"
            >
              <option value="split">Split (Modern)</option>
              <option value="sidebar">Sidebar (Left)</option>
              <option value="classic">Classic (Top Header)</option>
              <option value="compact">Compact (Dense)</option>
            </select>

            <button
              onClick={onClean}
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/15"
              type="button"
            >
              Clean
            </button>

            <button
              onClick={() => setData(cleanResumeData(defaultResume))}
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/15"
              type="button"
            >
              Reset
            </button>

            <button
              onClick={onExportPDF}
              disabled={exporting}
              className="rounded-2xl border border-white/10 bg-white/15 px-4 py-2 text-sm font-extrabold text-white hover:bg-white/20 disabled:opacity-60"
              type="button"
            >
              {exporting ? "Exporting..." : "Download PDF"}
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
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
            className="w-[220px]"
          />
          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
            {(Math.round(zoom * 100) || 100) + "%"}
          </div>

          <button
            onClick={() => updateSettings({ showPhoto: !(settings.showPhoto ?? true) })}
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/15"
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
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/15"
            type="button"
          >
            {settings.showFullProjectLinks ?? true ? "Short Links" : "Full Links"}
          </button>

          <button
            onClick={onExportJSON}
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/15"
            type="button"
          >
            Export JSON
          </button>

          <label className="cursor-pointer rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/15">
            Import JSON
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => onImportJSON(e.target.files?.[0])}
            />
          </label>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 text-sm font-semibold text-white/80">
              Edit Resume
            </div>
            <ResumeForm value={data} onChange={setData} />
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-white/80">
                Live Preview (A4)
              </div>
              <div className="text-xs text-white/50">auto-saved</div>
            </div>

            <div className="overflow-auto rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="mx-auto w-full max-w-[800px]">
                <div
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: "top center",
                  }}
                >
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
                  className="h-[54px] rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold text-white/90 hover:bg-white/15"
                  type="button"
                >
                  {settings.includeDateInFilename ?? false
                    ? "Date in filename: ON"
                    : "Date in filename: OFF"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-xs text-white/45">
          This website is a practice project built with Vite and Tailwind. Thank you for your patience as I continue improving it.
        </div>
      </div>
    </div>
  );
}
