import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DEFAULT_SECTION_VISIBILITY, SECTION_ORDER, type EditableSectionKey, type SectionKey } from "@/lib/sections";
import type { ProfileData, ResumeData, ResumeItemData, ResumeListItem } from "@/lib/types";
import { deleteProofDirectory, isProofSection } from "@/lib/proof-storage";

const DEFAULT_VISIBILITY = {
  birthDate: false,
  phone: true,
  email: true,
  address: true,
  website: true,
  github: true,
  linkedin: true,
};

type ResumeRecord = Prisma.ResumeGetPayload<{ include: { profile: true; items: true } }>;

function toDate(value?: string) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function serializeResume(record: ResumeRecord): ResumeData {
  const profile = record.profile;
  return {
    id: record.id,
    title: record.title,
    headline: record.headline,
    template: record.template,
    accentColor: record.accentColor,
    sectionOrder: record.sectionOrder as SectionKey[],
    sectionVisibility: record.sectionVisibility as Record<SectionKey, boolean>,
    showDeclaration: record.showDeclaration,
    declarationText: record.declarationText,
    version: record.version,
    lastPrintedAt: record.lastPrintedAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    profile: {
      name: profile?.name ?? "",
      englishName: profile?.englishName ?? "",
      birthDate: profile?.birthDate?.toISOString().slice(0, 10) ?? "",
      gender: profile?.gender ?? "",
      phone: profile?.phone ?? "",
      email: profile?.email ?? "",
      address: profile?.address ?? "",
      website: profile?.website ?? "",
      github: profile?.github ?? "",
      linkedin: profile?.linkedin ?? "",
      summary: profile?.summary ?? "",
      photoPath: profile?.photoPath ?? "",
      visibility: (profile?.visibility as Record<string, boolean> | undefined) ?? DEFAULT_VISIBILITY,
    },
    items: record.items
      .map((item) => ({
        id: item.id,
        section: item.section as ResumeItemData["section"],
        sortOrder: item.sortOrder,
        isVisible: item.isVisible,
        data: item.data as ResumeItemData["data"],
      }))
      .toSorted((a, b) => a.sortOrder - b.sortOrder),
  };
}

