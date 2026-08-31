type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  stack?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private persistKey = 'harmonyhub_logs';

  constructor() {
    this.loadLogs();
  }

  private loadLogs() {
    try {
      const saved = localStorage.getItem(this.persistKey);
      if (saved) {
        this.logs = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load logs:', e);
    }
  }

  private saveLogs() {
    try {
      // Keep only last 1000 logs
      if (this.logs.length > this.maxLogs) {
        this.logs = this.logs.slice(-this.maxLogs);
      }
      localStorage.setItem(this.persistKey, JSON.stringify(this.logs));
    } catch (e) {
      console.error('Failed to save logs:', e);
    }
  }

  private formatMessage(message: string, data?: any): string {
    if (data) {
      return `${message} ${JSON.stringify(data, null, 2)}`;
    }
    return message;
  }

  private log(level: LogLevel, message: string, data?: any, error?: Error) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: this.formatMessage(message, data),
      data,
      stack: error?.stack,
    };

    this.logs.push(entry);
    this.saveLogs();

    // Console output with styling
    const styles = {
      debug: 'color: #8b9dc3',
      info: 'color: #667e55',
      warn: 'color: #d9af3a',
      error: 'color: #e15d42; font-weight: bold',
    };

    console.log(
      `%c[${entry.timestamp}] [${level.toUpperCase()}] ${entry.message}`,
      styles[level]
    );

    if (error) {
      console.error(error);
    }
  }

  debug(message: string, data?: any) {
    if (import.meta.env.DEV) {
      this.log('debug', message, data);
    }
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, error?: Error, data?: any) {
    this.log('error', message, data, error);
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(l => l.level === level);
    }
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
    this.saveLogs();
  }

  downloadLogs() {
    const blob = new Blob([JSON.stringify(this.logs, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `harmonyhub_logs_${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const logger = new Logger();