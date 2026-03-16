import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {

  log(message: string, data?: any) {
    data !== undefined
      ? console.log(`[LOG] ${message}`, data)
      : console.log(`[LOG] ${message}`);
  }

  info(message: string, data?: any) {
    data !== undefined
      ? console.info(`[INFO] ${message}`, data)
      : console.info(`[INFO] ${message}`);
  }

  warn(message: string, data?: any) {
    data !== undefined
      ? console.warn(`[WARN] ${message}`, data)
      : console.warn(`[WARN] ${message}`);
  }

  error(message: string, data?: any) {
    data !== undefined
      ? console.error(`[ERROR] ${message}`, data)
      : console.error(`[ERROR] ${message}`);
  }

}