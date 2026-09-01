import { pgTable, uuid, text, boolean, timestamp, pgEnum, integer, jsonb, date } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["voter", "admin"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),

  aadhaarHash: text("aadhaar_hash").unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("voter"),

  isVerified: boolean("is_verified").notNull().default(false),
  emailVerified: boolean("email_verified").notNull().default(false),
  phoneVerified: boolean("phone_verified").notNull().default(false),
  passwordSetAt: timestamp("password_set_at", { withTimezone: true }),
  registrationExpiresAt: timestamp("registration_expires_at", { withTimezone: true }),
  walletAddress: text("wallet_address").unique(),
  walletNonce: text("wallet_nonce"),
  encryptedPrivateKey: text("encrypted_private_key"),

  dob: date("dob"),

  phone: text("phone"),

  bio: text("bio"),
  qualifications: text("qualifications"),
  experience: text("experience"),
  profilePhotoUrl: text("profile_photo_url"),

  failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  lastLoginIp: text("last_login_ip"),

  isTwoFactorEnabled: boolean("is_two_factor_enabled").notNull().default(false),
  twoFactorSecretEncrypted: text("two_factor_secret_encrypted"),
  twoFactorRecoveryCodesHash: jsonb("two_factor_recovery_codes_hash").$type(),

  emailVerificationMethod: text("email_verification_method").notNull().default("otp"),
  emailVerificationTokenHash: text("email_verification_token_hash"),
  emailVerificationExpiresAt: timestamp("email_verification_expires_at", { withTimezone: true }),
  emailVerificationOtpHash: text("email_verification_otp_hash"),
  emailVerificationOtpExpiresAt: timestamp("email_verification_otp_expires_at", { withTimezone: true }),

  passwordResetTokenHash: text("password_reset_token_hash"),
  passwordResetExpiresAt: timestamp("password_reset_expires_at", { withTimezone: true }),

  phoneVerificationOtpHash: text("phone_verification_otp_hash"),
  phoneVerificationOtpExpiresAt: timestamp("phone_verification_otp_expires_at", { withTimezone: true }),

  pinHash: text("pin_hash"),
  votingPinHash: text("voting_pin_hash"),
  loginPinHash: text("login_pin_hash"),
  isBiometricRegistered: boolean("is_biometric_registered").notNull().default(false),
  webauthnChallenge: text("webauthn_challenge"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});