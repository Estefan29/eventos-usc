import express from 'express';
import {
  registrarUsuario,
  loginUsuario,
  obtenerPerfil,
  actualizarPerfil,
  cambiarPassword,
  recuperarPassword,     
  restablecerPassword,
  validarTokenRecuperacion,
} from '../controllers/authController.js';
import { verificarToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// ========================================
// 🔓 RUTAS PÚBLICAS (sin autenticación)
// ========================================

// Registro y login
router.post('/registro', registrarUsuario);
router.post('/login', loginUsuario);

// Recuperación de contraseña
router.post('/recuperar-password', recuperarPassword);

// ✅ ESTAS SON LAS RUTAS QUE FALTAN:
router.get('/validate-reset-token/:token', validarTokenRecuperacion);
router.post('/reset-password/:token', restablecerPassword);

// ========================================
// 🔒 RUTAS PROTEGIDAS (requieren token JWT)
// ========================================

router.get('/perfil', verificarToken, obtenerPerfil);
router.put('/perfil', verificarToken, actualizarPerfil);
router.put('/cambiar-password', verificarToken, cambiarPassword);

export default router;