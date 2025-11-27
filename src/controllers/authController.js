import Usuario from '../models/usuario.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../middleware/errorHandler.js';
import crypto from 'node:crypto';
import nodemailer from 'nodemailer';

const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_usc_2024';

const generarToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });
};

export const registrarUsuario = async (req, res, next) => {
  try {
    const { nombre, correo, password, rol } = req.body;

    if (!nombre || !correo || !password) {
      throw new AppError('Todos los campos son obligatorios', 400);
    }

    const usuarioExiste = await Usuario.findOne({ correo });
    if (usuarioExiste) {
      throw new AppError('El correo ya está registrado', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const nuevoUsuario = new Usuario({
      nombre,
      correo,
      password: passwordHash,
      rol: rol || 'estudiante',
    });

    await nuevoUsuario.save();

    const token = generarToken(nuevoUsuario._id);

    res.status(201).json({
      status: 'success',
      mensaje: '✅ Usuario registrado exitosamente',
      token,
      usuario: {
        id: nuevoUsuario._id,
        nombre: nuevoUsuario.nombre,
        correo: nuevoUsuario.correo,
        rol: nuevoUsuario.rol
      }
    });
  } catch (error) {
    next(error);
  }
};

export const loginUsuario = async (req, res, next) => {
  try {
    const { correo, password } = req.body;

    console.log('📧 Login attempt:', { correo, password: password ? '***' : undefined });

    if (!correo || !password) {
      throw new AppError('Correo y contraseña son obligatorios', 400);
    }

    const usuario = await Usuario.findOne({ correo }).select('+password');

    console.log("🟦 Usuario encontrado:", usuario);
    console.log("🟩 usuario.password existe?:", usuario?.password);
    console.log("🟧 Keys del usuario:", Object.keys(usuario.toObject()));

    if (!usuario) {
      throw new AppError('Credenciales inválidas', 401);
    }

    console.log('🔐 Comparando passwords...');
    console.log('Hash guardado en BD:', usuario.password);

    const passwordValida = await bcrypt.compare(password, usuario.password);

    console.log('¿Password válida?:', passwordValida);

    if (!passwordValida) {
      throw new AppError('Credenciales inválidas', 401);
    }

    const token = generarToken(usuario._id);

    res.json({
      status: 'success',
      mensaje: '✅ Login exitoso',
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol
      }
    });

  } catch (error) {
    console.error('❌ Error en login:', error);
    next(error);
  }
};

export const obtenerPerfil = async (req, res) => {
  res.json({
    status: 'success',
    usuario: {
      id: req.usuario._id,
      nombre: req.usuario.nombre,
      correo: req.usuario.correo,
      rol: req.usuario.rol,
      telefono: req.usuario.telefono,
      carrera: req.usuario.carrera
    }
  });
};

export const actualizarPerfil = async (req, res, next) => {
  try {
    const { nombre, telefono, carrera } = req.body;
    
    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      req.usuario._id,
      { nombre, telefono, carrera },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      status: 'success',
      mensaje: '✅ Perfil actualizado',
      usuario: usuarioActualizado
    });
  } catch (error) {
    next(error);
  }
};

