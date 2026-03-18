import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3,
}

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  private readonly minLevel: LogLevel = environment.production ? LogLevel.Warn : LogLevel.Debug;

  debug(message: string, ...args: unknown[]): void {
    this.log(LogLevel.Debug, message, args);
  }

  info(message: string, ...args: unknown[]): void {
    this.log(LogLevel.Info, message, args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.log(LogLevel.Warn, message, args);
  }

  error(message: string, ...args: unknown[]): void {
    this.log(LogLevel.Error, message, args);
  }

  private log(level: LogLevel, message: string, args: unknown[]): void {
    if (level < this.minLevel) {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}]`;

    switch (level) {
      case LogLevel.Debug:
        console.debug(prefix, message, ...args);
        break;
      case LogLevel.Info:
        console.info(prefix, message, ...args);
        break;
      case LogLevel.Warn:
        console.warn(prefix, message, ...args);
        break;
      case LogLevel.Error:
        console.error(prefix, message, ...args);
        break;
    }
  }
}
