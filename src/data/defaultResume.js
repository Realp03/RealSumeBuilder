export const defaultResume = {
  theme: "split",
  sections: ["summary", "experience", "projects", "education"],
  settings: {
    zoom: 1,
    showPhoto: true,
    showFullProjectLinks: true,
    fileBaseName: "",
    includeDateInFilename: false,
  },
  basics: {
    fullName: "Mark Daryl Pineda",
    title: "Web Developer",
    email: "you@email.com",
    phone: "+63 9XX XXX XXXX",
    location: "Quezon City, Philippines",
    website: "your-site.com",
    summary:
      "Motivated developer building clean, responsive web apps with modern UI and practical features.",
    photoDataUrl: "",
  },
  skills: ["React", "Tailwind", "PHP", "MySQL"],
  experience: [
    {
      company: "Company Name",
      role: "Intern / Developer",
      start: "2025",
      end: "2026",
      bullets: [
        "Built responsive UI components and improved user experience.",
        "Integrated APIs and optimized performance for key pages.",
      ],
    },
  ],
  education: [
    {
      school: "Quezon City University",
      degree: "BS Information Technology",
      start: "2022",
      end: "2026",
    },
  ],
  projects: [
    {
      name: "ReaPlaylist",
      link: "reaplaylist.vercel.app",
      desc: "Personal playlist web app with adaptive background and live lyrics.",
    },
  ],
};