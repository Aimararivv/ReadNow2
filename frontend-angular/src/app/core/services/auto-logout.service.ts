import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class AutoLogoutService {
  private readonly INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos
  private readonly CHECK_INTERVAL = 60 * 1000; // Verificar cada minuto

  constructor(
    private auth: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {
    this.setupAutoLogout();
  }

  private setupAutoLogout(): void {
    // Evento cuando el usuario cierra la pestaña o el navegador
    window.addEventListener('beforeunload', (event) => {
      // Limpiar sesión automáticamente al cerrar
      this.auth.logout();
      // No mostrar mensaje de confirmación
      delete event['returnValue'];
    });

    // Evento cuando la página pierde o gana visibilidad
    document.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange();
    });

    // Eventos de actividad del usuario
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
      document.addEventListener(event, () => {
        this.resetInactivityTimer();
      }, true);
    });

    // Iniciar timer de inactividad
    this.resetInactivityTimer();

    // Verificar periódicamente la sesión
    setInterval(() => {
      this.checkSessionStatus();
    }, this.CHECK_INTERVAL);
  }

  private handleVisibilityChange(): void {
    if (document.hidden) {
      // Guardar timestamp cuando la página pierde visibilidad
      sessionStorage.setItem('lastActiveTime', Date.now().toString());
    } else {
      // Verificar inactividad cuando la página gana visibilidad
      this.checkInactivity();
    }
  }

  private checkInactivity(): void {
    const lastActiveTime = sessionStorage.getItem('lastActiveTime');
    if (lastActiveTime) {
      const timeDiff = Date.now() - parseInt(lastActiveTime);
      if (timeDiff > this.INACTIVITY_TIMEOUT) {
        this.performAutoLogout('Sesión expirada por inactividad');
      }
    }
  }

  private resetInactivityTimer(): void {
    // Actualizar timestamp de actividad
    sessionStorage.setItem('lastActiveTime', Date.now().toString());
  }

  private checkSessionStatus(): void {
    // Verificar si el usuario todavía está autenticado
    if (!this.auth.getUser()) {
      this.performAutoLogout('Sesión no válida');
    }
  }

  private performAutoLogout(reason: string): void {
    // Solo cerrar sesión si el usuario está autenticado
    if (this.auth.getUser()) {
      this.auth.logout();
      
      // Mostrar mensaje apropiado
      this.messageService.add({
        severity: 'info',
        summary: 'Sesión cerrada',
        detail: reason + '. Por favor inicia sesión nuevamente.',
        life: 5000
      });

      // Redirigir al home
      this.router.navigate(['/home']);
    }
  }

  // Método para limpiar eventos (útil para pruebas o si se necesita desactivar)
  public cleanup(): void {
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    document.removeEventListener('visibilitychange', this.handleVisibilityChangeHandler);
  }

  private handleBeforeUnload = (event: BeforeUnloadEvent) => {
    this.auth.logout();
    delete event['returnValue'];
  };

  private handleVisibilityChangeHandler = () => {
    this.handleVisibilityChange();
  };
}
