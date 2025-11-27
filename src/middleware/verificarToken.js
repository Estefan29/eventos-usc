import jwt from "jsonwebtoken";
import { AppError } from "../utils/errorHandler.js";
import Usuario from "../models/usuarioModel.js";

export const verificarToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("No autorizado. Token no proporcionado.", 401);
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const usuario = await Usuario.findById(decoded.id);

    if (!usuario) {
      throw new AppError("Usuario no encontrado o token inválido.", 401);
    }

    req.usuario = usuario; // ← Guarda el usuario para las siguientes rutas
    next();
  } catch (error) {
    console.error("❌ Error de token:", error);
    next(new AppError("Token inválido o expirado.", 403));
  }
};