export const cambiarPassword = async (req, res) => {
  try {
    const { passwordActual, passwordNuevo } = req.body;
    const usuarioId = req.usuario.id;

    if (!passwordActual || !passwordNuevo) {
      return res.status(400).json({
        mensaje: 'Debes proporcionar la contraseña actual y la nueva'
      });
    }

    if (passwordNuevo.length < 6) {
      return res.status(400).json({
        mensaje: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }

    const usuario = await Usuario.findById(usuarioId).select('+password');

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    const passwordValido = await bcrypt.compare(passwordActual, usuario.password);

    if (!passwordValido) {
      return res.status(401).json({
        mensaje: 'La contraseña actual es incorrecta'
      });
    }

    const esMismaPassword = await bcrypt.compare(passwordNuevo, usuario.password);
    if (esMismaPassword) {
      return res.status(400).json({
        mensaje: 'La nueva contraseña debe ser diferente a la actual'
      });
    }

    const salt = await bcrypt.genSalt(10);
    usuario.password = await bcrypt.hash(passwordNuevo, salt);

    await usuario.save();

    res.json({
      mensaje: '¡Contraseña actualizada exitosamente!'
    });

  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({
      mensaje: 'Error al cambiar la contraseña',
      error: error.message
    });
  }
};

export const recuperarPassword = async (req, res) => {
  try {
    console.log('🟢 Iniciando recuperarPassword...');
    console.log('📦 req.body:', req.body);
    
    const { correo } = req.body;
    
    console.log('📧 EMAIL_USER:', process.env.EMAIL_USER);
    console.log('🔑 EMAIL_PASSWORD exists:', !!process.env.EMAIL_PASSWORD);
    console.log('🌐 FRONTEND_URL:', process.env.FRONTEND_URL);
    console.log('📨 Correo recibido:', correo);

    if (!correo) {
      console.log('❌ No se proporcionó correo');
      return res.status(400).json({
        mensaje: 'Por favor proporciona un correo electrónico'
      });
    }

    console.log('🔍 Buscando usuario con correo:', correo.toLowerCase());
    const usuario = await Usuario.findOne({ correo: correo.toLowerCase() });
    
    if (!usuario) {
      console.log('⚠️ Usuario no encontrado, pero devolviendo mensaje genérico');
      return res.status(200).json({
        mensaje: 'Si el correo existe, recibirás un enlace de recuperación'
      });
    }

    console.log('✅ Usuario encontrado:', usuario.nombre);

    // Generar token con crypto
    const tokenRecuperacion = crypto.randomBytes(32).toString('hex');
    const expiracion = Date.now() + 3600000; // 1 hora

    console.log('🔐 Token generado:', tokenRecuperacion.substring(0, 10) + '...');

    usuario.tokenRecuperacion = tokenRecuperacion;
    usuario.tokenRecuperacionExpira = expiracion;
    await usuario.save();

    console.log('💾 Token guardado en base de datos');
   
    const enlaceRecuperacion = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${tokenRecuperacion}`;
    
    console.log('🔗 Enlace de recuperación generado:', enlaceRecuperacion);

    console.log('📮 Configurando transportador de correo...');
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    console.log('📤 Enviando correo...');
    
    await transporter.sendMail({
      from: `"Eventos USC" <${process.env.EMAIL_USER}>`,
      to: correo,
      subject: '🔒 Recuperación de Contraseña - Eventos USC',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); 
                     color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #2563eb; color: white; 
                     padding: 15px 30px; text-decoration: none; border-radius: 8px; 
                     font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🔐 Recuperación de Contraseña</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${usuario.nombre}</strong>,</p>
              <p>Recibimos una solicitud para restablecer tu contraseña en <strong>Eventos USC</strong>.</p>
              <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
              
              <div style="text-align: center;">
                <a href="${enlaceRecuperacion}" class="button">
                  Restablecer Contraseña
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                ⏰ Este enlace expirará en <strong>1 hora</strong>.
              </p>
              
              <p style="color: #6b7280; font-size: 14px;">
                Si no solicitaste este cambio, puedes ignorar este correo de forma segura.
              </p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 12px; color: #6b7280;">
                  O copia y pega este enlace en tu navegador:<br>
                  <a href="${enlaceRecuperacion}" style="color: #2563eb; word-break: break-all;">
                    ${enlaceRecuperacion}
                  </a>
                </p>
              </div>
            </div>
            <div class="footer">
              <p>Este correo fue enviado por Eventos USC</p>
              <p>© ${new Date().getFullYear()} Universidad Santiago de Cali</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    console.log('✅ Correo de recuperación enviado a:', correo);

    res.status(200).json({
      mensaje: 'Correo de recuperación enviado exitosamente',
      success: true
    });

  } catch (error) {
    console.error('❌ Error en recuperar-password:', error);
    res.status(500).json({
      mensaje: 'Error al enviar correo de recuperación',
      error: error.message
    });
  }
};

// ✅ CORREGIDO: Validar token (GET)
export const validarTokenRecuperacion = async (req, res) => {
  try {
    const { token } = req.params;
    console.log('🔍 Validando token:', token);

    if (!token) {
      return res.status(400).json({
        mensaje: 'Token no proporcionado',
        valido: false
      });
    }

    const usuario = await Usuario.findOne({
      tokenRecuperacion: token,
      tokenRecuperacionExpira: { $gt: Date.now() }
    });

    if (!usuario) {
      console.log('❌ Token inválido o expirado');
      return res.status(400).json({
        mensaje: 'El enlace ha expirado o no es válido',
        valido: false
      });
    }

    console.log('✅ Token válido para usuario:', usuario.correo);
    res.status(200).json({
      mensaje: 'Token válido',
      valido: true
    });

  } catch (error) {
    console.error('❌ Error al validar token:', error);
    res.status(500).json({
      mensaje: 'Error al validar token',
      valido: false
    });
  }
};

// ✅ CORREGIDO: Restablecer password (POST)
export const restablecerPassword = async (req, res) => {
  try {
    const { token } = req.params; // ✅ Ahora tomamos token de params
    const { password } = req.body; // ✅ Cambiado de nuevoPassword a password
    
    console.log('🔄 Restableciendo password...');
    console.log('Token:', token);
    console.log('Password recibido:', password ? '***' : undefined);

    if (!token || !password) {
      return res.status(400).json({
        mensaje: 'Token y nueva contraseña son requeridos'
      });
    }

    const usuario = await Usuario.findOne({
      tokenRecuperacion: token,
      tokenRecuperacionExpira: { $gt: Date.now() }
    });

    if (!usuario) {
      console.log('❌ Token inválido o expirado');
      return res.status(400).json({
        mensaje: 'El enlace ha expirado o no es válido. Solicita un nuevo enlace de recuperación.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        mensaje: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Hashear nueva contraseña
    const salt = await bcrypt.genSalt(10);
    usuario.password = await bcrypt.hash(password, salt);

    // Limpiar tokens
    usuario.tokenRecuperacion = undefined;
    usuario.tokenRecuperacionExpira = undefined;

    await usuario.save();

    console.log('✅ Contraseña restablecida para:', usuario.correo);

    res.status(200).json({
      mensaje: 'Contraseña actualizada exitosamente',
      success: true
    });

  } catch (error) {
    console.error('❌ Error en restablecer-password:', error);
    res.status(500).json({
      mensaje: 'Error al restablecer contraseña',
      error: error.message
    });
  }
};