import express from 'express';
import {
  registrarUsuario,
  loginUsuario,
  obtenerPerfil,
  actualizarPerfil,
  cambiarPassword,
  recuperarPassword,     
  restablecerPassword,
  //promoverAAdministrativo,
  //cambiarRolUsuario
} from '../controllers/authController.js';
import { verificarToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Rutas públicas
router.post('/registro', registrarUsuario);
router.post('/login', loginUsuario);
router.post('/recuperar-password', recuperarPassword);         
router.post('/restablecer-password', restablecerPassword); 

// Rutas protegidas
router.get('/perfil', verificarToken, obtenerPerfil);
router.put('/perfil', verificarToken, actualizarPerfil);
router.put('/cambiar-password', verificarToken, cambiarPassword);

//router.put('/usuarios/:usuarioId/promover', protegerRuta, promoverAAdministrativo);
//router.put('/usuarios/:usuarioId/cambiar-rol', protegerRuta, cambiarRolUsuario);

export default router;  