import type { SectionKey } from "@/lib/sections";

export type ProfileData = {
  name: string;
  englishName: string;
  birthDate: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  github: string;
  linkedin: string;
  summary: string;
  photoPath: string;
  visibility: Record<string, boolean>;
};

export type ProofFile = {
  id: string;
  name: string;
  size: number;
  contentType: string;
};

export type ResumeItemValue = string | number | boolean | null | ProofFile[];

export type ResumeItemData = {
  id: string;
  section: Exclude<SectionKey, "profile">;
  sortOrder: number;
  isVisible: boolean;
  data: Record<string, ResumeItemValue>;
};

export type ResumeData = {
  id: string;
  title: string;
  headline: string;
  template: string;
  accentColor: string;
  sectionOrder: SectionKey[];
  sectionVisibility: Record<SectionKey, boolean>;
  showDeclaration: boolean;
  declarationText: string;
  version: number;
  lastPrintedAt: string | null;
  createdAt: string;
  updatedAt: string;
  profile: ProfileData;
  items: ResumeItemData[];
};

export type ResumeListItem = Pick<ResumeData, "id" | "title" | "headline" | "updatedAt"> & {
  profileName: string;
  completedSections: number;
  totalSections: number;
};
