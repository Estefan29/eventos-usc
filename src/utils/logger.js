import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crear directorio de logs si no existe
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

class Logger {
  constructor() {
    this.logFile = path.join(logsDir, 'app.log');
    this.errorFile = path.join(logsDir, 'errors.log');
  }

  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const dataStr = data ? `\n${JSON.stringify(data, null, 2)}` : '';
    return `[${timestamp}] [${level}] ${message}${dataStr}\n`;
  }

  writeToFile(file, message) {
    fs.appendFileSync(file, message);
  }

  info(message, data = null) {
    const formattedMsg = this.formatMessage('INFO', message, data);
    console.log(`ℹ️  ${message}`, data || '');
    this.writeToFile(this.logFile, formattedMsg);
  }

  success(message, data = null) {
    const formattedMsg = this.formatMessage('SUCCESS', message, data);
    console.log(`✅ ${message}`, data || '');
    this.writeToFile(this.logFile, formattedMsg);
  }

  warning(message, data = null) {
    const formattedMsg = this.formatMessage('WARNING', message, data);
    console.warn(`⚠️  ${message}`, data || '');
    this.writeToFile(this.logFile, formattedMsg);
  }

  error(message, error = null) {
    const formattedMsg = this.formatMessage('ERROR', message, error);
    console.error(`❌ ${message}`, error || '');
    this.writeToFile(this.errorFile, formattedMsg);
  }
}

export default new Logger();