import Evento from '../models/evento.model.js';
import conectarMySQL from '../config/db.mysql.js';
import { AppError } from './errorHandler.js';

export const validarInscripcion = async (req, res, next) => {
  try {
    console.log('\n === VALIDANDO INSCRIPCIÓN ===');
    console.log('Body recibido:', req.body);
    console.log('Usuario autenticado:', req.usuario);
    
    const id_usuario_mongo = req.usuario._id.toString(); // SIEMPRE viene del token
    const { id_evento_mongo } = req.body;


    // 1. Verificar que el evento existe
    const evento = await Evento.findById(id_evento_mongo);
    if (!evento) {
      throw new AppError('El evento no existe', 404);
    }

    console.log(' Evento encontrado:', evento.titulo);

    // 2. Verificar que el evento no haya pasado
    const fechaEvento = new Date(evento.fecha);
    const hoy = new Date();
    
    if (fechaEvento < hoy) {
      throw new AppError('No puedes inscribirte a un evento que ya pasó', 400);
    }

    console.log(' Evento no ha pasado');
    // 3. Verificar cupos disponibles
    const db = await conectarMySQL();
    const [inscripciones] = await db.query(
      'SELECT COUNT(*) as total FROM inscripciones WHERE id_evento_mongo = ? AND estado != "cancelada"',
      [id_evento_mongo]
    );

    const inscritosActuales = inscripciones[0].total;
    
    console.log(' Inscritos actuales:', inscritosActuales);
    console.log('Capacidad:', evento.capacidad);

    if (evento.capacidad && inscritosActuales >= evento.capacidad) {
      throw new AppError('Este evento ya no tiene cupos disponibles', 400);
    }

    console.log(' Hay cupos disponibles');

    // 4. Verificar que el usuario no esté ya inscrito
    const [inscripcionExistente] = await db.query(
      ' SELECT id FROM inscripciones WHERE id_usuario_mongo = ? AND id_evento_mongo = ? AND estado != "cancelada"',
      [id_usuario_mongo, id_evento_mongo]
      );


    if (inscripcionExistente.length > 0) {
      throw new AppError('Ya estás inscrito en este evento', 400);
    }

    console.log('Usuario no está inscrito previamente');

    // 5. Adjuntar información del evento a la request
    req.evento = evento;
    req.cuposDisponibles = evento.capacidad - inscritosActuales;

    console.log(' === VALIDACIÓN EXITOSA ===\n');

    next();
  } catch (error) {
    console.error(' Error en validación:', error.message);
    next(error);
  }
};