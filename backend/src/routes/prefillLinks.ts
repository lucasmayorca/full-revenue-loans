import { Router } from "express";
import * as ctrl from "../controllers/prefillLinks.controller";

const router = Router();

// Admin: crear links en bulk desde CSV
router.post("/prefill-links/bulk", ctrl.createBulk);

// Admin: listar todos los links generados
router.get("/prefill-links", ctrl.list);

// Público: frontend lo llama al abrir /offers?t=xxx
router.get("/prefill/:token", ctrl.getPrefill);

export default router;
