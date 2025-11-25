import jwt from 'jsonwebtoken';
import Usuario from '../models/usuario.model.js';
import { AppError } from './errorHandler.js';

const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_usc_2024';

export const verificarToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Token no proporcionado', 401);
    }

    const token = authHeader.split(' ')[1];
    console.log('🔑 Token recibido:', token.substring(0, 20) + '...');
    
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('📋 Token decodificado:', decoded);
    
    const usuario = await Usuario.findById(decoded.id).select('-contraseña');
    console.log('👤 Usuario encontrado:', usuario);
    
    if (!usuario) {
      throw new AppError('Usuario no encontrado', 401);
    }

    if (!usuario.activo) {
      throw new AppError('Usuario inactivo', 401);
    }

    console.log('✅ Usuario autenticado:', {
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol
    });

    req.usuario = usuario;
    next();
  } catch (error) {
    console.error('❌ Error en verificarToken:', error);
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Token inválido', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expirado', 401));
    }
    next(error);
  }
};

export const verificarTokenOpcional = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const usuario = await Usuario.findById(decoded.id).select('-contraseña');
    
    if (usuario && usuario.activo) {
      req.usuario = usuario;
    }
    
    next();
  } catch (error) {
    next();
  }
};