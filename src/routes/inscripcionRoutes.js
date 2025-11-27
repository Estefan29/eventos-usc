import express from "express";
import {
  crearInscripcion,
  obtenerInscripciones,
  obtenerInscripcionPorId,
  actualizarInscripcion,
  cancelarInscripcion,
  eliminarInscripcion,
  obtenerMisInscripciones
} from "../controllers/inscripcionController.js";
import { verificarToken } from "../middleware/auth.middleware.js";
import { esAdmin } from "../middleware/verificarRol.js";
import { validarInscripcion as validarInscripcionData } from "../middleware/validators.js";
import { validarInscripcion } from "../middleware/validarInscripcion.js";

const router = express.Router();

// ⚠️ IMPORTANTE: Las rutas más específicas deben ir PRIMERO

// Cualquier usuario autenticado puede ver sus inscripciones
router.get("/mis-inscripciones", verificarToken, obtenerMisInscripciones);

// Solo admin puede ver todas las inscripciones
router.get("/", verificarToken, esAdmin, obtenerInscripciones);

// Cualquier usuario autenticado puede inscribirse
router.post("/", verificarToken, validarInscripcionData, validarInscripcion, crearInscripcion);

// Cualquier usuario autenticado puede ver una inscripción específica
router.get("/:id", verificarToken, obtenerInscripcionPorId);

// Cualquier usuario autenticado puede cancelar su inscripción
router.put("/:id/cancelar", verificarToken, cancelarInscripcion);

// Solo admin puede actualizar y eliminar
router.put("/:id", verificarToken, esAdmin, actualizarInscripcion);
router.delete("/:id", verificarToken, esAdmin, eliminarInscripcion);

export default router;