const requestCounts = new Map();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const MAX_REQUESTS = 100;

export const rateLimiter = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  // Limpiar entradas antiguas
  for (const [ip, data] of requestCounts.entries()) {
    if (now - data.windowStart > WINDOW_MS) {
      requestCounts.delete(ip);
    }
  }

  // Obtener o crear entrada para esta IP
  const clientData = requestCounts.get(clientIP) || {
    count: 0,
    windowStart: now
  };

  // Resetear ventana si ha pasado el tiempo
  if (now - clientData.windowStart > WINDOW_MS) {
    clientData.count = 0;
    clientData.windowStart = now;
  }

  clientData.count++;
  requestCounts.set(clientIP, clientData);

  // Verificar límite
  if (clientData.count > MAX_REQUESTS) {
    return res.status(429).json({
      status: 'error',
      mensaje: 'Demasiadas solicitudes. Por favor intenta más tarde.'
    });
  }

  // Agregar headers de rate limit
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', MAX_REQUESTS - clientData.count);
  
  next();
};