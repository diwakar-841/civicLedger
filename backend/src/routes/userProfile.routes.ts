import { Router, Request, Response } from "express";
import { db } from "../../../database/index";
import { users } from "../../../database/schema/users";
import { eq } from "drizzle-orm";
import { AuthedRequest, requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.get(
  "/:userId",
  requireAuth,
  async (req: AuthedRequest, res: Response) => {
    try {
      const { userId } = req.params;

      if (req.user?.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const [user] = await db
        .select({
          id: users.id,
          fullName: users.fullName,
          email: users.email,
          phone: users.phone,
          dob: users.dob,
          bio: users.bio,
          qualifications: users.qualifications,
          experience: users.experience,
          profilePhotoUrl: users.profilePhotoUrl,
        })
        .from(users)
        .where(eq(users.id, userId));

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("[v0] Error fetching user profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  },
);

router.put(
  "/:userId/profile",
  requireAuth,
  async (req: AuthedRequest, res: Response) => {
    try {
      const { userId } = req.params;
      const { fullName, bio, qualifications, experience, profilePhotoUrl } =
        req.body ?? {};

      if (req.user?.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      if (
        typeof fullName !== "string" ||
        fullName.trim().length < 2 ||
        fullName.trim().length > 120
      ) {
        return res
          .status(400)
          .json({ error: "Full name must be between 2 and 120 characters" });
      }

      const optionalText = (value: unknown, maxLength: number) => {
        if (value == null || value === "") return null;
        if (typeof value !== "string" || value.length > maxLength)
          return undefined;
        return value.trim() || null;
      };
      const nextBio = optionalText(bio, 2000);
      const nextQualifications = optionalText(qualifications, 2000);
      const nextExperience = optionalText(experience, 2000);
      if (
        [nextBio, nextQualifications, nextExperience].some(
          (value) => value === undefined,
        )
      ) {
        return res
          .status(400)
          .json({ error: "One or more profile fields are too long" });
      }

      let nextProfilePhotoUrl: string | null = null;
      if (profilePhotoUrl != null && profilePhotoUrl !== "") {
        if (typeof profilePhotoUrl !== "string") {
          return res.status(400).json({ error: "Profile photo is invalid" });
        }
        const isDataImage = /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(
          profilePhotoUrl,
        );
        const isHttp = /^https?:\/\//i.test(profilePhotoUrl);
        if (!isDataImage && !isHttp) {
          return res
            .status(400)
            .json({ error: "Photo must be an image upload or an image URL" });
        }
        if (profilePhotoUrl.length > 700_000) {
          return res
            .status(413)
            .json({
              error: "Photo is too large. Please choose a smaller image.",
            });
        }
        nextProfilePhotoUrl = profilePhotoUrl.trim();
      }

      const result = await db
        .update(users)
        .set({
          fullName: fullName.trim(),
          bio: nextBio,
          qualifications: nextQualifications,
          experience: nextExperience,
          profilePhotoUrl: nextProfilePhotoUrl,
        })
        .where(eq(users.id, userId))
        .returning({
          id: users.id,
          fullName: users.fullName,
          email: users.email,
          phone: users.phone,
          dob: users.dob,
          bio: users.bio,
          qualifications: users.qualifications,
          experience: users.experience,
          profilePhotoUrl: users.profilePhotoUrl,
        });

      if (result.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(result[0]);
    } catch (error) {
      console.error("[v0] Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  },
);

export default router;
