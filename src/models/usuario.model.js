import mongoose from 'mongoose';

const usuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
    minlength: [3, 'El nombre debe tener al menos 3 caracteres']
  },
  correo: {
    type: String,
    required: [true, 'El correo es obligatorio'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Por favor ingresa un correo válido']
  },
  password: {  // ✅ Cambiado de "contraseña" a "password"
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    select: false
  },
  rol: {
    type: String,
    enum: {
      values: ['administrativo', 'estudiante', 'profesor', 'externo'],
      message: '{VALUE} no es un rol válido'
    },
    default: 'estudiante'
  },
  telefono: {
    type: String,
    trim: true,
    match: [/^[0-9]{10}$/, 'El teléfono debe tener 10 dígitos']
  },
  carrera: {
    type: String,
    trim: true
  },
  activo: {
    type: Boolean,
    default: true
  },
  tokenRecuperacion: {
    type: String,
    select: false
  },
  tokenRecuperacionExpira: {
    type: Date,
    select: false
  },
  ultimoAcceso: {
    type: Date
  },
  avatar: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.tokenRecuperacion;
      delete ret.tokenRecuperacionExpira;
      return ret;
    }
  },
  toObject: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.tokenRecuperacion;
      delete ret.tokenRecuperacionExpira;
      return ret;
    }
  }
});

usuarioSchema.index({ correo: 1 });
usuarioSchema.index({ rol: 1 });
usuarioSchema.index({ activo: 1 });
usuarioSchema.index({ tokenRecuperacion: 1 });

usuarioSchema.virtual('nombreFormateado').get(function() {
  return this.nombre.split(' ').map(palabra => 
    palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()
  ).join(' ');
});

usuarioSchema.methods.actualizarAcceso = async function() {
  this.ultimoAcceso = new Date();
  return await this.save();
};

const Usuario = mongoose.model('Usuario', usuarioSchema);

export default Usuario;