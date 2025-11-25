import mongoose from 'mongoose';

const usuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  correo: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  contraseña: {
    type: String,
    required: true
  },
  rol: {
    type: String,
    enum: [ 'estudiante', 'profesor', 'administrativo', 'externo'],
    default: 'estudiante'
  },
  activo: {
    type: Boolean,
    default: true  //  usuarios activos por defecto
  },
  
  tokenRecuperacion: {
    type: String
  },
  tokenRecuperacionExpira: {
    type: Date
  }
}, {
  timestamps: true
});

export default mongoose.model('Usuario', usuarioSchema);