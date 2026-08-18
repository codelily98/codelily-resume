import { z } from "zod";

const optionalText = z.string().max(5000).optional();

export const profileSchema = z.object({
  name: z.string().max(100),
  englishName: z.string().max(100),
  birthDate: z.string().max(10),
  gender: z.string().max(30),
  phone: z.string().max(40),
  email: z.union([z.literal(""), z.email()]),
  address: z.string().max(500),
  website: z.string().max(500),
  github: z.string().max(500),
  linkedin: z.string().max(500),
  summary: z.string().max(3000),
  photoPath: z.string().max(500),
  visibility: z.record(z.string(), z.boolean()),
});

export const resumeCreateSchema = z.object({
  title: z.string().trim().min(1, "이력서 제목을 입력해 주세요.").max(120),
});

export const resumePatchSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  headline: z.string().max(200).optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  sectionOrder: z.array(z.string()).optional(),
  sectionVisibility: z.record(z.string(), z.boolean()).optional(),
  showDeclaration: z.boolean().optional(),
  declarationText: optionalText,
  version: z.number().int().positive().optional(),
  profile: profileSchema.optional(),
});

export const proofFileSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  size: z.number().int().nonnegative().max(10 * 1024 * 1024),
  contentType: z.string().min(1).max(200),
});

export const sectionItemSchema = z.object({
  id: z.string().min(1).optional(),
  isVisible: z.boolean().default(true),
  data: z.record(z.string(), z.union([
    z.string().max(10000),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(proofFileSchema).max(5),
  ])),
});

export const sectionReplaceSchema = z.object({
  items: z.array(sectionItemSchema).max(100),
});

export const importSchema = z.object({
  schemaVersion: z.literal(1),
  resume: z.object({
    title: z.string().min(1).max(120),
    headline: z.string().max(200),
    accentColor: z.string(),
    sectionOrder: z.array(z.string()),
    sectionVisibility: z.record(z.string(), z.boolean()),
    showDeclaration: z.boolean(),
    declarationText: z.string(),
    profile: profileSchema,
    items: z.array(sectionItemSchema.extend({ section: z.string(), sortOrder: z.number().int() })),
  }),
  assets: z.object({
    photo: z.object({
      contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
      data: z.string().max(8_000_000),
    }).optional(),
    proofs: z.array(z.object({
      section: z.enum(["training", "certifications"]),
      sortOrder: z.number().int().nonnegative(),
      fileId: z.string().regex(/^[0-9a-f-]{36}$/i),
      data: z.string().max(15_000_000),
    })).max(500).optional(),
  }).optional(),
});
