export const resumeKeys = {
  all: ["resumes"] as const,
  lists: () => [...resumeKeys.all, "list"] as const,
  detail: (id: string) => [...resumeKeys.all, "detail", id] as const,
  section: (id: string, section: string) => [...resumeKeys.detail(id), "section", section] as const,
};
