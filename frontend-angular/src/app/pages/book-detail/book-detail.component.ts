import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BooksService } from '../../core/services/books.service';
import { LoggerService } from '../../core/services/logger.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './book-detail.component.html',
  styleUrls: ['./book-detail.component.scss']
})
export class BookDetailComponent implements OnInit {

  book: any = null;
  loading = true;
  readLink: string | null = null;
  canRead = false;

  constructor(
    private route: ActivatedRoute,
    private booksService: BooksService,
    private router: Router,
    public auth: AuthService,
    private logger: LoggerService
  ) { }

  goToHome() {

    this.logger.log('Usuario navegó a Home desde BookDetail');

    this.router.navigate(['/home']);
  }

  goToCatalog() {

    this.logger.log('Usuario navegó al catálogo desde BookDetail');

    this.router.navigate(['/catalog']);
  }

  ngOnInit() {

    this.logger.info('BookDetailComponent cargado');

    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {

      this.logger.warn('ID de libro no encontrado en la URL');

      this.loading = false;
      return;
    }

    const bookId = parseInt(id, 10);
    if (isNaN(bookId)) {
      console.error('ID del libro inválido:', id);
      this.loading = false;
      return;
    }

    this.booksService.getBookById(id).subscribe({
      next: (data) => {
        console.log('✅ Libro obtenido de API pública:', data);
        this.book = data;
        this.loading = false;
        console.log('📚 Estado del componente:', { book: !!this.book, loading: this.loading, canRead: this.canRead });
        this.checkReadPermission();
      },
      error: (err) => {
        console.error('Error:', err);
        this.loading = false;
      }
    });
  }

  checkReadPermission() {
    // Verificar si el usuario puede leer
    if (!this.auth.isLogged()) {
      this.canRead = false;
      console.log('❌ Usuario no está logueado');
      return;
    }
    
    // Si el libro es premium y el usuario no es premium, mostrar mensaje
    if (this.book.premium && !this.auth.isPremium()) {
      this.canRead = false;
      console.log('⭐ Este libro requiere suscripción premium');
      return;
    }
    
    // Para usuarios FREE, verificar límite de lectura
    if (!this.auth.isPremium()) {
      this.checkMonthlyLimit();
    } else {
      // Usuarios PREMIUM tienen acceso completo
      this.canRead = true;
      this.getReadLink();
    }
  }

  checkMonthlyLimit() {
    // Aquí podrías implementar la lógica para verificar el límite mensual
    // Por ahora, permitimos la lectura
    this.canRead = true;
    this.getReadLink();
  }

  getReadLink() {
    const token = this.auth.getToken();
    console.log(' Token del auth service:', token ? token.substring(0, 20) + '...' : 'null');
    console.log(' Token del localStorage:', localStorage.getItem('token') ? localStorage.getItem('token')?.substring(0, 20) + '...' : 'null');
    
    if (!token) {
      console.error(' No hay token de autenticación');
      return;
    }

    console.log(' Intentando obtener enlace para libro ID:', this.book.id);
    console.log(' Libro completo:', this.book);

    this.booksService.getReadLink(this.book.id).subscribe({
      next: (data: any) => {
        console.log(' Enlace obtenido:', data);
        this.readLink = data.readLink;
      },
      error: (err: any) => {
        console.error(' Error obteniendo enlace de lectura:', err);
        
        // Manejar diferentes tipos de errores
        if (err.status === 403) {
          // 403: No autorizado - requiere premium
          this.canRead = false;
          console.log(' Este libro requiere suscripción premium');
        } else {
          console.log('Error al obtener enlace de lectura');
        }
      }
    });
  }

  readBook() {
    if (this.readLink) {
      // Abrir en nueva pestaña
      window.open(this.readLink, '_blank');
    }
  }

  getBookDescription(): string {
    const title = this.book.title || 'este libro';
    const author = this.book.author || 'el autor';

    return `Este libro clásico "${title}" de ${author} está disponible a través de Project Gutenberg, una biblioteca digital que ofrece más de 60,000 libros gratuitos. Esta obra es parte del patrimonio cultural literario y puedes disfrutarla en formato digital, perfecta para lectura en cualquier dispositivo. Project Gutenberg trabaja para preservar y compartir obras literarias que han pasado al dominio público, permitiendo que lectores de todo el mundo accedan a grandes clásicos de la literatura universal sin costo alguno.`;
  }

  getAvailableFormats(): any[] {
    if (!this.book.downloadLinks) return [];
    
    const formats = [];
    for (const [mime, url] of Object.entries(this.book.downloadLinks)) {
      if (typeof url === 'string') {
        let type = 'Desconocido';
        if (mime.includes('text/plain')) type = 'Texto Plano';
        else if (mime.includes('html')) type = 'HTML';
        else if (mime.includes('pdf')) type = 'PDF';
        else if (mime.includes('epub')) type = 'EPUB';
        else if (mime.includes('kindle') || mime.includes('mobi')) type = 'Kindle';
        else if (mime.includes('audio')) type = 'Audio';
        
        formats.push({ type, mime, url });
      }
    }
    return formats;
  }

  hasDownloadLinks(): boolean {
    return this.book.downloadLinks && Object.keys(this.book.downloadLinks).length > 0;
  }
}