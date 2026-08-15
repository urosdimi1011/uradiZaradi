import { z } from "zod";
import { idSchema, timestampSchema } from "@/modules/shared/domain/primitives";

export const userRoleSchema = z.enum(["USER", "MAJSTOR", "ADMIN"]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const userStatusSchema = z.enum(["ACTIVE", "SUSPENDED", "BANNED"]);
export type UserStatus = z.infer<typeof userStatusSchema>;

/**
 * Nalog je odvojen od profila majstora namerno: jedan nalog kasnije može da drži
 * više profila (firma sa više majstora), i običan korisnik može da postane majstor
 * bez migracije naloga.
 */
export const userSchema = z.object({
  id: idSchema,
  email: z.email(),
  emailVerifiedAt: timestampSchema.nullable(),
  displayName: z.string().min(2).max(60),
  avatarUrl: z.url().nullable(),
  role: userRoleSchema,
  status: userStatusSchema,
  createdAt: timestampSchema,
});
export type User = z.infer<typeof userSchema>;
