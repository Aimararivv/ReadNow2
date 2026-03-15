import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BooksService } from '../../core/services/books.service';
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
    public auth: AuthService
  ) {}

  goToHome() {
    this.router.navigate(['/home']);
  }

  goToCatalog() {
    this.router.navigate(['/catalog']);
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id'); 

    if (!id) {
      console.error('No se proporcionó ID del libro');
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
        this.book = data;
        this.loading = false;
        this.checkReadPermission();
      },
      error: (err) => {
        console.error('Error:', err);
        this.loading = false;
      }
    });
  }

  checkReadPermission() {
    // Todos los libros son accesibles, solo se verifica el límite según el plan
    this.canRead = true;
    
    // Usar directamente el enlace de lectura que ya tenemos
    if (this.canRead && this.book.linkLectura) {
      console.log('📖 Usando enlace de lectura directo:', this.book.linkLectura);
      this.readLink = this.book.linkLectura;
    } else if (this.canRead) {
      // Intentar obtener del backend como fallback
      this.getReadLink();
    }
  }

  getReadLink() {
    const token = this.auth.getToken();
    if (!token) {
      console.error('No hay token de autenticación');
      return;
    }

    // Extraer el ID real del enlace de lectura (ej: 68283 de https://www.gutenberg.org/ebooks/68283.html.images)
    let bookId = this.book.id;
    
    if (bookId === 0 && this.book.linkLectura) {
      // Extraer ID del enlace de lectura
      const match = this.book.linkLectura.match(/\/ebooks\/(\d+)/);
      if (match && match[1]) {
        bookId = parseInt(match[1], 10);
        console.log('📖 ID extraído del enlace:', bookId);
      }
    }

    console.log('📖 Intentando obtener enlace para libro ID:', bookId);
    console.log('📖 Libro completo:', this.book);

    if (bookId === 0) {
      console.error('❌ No se pudo determinar el ID del libro');
      this.canRead = false;
      return;
    }

    this.booksService.getReadLink(bookId, token).subscribe({
      next: (data: any) => {
        console.log('✅ Enlace obtenido:', data);
        this.readLink = data.linkLectura;
      },
      error: (err: any) => {
        console.error('❌ Error obteniendo enlace de lectura:', err);
        
        // Manejar diferentes tipos de errores
        if (err.status === 401) {
          // 401: No autorizado - límite de lectura alcanzado
          this.canRead = false;
          console.log('Acceso denegado: límite de lectura alcanzado');
        } else {
          // Otros errores
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
    const title = this.book.titulo || this.book.title || 'este libro';
    const author = this.book.autor || this.book.author || 'el autor';
    
    return `Este libro clásico "${title}" de ${author} está disponible a través de Project Gutenberg, una biblioteca digital que ofrece más de 60,000 libros gratuitos. Esta obra es parte del patrimonio cultural literario y puedes disfrutarla en formato digital, perfecta para lectura en cualquier dispositivo. Project Gutenberg trabaja para preservar y compartir obras literarias que han pasado al dominio público, permitiendo que lectores de todo el mundo accedan a grandes clásicos de la literatura universal sin costo alguno.`;
  }
}