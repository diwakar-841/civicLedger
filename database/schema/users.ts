import { pgTable, uuid, text, boolean, timestamp, pgEnum, integer, jsonb, date } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["voter", "admin"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  // Raw Aadhaar number is NEVER stored. Legacy column retained for existing
  // accounts, but new registrations no longer collect Aadhaar at sign-up.
  aadhaarHash: text("aadhaar_hash").unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("voter"),
  // isVerified means the complete flow is finished (email + password + phone).
  isVerified: boolean("is_verified").notNull().default(false),
  emailVerified: boolean("email_verified").notNull().default(false),
  phoneVerified: boolean("phone_verified").notNull().default(false),
  passwordSetAt: timestamp("password_set_at", { withTimezone: true }),
  registrationExpiresAt: timestamp("registration_expires_at", { withTimezone: true }),
  walletAddress: text("wallet_address").unique(),
  walletNonce: text("wallet_nonce"),
  encryptedPrivateKey: text("encrypted_private_key"),

  // --- Date of birth (stored for KYC identity check) ---
  dob: date("dob"), // YYYY-MM-DD string

  // --- Phone number (unique identity factor, stored for reference) ---
  phone: text("phone"),

  // --- User Profile Fields ---
  bio: text("bio"),
  qualifications: text("qualifications"),
  experience: text("experience"),
  profilePhotoUrl: text("profile_photo_url"),

  // --- Account lockout / brute-force defense ---
  failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  lastLoginIp: text("last_login_ip"),

  // --- Two-factor authentication (TOTP) ---
  isTwoFactorEnabled: boolean("is_two_factor_enabled").notNull().default(false),
  twoFactorSecretEncrypted: text("two_factor_secret_encrypted"),
  twoFactorRecoveryCodesHash: jsonb("two_factor_recovery_codes_hash").$type<string[]>(),

  // --- Email verification ---
  emailVerificationMethod: text("email_verification_method").notNull().default("otp"),
  emailVerificationTokenHash: text("email_verification_token_hash"),
  emailVerificationExpiresAt: timestamp("email_verification_expires_at", { withTimezone: true }),
  emailVerificationOtpHash: text("email_verification_otp_hash"),
  emailVerificationOtpExpiresAt: timestamp("email_verification_otp_expires_at", { withTimezone: true }),

  // --- Password reset ---
  passwordResetTokenHash: text("password_reset_token_hash"),
  passwordResetExpiresAt: timestamp("password_reset_expires_at", { withTimezone: true }),

  // --- Phone verification OTP (sent after the first successful login) ---
  phoneVerificationOtpHash: text("phone_verification_otp_hash"),
  phoneVerificationOtpExpiresAt: timestamp("phone_verification_otp_expires_at", { withTimezone: true }),

  // --- Biometric / voting auth ---
  /** @deprecated use votingPinHash */
  pinHash: text("pin_hash"),                                          // kept for backward compat — alias for votingPinHash
  votingPinHash: text("voting_pin_hash"),                            // bcrypt-hashed 6-digit PIN for vote auth
  loginPinHash: text("login_pin_hash"),                              // bcrypt-hashed 6-digit PIN for login (alternative to biometric)
  isBiometricRegistered: boolean("is_biometric_registered").notNull().default(false),
  webauthnChallenge: text("webauthn_challenge"),                      // transient: current WebAuthn challenge

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
