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

  goToHome() { this.router.navigate(['/home']); }
  gotocategory() { this.router.navigate(['/categories']); }
  goToCatalog() { this.router.navigate(['/catalog']); }
  goToPremium() { this.router.navigate(['/premium']); }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.logger.warn('ID de libro no encontrado en la URL');
      this.loading = false;
      return;
    }

    const bookId = parseInt(id, 10);

    if (isNaN(bookId)) {
      this.logger.error('ID de libro inválido', { id });
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
        this.logger.error('Error obteniendo libro', err);
        this.loading = false;
      }
    });
  }

  checkReadPermission() {
    if (!this.auth.isLogged()) {
      this.canRead = false;
      this.logger.warn('Acceso a libro sin sesión iniciada', { bookId: this.book?.id });
      return;
    }

    if (this.book.premium && !this.auth.isPremium()) {
      this.canRead = false;
      this.logger.warn('Libro premium bloqueado para usuario FREE', { bookId: this.book?.id });
      return;
    }

    if (!this.auth.isPremium()) {
      this.checkMonthlyLimit();
    } else {
      this.canRead = true;
      this.getReadLink();
    }
  }

  checkMonthlyLimit() {
    this.canRead = true;
    this.getReadLink();
  }

  getReadLink() {
    const token = this.auth.getToken();

    if (!token) {
      this.logger.error('No hay token al solicitar enlace de lectura');
      return;
    }

    this.booksService.getReadLink(this.book.id).subscribe({
      next: (data: any) => {
        this.readLink = data.readLink;
      },
      error: (err: any) => {
        this.logger.error('Error obteniendo enlace de lectura', err);

        if (err.status === 403) {
          this.canRead = false;
          this.logger.warn('Acceso denegado al enlace: requiere premium', { bookId: this.book?.id });
        }
      }
    });
  }

  readBook() {
    if (this.readLink) {
      this.logger.info('Usuario abrió libro', { bookId: this.book?.id, title: this.book?.title });
      window.open(this.readLink, '_blank');
    } else {
      this.logger.warn('Intento de lectura sin enlace disponible', { bookId: this.book?.id });
    }
  }

  getBookDescription(): string {
    const title = this.book.title || 'este libro';
    const author = this.book.author || 'el autor';
    return `Este libro clásico "${title}" de ${author} está disponible digitalmente.`;
  }

  getAvailableFormats(): any[] {
    if (!this.book?.downloadLinks) return [];

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
    return this.book?.downloadLinks &&
           Object.keys(this.book.downloadLinks).length > 0;
  }
}