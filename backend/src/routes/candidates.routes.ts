import { Router } from "express";

// Candidate reads are served via GET /api/elections/:id (embedded).
// This file is reserved for standalone candidate endpoints as the app grows.
const router = Router();

export default router;