export async function listResumes(): Promise<ResumeListItem[]> {
  const records = await prisma.resume.findMany({
    include: { profile: true, items: { select: { section: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return records.map((resume) => {
    const completed = new Set(resume.items.map((item) => item.section));
    if (resume.profile?.name || resume.profile?.email) completed.add("profile");
    return {
      id: resume.id,
      title: resume.title,
      headline: resume.headline,
      updatedAt: resume.updatedAt.toISOString(),
      profileName: resume.profile?.name ?? "",
      completedSections: completed.size,
      totalSections: SECTION_ORDER.length,
    };
  });
}

export async function createResume(title: string) {
  const record = await prisma.resume.create({
    data: {
      title,
      sectionOrder: SECTION_ORDER as unknown as Prisma.InputJsonValue,
      sectionVisibility: DEFAULT_SECTION_VISIBILITY as unknown as Prisma.InputJsonValue,
      profile: {
        create: {
          visibility: DEFAULT_VISIBILITY as Prisma.InputJsonValue,
        },
      },
    },
    include: { profile: true, items: true },
  });
  return serializeResume(record);
}

export async function getResume(id: string) {
  const record = await prisma.resume.findUnique({
    where: { id },
    include: { profile: true, items: { orderBy: { sortOrder: "asc" } } },
  });
  return record ? serializeResume(record) : null;
}

type UpdateInput = {
  title?: string;
  headline?: string;
  accentColor?: string;
  sectionOrder?: string[];
  sectionVisibility?: Record<string, boolean>;
  showDeclaration?: boolean;
  declarationText?: string;
  version?: number;
  profile?: ProfileData;
};

export async function updateResume(id: string, input: UpdateInput) {
  const current = await prisma.resume.findUnique({ where: { id }, select: { version: true } });
  if (!current) return null;
  const expectedVersion = input.version ?? current.version;

  const rootData: Prisma.ResumeUpdateManyMutationInput = { version: { increment: 1 } };
  if (input.title !== undefined) rootData.title = input.title;
  if (input.headline !== undefined) rootData.headline = input.headline;
  if (input.accentColor !== undefined) rootData.accentColor = input.accentColor;
  if (input.sectionOrder !== undefined) rootData.sectionOrder = input.sectionOrder as Prisma.InputJsonValue;
  if (input.sectionVisibility !== undefined) rootData.sectionVisibility = input.sectionVisibility as Prisma.InputJsonValue;
  if (input.showDeclaration !== undefined) rootData.showDeclaration = input.showDeclaration;
  if (input.declarationText !== undefined) rootData.declarationText = input.declarationText;

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.resume.updateMany({ where: { id, version: expectedVersion }, data: rootData });
    if (result.count === 0) throw new Error("VERSION_CONFLICT");
    if (input.profile) {
      const profile = input.profile;
      await tx.profile.upsert({
        where: { resumeId: id },
        create: {
          resumeId: id,
          name: profile.name,
          englishName: profile.englishName,
          birthDate: toDate(profile.birthDate),
          gender: profile.gender,
          phone: profile.phone,
          email: profile.email,
          address: profile.address,
          website: profile.website,
          github: profile.github,
          linkedin: profile.linkedin,
          summary: profile.summary,
          photoPath: profile.photoPath,
          visibility: profile.visibility as Prisma.InputJsonValue,
        },
        update: {
          name: profile.name,
          englishName: profile.englishName,
          birthDate: toDate(profile.birthDate),
          gender: profile.gender,
          phone: profile.phone,
          email: profile.email,
          address: profile.address,
          website: profile.website,
          github: profile.github,
          linkedin: profile.linkedin,
          summary: profile.summary,
          photoPath: profile.photoPath,
          visibility: profile.visibility as Prisma.InputJsonValue,
        },
      });
    }
    return tx.resume.findUniqueOrThrow({ where: { id }, include: { profile: true, items: true } });
  });

  return serializeResume(updated);
}

export async function replaceSection(
  resumeId: string,
  section: EditableSectionKey,
  items: Array<{ id?: string; isVisible: boolean; data: ResumeItemData["data"] }>,
) {
  const exists = await prisma.resume.findUnique({ where: { id: resumeId }, select: { id: true } });
  if (!exists) return null;
  const removedProofItemIds = isProofSection(section)
    ? (await prisma.resumeItem.findMany({ where: { resumeId, section }, select: { id: true } }))
      .map((item) => item.id)
      .filter((id) => !items.some((item) => item.id === id))
    : [];
  await prisma.$transaction([
    prisma.resumeItem.deleteMany({ where: { resumeId, section } }),
    prisma.resumeItem.createMany({
      data: items.map((item, index) => ({
        ...(item.id ? { id: item.id } : {}),
        resumeId,
        section,
        sortOrder: index,
        isVisible: item.isVisible,
        data: item.data as Prisma.InputJsonValue,
      })),
    }),
    prisma.resume.update({ where: { id: resumeId }, data: { version: { increment: 1 } } }),
  ]);
  if (isProofSection(section)) {
    await Promise.all(removedProofItemIds.map((itemId) => deleteProofDirectory(resumeId, section, itemId)));
  }
  return getResume(resumeId);
}

export async function deleteResume(id: string) {
  const result = await prisma.resume.deleteMany({ where: { id } });
  return result.count > 0;
}

export async function duplicateResume(id: string) {
  const source = await prisma.resume.findUnique({ where: { id }, include: { profile: true, items: true } });
  if (!source) return null;
  const record = await prisma.resume.create({
    data: {
      title: `${source.title} 복사본`,
      headline: source.headline,
      template: source.template,
      accentColor: source.accentColor,
      sectionOrder: source.sectionOrder as Prisma.InputJsonValue,
      sectionVisibility: source.sectionVisibility as Prisma.InputJsonValue,
      showDeclaration: source.showDeclaration,
      declarationText: source.declarationText,
      profile: source.profile
        ? {
            create: {
              name: source.profile.name,
              englishName: source.profile.englishName,
              birthDate: source.profile.birthDate,
              gender: source.profile.gender,
              phone: source.profile.phone,
              email: source.profile.email,
              address: source.profile.address,
              website: source.profile.website,
              github: source.profile.github,
              linkedin: source.profile.linkedin,
              summary: source.profile.summary,
              photoPath: source.profile.photoPath,
              visibility: source.profile.visibility as Prisma.InputJsonValue,
            },
          }
        : undefined,
      items: {
        create: source.items.map((item) => ({
          section: item.section,
          sortOrder: item.sortOrder,
          isVisible: item.isVisible,
          data: item.data as Prisma.InputJsonValue,
        })),
      },
    },
    include: { profile: true, items: true },
  });
  return serializeResume(record);
}

export async function importResume(data: Omit<ResumeData, "id" | "createdAt" | "updatedAt" | "version" | "lastPrintedAt">) {
  const record = await prisma.resume.create({
    data: {
      title: `${data.title} (가져옴)`,
      headline: data.headline,
      accentColor: data.accentColor,
      sectionOrder: data.sectionOrder as Prisma.InputJsonValue,
      sectionVisibility: data.sectionVisibility as Prisma.InputJsonValue,
      showDeclaration: data.showDeclaration,
      declarationText: data.declarationText,
      profile: {
        create: {
          ...data.profile,
          photoPath: "",
          birthDate: toDate(data.profile.birthDate),
          visibility: data.profile.visibility as Prisma.InputJsonValue,
        },
      },
      items: {
        create: data.items.map((item) => ({
          section: item.section,
          sortOrder: item.sortOrder,
          isVisible: item.isVisible,
          data: item.data as Prisma.InputJsonValue,
        })),
      },
    },
    include: { profile: true, items: true },
  });
  return serializeResume(record);
}
