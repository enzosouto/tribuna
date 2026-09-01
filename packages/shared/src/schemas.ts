import { z } from "zod";

const usernameRegex = /^[a-z0-9_]{3,20}$/;

export const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    username: z.string().trim().toLowerCase().regex(usernameRegex, "3-20 chars: a-z, 0-9, _"),
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(8).max(72),
    confirmPassword: z.string().min(8).max(72),
    avatarUrl: z.string().url().optional().nullable(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  username: z.string().trim().toLowerCase().regex(usernameRegex).optional(),
  bio: z.string().trim().max(280).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(72),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(72),
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const ratingSchema = z.object({
  matchId: z.string().uuid(),
  value: z
    .number()
    .min(0.5)
    .max(5)
    .refine((v) => Number.isInteger(v * 2), "Rating must be in 0.5 increments"),
});
export type RatingInput = z.infer<typeof ratingSchema>;

export const reviewCreateSchema = z.object({
  matchId: z.string().uuid(),
  body: z.string().trim().min(1).max(4000),
  rating: z
    .number()
    .min(0.5)
    .max(5)
    .refine((v) => Number.isInteger(v * 2), "Rating must be in 0.5 increments")
    .optional()
    .nullable(),
});
export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;

export const reviewUpdateSchema = z.object({
  body: z.string().trim().min(1).max(4000).optional(),
  rating: z
    .number()
    .min(0.5)
    .max(5)
    .refine((v) => Number.isInteger(v * 2), "Rating must be in 0.5 increments")
    .optional()
    .nullable(),
});
export type ReviewUpdateInput = z.infer<typeof reviewUpdateSchema>;

export const watchlistAddSchema = z.object({
  matchId: z.string().uuid(),
});
export type WatchlistAddInput = z.infer<typeof watchlistAddSchema>;

export const listCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000).optional().nullable(),
  coverUrl: z.string().url().optional().nullable(),
});
export type ListCreateInput = z.infer<typeof listCreateSchema>;

export const listUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  coverUrl: z.string().url().optional().nullable(),
});
export type ListUpdateInput = z.infer<typeof listUpdateSchema>;

export const listAddMatchSchema = z.object({
  matchId: z.string().uuid(),
});
export type ListAddMatchInput = z.infer<typeof listAddMatchSchema>;

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export type PaginationInput = z.infer<typeof paginationSchema>;
