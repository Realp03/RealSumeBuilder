import React from "react";

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function cropSquareCenter(dataUrl, size = 512) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(img.width, img.height);
      const sx = (img.width - s) / 2;
      const sy = (img.height - s) / 2;
      const c = document.createElement("canvas");
      c.width = size;
      c.height = size;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, sx, sy, s, s, 0, 0, size, size);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function titleCaseSkill(s) {
  return String(s || "")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function ResumeForm({ value, onChange }) {
  const setBasics = (k, v) =>
    onChange({ ...value, basics: { ...value.basics, [k]: v } });

  const setSettings = (k, v) =>
    onChange({ ...value, settings: { ...(value.settings || {}), [k]: v } });

  const setSkillsFromText = (text) => {
    const arr = String(text || "")
      .split(",")
      .map((s) => titleCaseSkill(s))
      .filter(Boolean);
    const deduped = Array.from(new Set(arr));
    onChange({ ...value, skills: deduped });
  };

  const skillsText = (value.skills || []).join(", ");

  const setExperience = (idx, patch) => {
    const next = [...(value.experience || [])];
    next[idx] = { ...next[idx], ...patch };
    onChange({ ...value, experience: next });
  };

  const setExpBullet = (idx, bIdx, v) => {
    const next = [...(value.experience || [])];
    const bullets = [...(next[idx].bullets || [])];
    bullets[bIdx] = v;
    next[idx] = { ...next[idx], bullets };
    onChange({ ...value, experience: next });
  };

  const addExperience = () => {
    const next = [
      ...(value.experience || []),
      { company: "", role: "", start: "", end: "", bullets: [""] },
    ];
    onChange({ ...value, experience: next });
  };

  const removeExperience = (idx) => {
    const next = [...(value.experience || [])];
    next.splice(idx, 1);
    onChange({ ...value, experience: next });
  };

  const addExpBullet = (idx) => {
    const next = [...(value.experience || [])];
    const bullets = [...(next[idx].bullets || []), ""];
    next[idx] = { ...next[idx], bullets };
    onChange({ ...value, experience: next });
  };

  const removeExpBullet = (idx, bIdx) => {
    const next = [...(value.experience || [])];
    const bullets = [...(next[idx].bullets || [])];
    bullets.splice(bIdx, 1);
    next[idx] = { ...next[idx], bullets: bullets.length ? bullets : [""] };
    onChange({ ...value, experience: next });
  };

  const setEducation = (idx, patch) => {
    const next = [...(value.education || [])];
    next[idx] = { ...next[idx], ...patch };
    onChange({ ...value, education: next });
  };

  const addEducation = () => {
    const next = [
      ...(value.education || []),
      { school: "", degree: "", start: "", end: "" },
    ];
    onChange({ ...value, education: next });
  };

  const removeEducation = (idx) => {
    const next = [...(value.education || [])];
    next.splice(idx, 1);
    onChange({ ...value, education: next });
  };

  const setProjects = (idx, patch) => {
    const next = [...(value.projects || [])];
    next[idx] = { ...next[idx], ...patch };
    onChange({ ...value, projects: next });
  };

  const addProject = () => {
    const next = [...(value.projects || []), { name: "", link: "", desc: "" }];
    onChange({ ...value, projects: next });
  };

  const removeProject = (idx) => {
    const next = [...(value.projects || [])];
    next.splice(idx, 1);
    onChange({ ...value, projects: next });
  };

  const onPickPhoto = async (file) => {
    if (!file) return;
    const raw = await readAsDataURL(file);
    const cropped = await cropSquareCenter(raw, 512);
    setBasics("photoDataUrl", cropped);
  };

  const clearPhoto = () => setBasics("photoDataUrl", "");

  const resetBasics = () =>
    onChange({
      ...value,
      basics: {
        fullName: "",
        title: "",
        email: "",
        phone: "",
        location: "",
        website: "",
        summary: "",
        photoDataUrl: value.basics?.photoDataUrl || "",
      },
    });

  const resetSkills = () => onChange({ ...value, skills: [] });
  const resetExperience = () => onChange({ ...value, experience: [] });
  const resetEducation = () => onChange({ ...value, education: [] });
  const resetProjects = () => onChange({ ...value, projects: [] });

  const sections = Array.isArray(value.sections) && value.sections.length
    ? value.sections
    : ["summary", "experience", "projects", "education"];

  const moveSection = (from, to) => {
    if (to < 0 || to >= sections.length) return;
    const next = [...sections];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    onChange({ ...value, sections: next });
  };

  const labelMap = {
    summary: "Summary",
    experience: "Experience",
    projects: "Projects",
    education: "Education",
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-white/90">Basics</div>
          <div className="flex items-center gap-2">
            <label className="cursor-pointer rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 hover:bg-white/15">
              Upload 1x1 Photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPickPhoto(e.target.files?.[0])}
              />
            </label>
            <button
              onClick={clearPhoto}
              className="rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/15"
              type="button"
            >
              Remove
            </button>
            <button
              onClick={resetBasics}
              className="rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/15"
              type="button"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3">
          <Input
            label="Full name"
            value={value.basics.fullName}
            onChange={(v) => setBasics("fullName", v)}
          />
          <Input
            label="Title"
            value={value.basics.title}
            onChange={(v) => setBasics("title", v)}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Email"
              value={value.basics.email}
              onChange={(v) => setBasics("email", v)}
            />
            <Input
              label="Phone"
              value={value.basics.phone}
              onChange={(v) => setBasics("phone", v)}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Location"
              value={value.basics.location}
              onChange={(v) => setBasics("location", v)}
            />
            <Input
              label="Website"
              value={value.basics.website}
              onChange={(v) => setBasics("website", v)}
            />
          </div>
          <TextArea
            label="Summary"
            value={value.basics.summary}
            onChange={(v) => setBasics("summary", v)}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSettings("showPhoto", !((value.settings?.showPhoto ?? true)))}
            className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white/90 hover:bg-white/15"
            type="button"
          >
            {value.settings?.showPhoto ?? true ? "Show Photo: ON" : "Show Photo: OFF"}
          </button>

          <button
            onClick={() =>
              setSettings(
                "showFullProjectLinks",
                !((value.settings?.showFullProjectLinks ?? true))
              )
            }
            className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white/90 hover:bg-white/15"
            type="button"
          >
            {value.settings?.showFullProjectLinks ?? true ? "Links: FULL" : "Links: SHORT"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-white/90">Section Order</div>
          <button
            onClick={() =>
              onChange({
                ...value,
                sections: ["summary", "experience", "projects", "education"],
              })
            }
            className="rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 hover:bg-white/15"
            type="button"
          >
            Reset Order
          </button>
        </div>

        <div className="mt-3 space-y-2">
          {sections.map((k, i) => (
            <div
              key={k}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-3 py-2"
            >
              <div className="text-sm font-semibold text-white/85">
                {labelMap[k] || k}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => moveSection(i, i - 1)}
                  className="rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/85 hover:bg-white/15"
                  type="button"
                >
                  Up
                </button>
                <button
                  onClick={() => moveSection(i, i + 1)}
                  className="rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/85 hover:bg-white/15"
                  type="button"
                >
                  Down
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-white/90">Skills</div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-white/50">comma separated</div>
            <button
              onClick={resetSkills}
              className="rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/85 hover:bg-white/15"
              type="button"
            >
              Reset
            </button>
          </div>
        </div>
        <div className="mt-3">
          <TextArea
            label="Skills"
            value={skillsText}
            onChange={(v) => setSkillsFromText(v)}
            rows={3}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-white/90">Experience</div>
          <div className="flex items-center gap-2">
            <button
              onClick={addExperience}
              className="rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 hover:bg-white/15"
              type="button"
            >
              Add
            </button>
            <button
              onClick={resetExperience}
              className="rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/85 hover:bg-white/15"
              type="button"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="mt-3 space-y-4">
          {(value.experience || []).map((ex, idx) => (
            <div key={idx} className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold text-white/80">Item {idx + 1}</div>
                <button
                  onClick={() => removeExperience(idx)}
                  className="rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/15"
                  type="button"
                >
                  Remove
                </button>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input label="Company" value={ex.company} onChange={(v) => setExperience(idx, { company: v })} />
                <Input label="Role" value={ex.role} onChange={(v) => setExperience(idx, { role: v })} />
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input label="Start" value={ex.start} onChange={(v) => setExperience(idx, { start: v })} />
                <Input label="End" value={ex.end} onChange={(v) => setExperience(idx, { end: v })} />
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-white/70">Bullets</div>
                  <button
                    onClick={() => addExpBullet(idx)}
                    className="rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/15"
                    type="button"
                  >
                    Add bullet
                  </button>
                </div>

                <div className="mt-2 space-y-2">
                  {(ex.bullets || [""]).map((b, bIdx) => (
                    <div key={bIdx} className="flex gap-2">
                      <input
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 outline-none placeholder:text-white/30 focus:border-white/20"
                        value={b}
                        onChange={(e) => setExpBullet(idx, bIdx, e.target.value)}
                        placeholder="Achievement / responsibility"
                      />
                      <button
                        onClick={() => removeExpBullet(idx, bIdx)}
                        className="shrink-0 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/15"
                        type="button"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-white/90">Education</div>
          <div className="flex items-center gap-2">
            <button
              onClick={addEducation}
              className="rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 hover:bg-white/15"
              type="button"
            >
              Add
            </button>
            <button
              onClick={resetEducation}
              className="rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/85 hover:bg-white/15"
              type="button"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="mt-3 space-y-4">
          {(value.education || []).map((ed, idx) => (
            <div key={idx} className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold text-white/80">Item {idx + 1}</div>
                <button
                  onClick={() => removeEducation(idx)}
                  className="rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/15"
                  type="button"
                >
                  Remove
                </button>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3">
                <Input label="School" value={ed.school} onChange={(v) => setEducation(idx, { school: v })} />
                <Input label="Degree" value={ed.degree} onChange={(v) => setEducation(idx, { degree: v })} />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input label="Start" value={ed.start} onChange={(v) => setEducation(idx, { start: v })} />
                  <Input label="End" value={ed.end} onChange={(v) => setEducation(idx, { end: v })} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-white/90">Projects</div>
          <div className="flex items-center gap-2">
            <button
              onClick={addProject}
              className="rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 hover:bg-white/15"
              type="button"
            >
              Add
            </button>
            <button
              onClick={resetProjects}
              className="rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/85 hover:bg-white/15"
              type="button"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="mt-3 space-y-4">
          {(value.projects || []).map((p, idx) => (
            <div key={idx} className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold text-white/80">Item {idx + 1}</div>
                <button
                  onClick={() => removeProject(idx)}
                  className="rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/15"
                  type="button"
                >
                  Remove
                </button>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3">
                <Input label="Name" value={p.name} onChange={(v) => setProjects(idx, { name: v })} />
                <Input label="Link" value={p.link} onChange={(v) => setProjects(idx, { link: v })} />
                <TextArea label="Description" value={p.desc} onChange={(v) => setProjects(idx, { desc: v })} rows={3} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Input({ label, value, onChange }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-semibold text-white/60">{label}</div>
      <input
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 outline-none placeholder:text-white/30 focus:border-white/20"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
      />
    </label>
  );
}

function TextArea({ label, value, onChange, rows = 4 }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-semibold text-white/60">{label}</div>
      <textarea
        className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 outline-none placeholder:text-white/30 focus:border-white/20"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={label}
      />
    </label>
  );
}