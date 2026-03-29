import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');

  const messageService = inject(MessageService);
  const router = inject(Router);

  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    return next(cloned).pipe(
      catchError((error) => {

        // Detecta la  sesión expirada (después de 2 horas)
        if (error.status === 401) {

          console.log('⛔ Sesión expirada');

          messageService.add({
            severity: 'warn',
            summary: 'Sesión expirada',
            detail: 'Tu sesión ha expirado. Inicia sesión nuevamente.',
            life: 3000
          });

          // Limpiar token
          localStorage.removeItem('token');

          // Redirigir al login
          setTimeout(() => {
            router.navigate(['/login']);
          }, 1500);
        }

        return throwError(() => error);
      })
    );
  }

  // 👉 Si no hay token, deja pasar la petición normal
  return next(req);
};