import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BooksService } from '../../core/services/books.service';
import { LoggerService } from '../../core/services/logger.service';

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

  constructor(
    private route: ActivatedRoute,
    private booksService: BooksService,
    private router: Router,
    private logger: LoggerService
  ) {}

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

    this.logger.info('Buscando libro por ID', id);

    this.booksService.getBookById(id).subscribe({

      next: (data) => {

        this.logger.log('Libro cargado correctamente', data);

        this.book = data;
        this.loading = false;

      },

      error: (err) => {

        this.logger.error('Error al obtener libro por ID', err);

        this.loading = false;

      }

    });
  }
}