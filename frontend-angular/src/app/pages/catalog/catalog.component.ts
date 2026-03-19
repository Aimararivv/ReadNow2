import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BooksService } from '../../core/services/books.service';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.scss']
})
export class CatalogComponent implements OnInit {

  books:any[]=[];
  category:string='';

  constructor(
    private route:ActivatedRoute,
    private booksService:BooksService,
    private router:Router
  ){}

  ngOnInit() {
  this.route.queryParams.subscribe(params => {
    this.category = params['category'];

    if (this.category) {
      this.booksService.getBooksByCategory(this.category)
        .subscribe({
          next: (data) => {
            this.books = data;
          },
          error: (err) => {
            console.error("Error cargando libros", err);
          }
        });
    } else {
      // 🔥 SI NO HAY CATEGORIA → CARGA LIBROS
      this.booksService.getBooks().subscribe(data => {
        this.books = data;
      });
    }
  });
}

  openBook(book:any){
    this.router.navigate(['/book', book.id]);
  }

}