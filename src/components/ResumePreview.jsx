import React, { useMemo } from "react";

const layouts = [
  { value: "split", label: "Split (Modern)" },
  { value: "sidebar", label: "Sidebar (Left)" },
  { value: "classic", label: "Classic (Top Header)" },
  { value: "compact", label: "Compact (Dense)" },
];

export default function ResumePreview({ data }) {
  const layout = data.theme || "split";
  if (layout === "sidebar") return <SidebarLayout data={data} />;
  if (layout === "classic") return <ClassicLayout data={data} />;
  if (layout === "compact") return <CompactLayout data={data} />;
  return <SplitLayout data={data} />;
}

function Page({ children }) {
  return (
    <div className="h-full w-full rounded-2xl border border-slate-200 bg-white p-10 text-slate-900 shadow-xl">
      {children}
    </div>
  );
}

function Photo({ src, size = 72 }) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt="Photo"
      className="shrink-0 rounded-2xl border border-slate-200 object-cover"
      style={{ width: size, height: size }}
    />
  );
}

function Section({ title, children }) {
  return (
    <div className="mt-7">
      <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
        {title}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Divider() {
  return <div className="mt-7 h-px w-full bg-slate-200" />;
}

function Chips({ items }) {
  if (!items?.length) return null;
  return (
    <div className="flex flex-wrap gap-2.5">
      {items.map((s, i) => (
        <span
          key={i}
          className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700"
        >
          {s}
        </span>
      ))}
    </div>
  );
}

function Experience({ items }) {
  if (!items?.length) return null;
  return (
    <div className="space-y-5">
      {items.map((x, i) => (
        <div key={i} className="break-inside-avoid">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[15px] font-bold text-slate-900">
                {x.role || "Role"}{" "}
                <span className="font-semibold text-slate-500">
                  · {x.company || "Company"}
                </span>
              </div>
            </div>
            <div className="shrink-0 text-xs font-semibold text-slate-500">
              {(x.start || "") && (x.end || "")
                ? `${x.start} — ${x.end}`
                : x.start || x.end || ""}
            </div>
          </div>

          {Array.isArray(x.bullets) && x.bullets.filter(Boolean).length ? (
            <ul className="mt-3 list-disc space-y-2 pl-5 text-[14px] leading-relaxed text-slate-700">
              {x.bullets
                .filter((t) => String(t || "").trim())
                .map((t, bi) => (
                  <li key={bi}>{t}</li>
                ))}
            </ul>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function Education({ items }) {
  if (!items?.length) return null;
  return (
    <div className="space-y-4">
      {items.map((e, i) => (
        <div
          key={i}
          className="flex items-start justify-between gap-4 break-inside-avoid"
        >
          <div className="min-w-0">
            <div className="text-[15px] font-bold text-slate-900">
              {e.school || "School"}
            </div>
            <div className="mt-0.5 text-[14px] text-slate-700">
              {e.degree || "Degree"}
            </div>
          </div>
          <div className="shrink-0 text-xs font-semibold text-slate-500">
            {(e.start || "") && (e.end || "")
              ? `${e.start} — ${e.end}`
              : e.start || e.end || ""}
          </div>
        </div>
      ))}
    </div>
  );
}

function domainOnly(url) {
  const s = String(url || "").trim();
  if (!s) return "";
  try {
    const u = new URL(s.startsWith("http") ? s : `https://${s}`);
    return u.host.replace(/^www\./, "");
  } catch {
    return s.replace(/^https?:\/\//, "").replace(/^www\./, "");
  }
}

function Projects({ items, showFullLinks }) {
  if (!items?.length) return null;
  return (
    <div className="space-y-4">
      {items.map((p, i) => (
        <div key={i} className="break-inside-avoid">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div className="text-[15px] font-bold text-slate-900">
              {p.name || "Project"}
            </div>
            <div className="text-xs font-semibold text-slate-500 break-all">
              {showFullLinks ? (p.link || "") : domainOnly(p.link || "")}
            </div>
          </div>
          {p.desc ? (
            <div className="mt-2 text-[14px] leading-relaxed text-slate-700">
              {p.desc}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function SummaryBlock({ summary }) {
  if (!summary) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 break-inside-avoid">
      <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
        Summary
      </div>
      <div className="mt-3 text-[14px] leading-relaxed text-slate-700">
        {summary}
      </div>
    </div>
  );
}

function OrderedMainSections({ data }) {
  const b = data.basics || {};
  const settings = data.settings || {};
  const showFullLinks = settings.showFullProjectLinks ?? true;

  const blocks = useMemo(() => {
    const map = {
      summary: b.summary ? <SummaryBlock summary={b.summary} /> : null,
      experience: data.experience?.length ? (
        <Section title="Experience">
          <Experience items={data.experience} />
        </Section>
      ) : null,
      projects: data.projects?.length ? (
        <Section title="Projects">
          <Projects items={data.projects} showFullLinks={showFullLinks} />
        </Section>
      ) : null,
      education: data.education?.length ? (
        <Section title="Education">
          <Education items={data.education} />
        </Section>
      ) : null,
    };

    const order =
      Array.isArray(data.sections) && data.sections.length
        ? data.sections
        : ["summary", "experience", "projects", "education"];

    return order.map((k) => <React.Fragment key={k}>{map[k]}</React.Fragment>);
  }, [
    b.summary,
    data.education,
    data.experience,
    data.projects,
    data.sections,
    showFullLinks,
  ]);

  return <>{blocks}</>;
}

function SplitLayout({ data }) {
  const b = data.basics || {};
  const settings = data.settings || {};
  const showPhoto = settings.showPhoto ?? true;
  const showFullLinks = settings.showFullProjectLinks ?? true;
  const hasPhoto = Boolean(showPhoto && b.photoDataUrl);

  return (
    <Page>
      <div className="grid grid-cols-12 gap-10 items-start">
        <div className="col-span-9 min-w-0">
          <div className="text-[34px] font-extrabold leading-[1.08]">
            {b.fullName || "Your Name"}
          </div>
          <div className="mt-2 text-[15px] font-semibold text-slate-600">
            {b.title || "Your Title"}
          </div>

          <div className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-[12px] font-semibold leading-relaxed text-slate-700">
              <div className="break-all">{b.email || ""}</div>
              <div>{b.phone || ""}</div>
              <div>{b.location || ""}</div>
              <div className="break-all">{b.website || ""}</div>
            </div>
          </div>
        </div>

        <div className="col-span-3 flex justify-end">
          {hasPhoto ? <Photo src={b.photoDataUrl} size={94} /> : null}
        </div>
      </div>

      {b.summary ? (
        <div className="mt-7 text-[14px] leading-relaxed text-slate-700 break-inside-avoid">
          {b.summary}
        </div>
      ) : null}

      <Divider />

      <div className="grid grid-cols-12 gap-10">
        <div className="col-span-5">
          <Section title="Skills">
            <Chips items={data.skills || []} />
          </Section>

          {data.projects?.length ? (
            <Section title="Projects">
              <Projects items={data.projects} showFullLinks={showFullLinks} />
            </Section>
          ) : null}
        </div>

        <div className="col-span-7">
          {data.experience?.length ? (
            <Section title="Experience">
              <Experience items={data.experience} />
            </Section>
          ) : null}

          {data.education?.length ? (
            <Section title="Education">
              <Education items={data.education} />
            </Section>
          ) : null}
        </div>
      </div>
    </Page>
  );
}

function SidebarLayout({ data }) {
  const b = data.basics || {};
  const settings = data.settings || {};
  const showPhoto = settings.showPhoto ?? true;

  return (
    <Page>
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-col items-center text-center">
              {showPhoto ? <Photo src={b.photoDataUrl} size={112} /> : null}
              <div className="mt-4 text-lg font-extrabold leading-tight">
                {b.fullName || "Your Name"}
              </div>
              <div className="mt-1 text-xs font-semibold text-slate-600">
                {b.title || "Your Title"}
              </div>
            </div>

            <div className="mt-5 space-y-1.5 text-xs leading-relaxed text-slate-700 text-center">
              <div className="break-all">{b.email || ""}</div>
              <div>{b.phone || ""}</div>
              <div>{b.location || ""}</div>
              <div className="break-all">{b.website || ""}</div>
            </div>

            <div className="mt-5 h-px w-full bg-slate-200" />

            <div className="mt-5">
              <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Skills
              </div>
              <div className="mt-3">
                <Chips items={data.skills || []} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-8">
          <OrderedMainSections data={data} />
        </div>
      </div>
    </Page>
  );
}

function ClassicLayout({ data }) {
  const b = data.basics || {};
  const settings = data.settings || {};
  const showPhoto = settings.showPhoto ?? true;
  const showFullLinks = settings.showFullProjectLinks ?? true;

  return (
    <Page>
      <div className="flex items-center justify-between gap-8">
        <div className="min-w-0">
          <div className="text-[38px] font-extrabold leading-[1.05]">
            {b.fullName || "Your Name"}
          </div>
          <div className="mt-2 text-[15px] font-semibold text-slate-600">
            {b.title || "Your Title"}
          </div>
        </div>
        {showPhoto ? <Photo src={b.photoDataUrl} size={94} /> : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-600 leading-relaxed">
        <div className="break-all">{b.email || ""}</div>
        <div>{b.phone || ""}</div>
        <div>{b.location || ""}</div>
        <div className="break-all">{b.website || ""}</div>
      </div>

      {b.summary ? (
        <div className="mt-6 text-[14px] leading-relaxed text-slate-700 break-inside-avoid">
          {b.summary}
        </div>
      ) : null}

      <Divider />

      {data.experience?.length ? (
        <Section title="Experience">
          <Experience items={data.experience} />
        </Section>
      ) : null}

      <div className="grid grid-cols-12 gap-10">
        <div className="col-span-6">
          {data.projects?.length ? (
            <Section title="Projects">
              <Projects items={data.projects} showFullLinks={showFullLinks} />
            </Section>
          ) : null}
        </div>
        <div className="col-span-6">
          <Section title="Skills">
            <Chips items={data.skills || []} />
          </Section>
          {data.education?.length ? (
            <Section title="Education">
              <Education items={data.education} />
            </Section>
          ) : null}
        </div>
      </div>
    </Page>
  );
}

function CompactLayout({ data }) {
  const b = data.basics || {};
  const settings = data.settings || {};
  const showPhoto = settings.showPhoto ?? true;
  const showFullLinks = settings.showFullProjectLinks ?? true;

  return (
    <div className="h-full w-full rounded-2xl border border-slate-200 bg-white p-8 text-slate-900 shadow-xl">
      <div className="flex items-start justify-between gap-7">
        <div className="min-w-0">
          <div className="text-[26px] font-extrabold leading-tight">
            {b.fullName || "Your Name"}
          </div>
          <div className="mt-1.5 text-xs font-semibold text-slate-600">
            {b.title || "Your Title"}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-semibold text-slate-600 leading-relaxed">
            <div className="break-all">{b.email || ""}</div>
            <div>{b.phone || ""}</div>
            <div>{b.location || ""}</div>
            <div className="break-all">{b.website || ""}</div>
          </div>
        </div>
        {showPhoto ? <Photo src={b.photoDataUrl} size={74} /> : null}
      </div>

      {b.summary ? (
        <div className="mt-5 text-[13px] leading-relaxed text-slate-700 break-inside-avoid">
          {b.summary}
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-12 gap-7">
        <div className="col-span-4">
          <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            Skills
          </div>
          <div className="mt-3">
            <Chips items={data.skills || []} />
          </div>

          {data.education?.length ? (
            <div className="mt-7">
              <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Education
              </div>
              <div className="mt-3">
                <Education items={data.education} />
              </div>
            </div>
          ) : null}
        </div>

        <div className="col-span-8">
          {data.experience?.length ? (
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Experience
              </div>
              <div className="mt-3">
                <Experience items={data.experience} />
              </div>
            </div>
          ) : null}

          {data.projects?.length ? (
            <div className="mt-7">
              <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Projects
              </div>
              <div className="mt-3">
                <Projects items={data.projects} showFullLinks={showFullLinks} />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export const layoutOptions = layouts;