import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {

  private apiUrl = 'http://localhost:5036/api/logs';

  private lastSent = new Map<string, number>();
  private readonly THROTTLE_MS = 5000;

  private readonly BLOCKED: string[] = [
    'Formatos disponibles',
    'Verificación de links',
    'Carousel books',
    'Recommended books',
    'Popular books',
    'Carrusel siguiente',
    'Carrusel anterior',
    'Información de usuario consultada',
    'Iniciales generadas para avatar',
    'Usuario consultó fecha de registro',
    'Formatos disponibles',
    'Tiene links de descarga',
    'Estado del componente',
    'Enlace obtenido',
    'Libro obtenido de API',
    'Nuevo CAPTCHA generado',
    'Modal de pago cerrado',
    'Modal cancelado haciendo click en overlay',
    'Modal de cancelación cerrado',
    'Filtro de planes aplicado',
    'Filtro de estado de suscripción cambiado',
    'Modo edición perfil cambiado',
    'Formulario de edición cargado con datos actuales',
    'Edición de perfil cancelada',
    'Datos enviados para actualizar perfil',
    'Modal de registro cerrado',
    'Usuario cambió de registro a login',
    'Usuario abrió/cerró el modal de login',
    'Usuario abrió el modal de registro',
    'Usuario abrió/cerró el dropdown del perfil',
    'Usuario navegó al perfil',
    'Usuario navegó a Home',
    'Usuario navegó a Categorías',
    'Usuario navegó al catálogo',
    'Usuario navegó a Premium',
    'Usuario regresó desde perfil',
    'Usuario navegó a Home desde perfil',
    'Usuario navegó a Home desde Catalog',
    'Usuario navegó a Categorías desde Catalog',
    'Usuario navegó a Home desde BookDetail',
    'Usuario navegó a Categorías desde BookDetail',
    'Usuario navegó al catálogo desde BookDetail',
    'Usuario navegó a Premium desde BookDetail',
    'Libros cargados',
    'Libros cargados por categoría',
    'Cargando todos los libros',
    'Cargando libros por categoría',
    'Resultados obtenidos',
    'Suscripción obtenida',
    'Cargando información de suscripción',
    'Dashboard inicializando',
    'NavbarComponent inicializado',
    'CatalogComponent cargado',
    'BookDetailComponent cargado',
    'ProfileComponent cargado',
    'PremiumComponent cargado',
    'Verificando token',
  ];

  private readonly SAVED_LEVELS = new Set(['INFO', 'WARN', 'ERROR']);

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  private sendLog(level: string, message: string, data?: any) {

    if (!this.SAVED_LEVELS.has(level)) return;

    if (this.BLOCKED.some(m => message.includes(m))) return;

    const key = `${level}:${message}`;
    const now = Date.now();
    const last = this.lastSent.get(key) ?? 0;

    if (now - last < this.THROTTLE_MS) return;
    this.lastSent.set(key, now);

    const user = this.auth.getUser();

    const payload = {
      level,
      message,
      component: 'frontend',
      user_id: user?.id_usuario || null,
      data: data ? JSON.stringify(data) : null
    };

    this.http.post(this.apiUrl, payload).subscribe({
      error: () => console.warn('No se pudo guardar log en backend')
    });
  }

  log(message: string, data?: any) {
    console.log(`[LOG] ${message}`, data ?? '');
    this.sendLog('LOG', message, data);
  }

  info(message: string, data?: any) {
    console.info(`[INFO] ${message}`, data ?? '');
    this.sendLog('INFO', message, data);
  }

  warn(message: string, data?: any) {
    console.warn(`[WARN] ${message}`, data ?? '');
    this.sendLog('WARN', message, data);
  }

  error(message: string, data?: any) {
    console.error(`[ERROR] ${message}`, data ?? '');
    this.sendLog('ERROR', message, data);
  }
}