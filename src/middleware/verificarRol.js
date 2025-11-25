import { AppError } from './errorHandler.js';

export const verificarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    console.log('\n🔐 === VERIFICANDO ROL ===');
    
    if (!req.usuario) {
      console.log('❌ No hay usuario en la request');
      throw new AppError('No autenticado', 401);
    }

    console.log('👤 Usuario:', req.usuario.nombre);
    console.log('🎭 Rol del usuario:', req.usuario.rol);
    console.log('📋 Roles permitidos:', rolesPermitidos);
    
    const tieneRol = rolesPermitidos.includes(req.usuario.rol);
    
    console.log('✅ ¿Tiene permiso?:', tieneRol);
    console.log('🔐 === FIN VERIFICACIÓN ===\n');

    if (!tieneRol) {
      throw new AppError(
        `Acceso denegado. Se requiere rol: ${rolesPermitidos.join(' o ')}`,
        403
      );
    }

    next();
  };
};

export const esAdmin = verificarRol('administrativo');
export const esProfesor = verificarRol('administrativo', 'profesor');
export const esEstudiante = verificarRol('administrativo', 'estudiante', 'profesor');

export const esPropietarioOAdmin = (req, res, next) => {
  console.log('\n🔐 === VERIFICANDO PROPIETARIO O ADMIN ===');
  
  const { id } = req.params;
  const usuarioId = req.usuario._id.toString();
  const esAdmin = req.usuario.rol === 'administrativo';

  console.log('🆔 ID del parámetro:', id);
  console.log('🆔 ID del usuario:', usuarioId);
  console.log('🎭 Rol del usuario:', req.usuario.rol);
  console.log('✅ ¿Es admin?:', esAdmin);
  console.log('🔐 === FIN VERIFICACIÓN ===\n');

  if (!esAdmin && usuarioId !== id) {
    throw new AppError('No tienes permiso para realizar esta acción', 403);
  }

  next();
};