const categoryMap = {
  'Fiction': 'fiction',
  "Children's Literature": 'children',
  'Mystery': 'mystery',
  'Science Fiction': 'science fiction',
  'Fantasy': 'fantasy',
  'Romance': 'romance',
  'History': 'history',
  'Biography': 'biography',
  'Science': 'science',
  'Poetry': 'poetry',
  'Drama': 'drama',
  'Adventure': 'adventure',
  'Short Stories': 'short stories',
  'Philosophy': 'philosophy',
  'Music': 'music',
  'Composers': 'composers'
};

const formatBook = (book, index) => ({
  id: book.id.toString(),
  title: book.title || 'Título desconocido',
  author: book.authors?.[0]?.name || 'Autor desconocido',
  thumbnail: book.formats?.['image/jpeg'] || book.formats?.['image/png'] || null,
  premium: index % 3 === 0,
  downloadCount: book.download_count || 0,
  subjects: book.subjects?.slice(0, 3) || []
});

export const getBooks = async (req, res) => {
  try {
    console.log('📚 Obteniendo libros desde Gutenberg...');
    const startTime = Date.now();

    const response = await fetch('https://gutendex.com/books');
    const data = await response.json();

    console.log('📊 Datos recibidos de Gutenberg:', data.results?.length || 0, 'libros');

    const books = data.results?.slice(0, 20).map(formatBook) || [];

    const endTime = Date.now();
    console.log(`⏱️ Tiempo de respuesta: ${endTime - startTime}ms`);
    console.log('📚 Enviando', books.length, 'libros al frontend');

    res.json(books);
  } catch (error) {
    console.error('❌ Error fetching books from Gutenberg:', error);
    res.status(500).json({ message: 'Error al obtener libros' });
  }
};

export const searchBooks = async (req, res) => {
  try {
    const query = req.query.query || '';
    if (!query) {
      return res.json([]);
    }

    const response = await fetch(`https://gutendex.com/books?search=${encodeURIComponent(query)}`);
    const data = await response.json();

    const books = data.results?.slice(0, 10).map(formatBook) || [];

    res.json(books);
  } catch (error) {
    console.error('Error searching books from Gutenberg:', error);
    res.status(500).json({ message: 'Error en la búsqueda' });
  }
};

export const getBooksByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const searchQuery = categoryMap[category] || category;

    console.log(`📚 Obteniendo libros de categoría: ${category}`);

    const [page1, page2] = await Promise.all([
      fetch(`https://gutendex.com/books?search=${encodeURIComponent(searchQuery)}`).then(r => r.json()),
      fetch(`https://gutendex.com/books?search=${encodeURIComponent(searchQuery)}&page=2`).then(r => r.json())
    ]);

    const results = [
      ...(page1.results || []),
      ...(page2.results || [])
    ];

    const books = results.map(formatBook);

    console.log(`📊 Total libros obtenidos para ${category}: ${books.length}`);

    res.json(books);
  } catch (error) {
    console.error('Error fetching books by category from Gutenberg:', error);
    res.status(500).json({ message: 'Error al obtener libros por categoría' });
  }
};

export const getBookById = async (req, res) => {
  try {
    const { id } = req.params;

    const response = await fetch(`https://gutendex.com/books/${id}`);
    
    if (!response.ok) {
      console.error(`❌ Error HTTP de Gutenberg: ${response.status}`);
      return res.status(502).json({ message: 'Error al obtener detalles del libro de Gutenberg' });
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('❌ Gutenberg devolvió contenido no-JSON:', contentType);
      return res.status(502).json({ message: 'Respuesta inválida del servidor de libros' });
    }
    
    const book = await response.json();

    const bookDetail = {
      id: book.id?.toString() || id,
      title: book.title || 'Título desconocido',
      author: book.authors?.[0]?.name || 'Autor desconocido',
      thumbnail: book.formats?.['image/jpeg'] || book.formats?.['image/png'] || null,
      description: book.description?.substring(0, 500) || 'Sin descripción disponible',
      premium: false,
      downloadCount: book.download_count || 0,
      subjects: book.subjects?.slice(0, 5) || [],
      languages: book.languages?.map(lang => lang.code) || [],
      downloadLinks: book.formats || {}
    };

    res.json(bookDetail);
  } catch (error) {
    console.error('❌ Error fetching book details from Gutenberg:', error.message);
    res.status(500).json({ message: 'Error al obtener detalles del libro' });
  }
};

export const getPublicBookById = async (req, res) => {
  try {
    const { id } = req.params;

    const response = await fetch(`https://gutendex.com/books/${id}`);
    
    if (!response.ok) {
      console.error(`❌ Error HTTP de Gutenberg: ${response.status}`);
      return res.status(502).json({ message: 'Error al obtener detalles del libro de Gutenberg' });
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('❌ Gutenberg devolvió contenido no-JSON:', contentType);
      return res.status(502).json({ message: 'Respuesta inválida del servidor de libros' });
    }
    
    const book = await response.json();

    const bookDetail = {
      id: book.id?.toString() || id,
      title: book.title || 'Título desconocido',
      author: book.authors?.[0]?.name || 'Autor desconocido',
      thumbnail: book.formats?.['image/jpeg'] || book.formats?.['image/png'] || null,
      description: book.description?.substring(0, 500) || 'Sin descripción disponible',
      premium: false,
      downloadCount: book.download_count || 0,
      subjects: book.subjects?.slice(0, 5) || [],
      languages: book.languages?.map(lang => lang.code) || [],
      downloadLinks: book.formats || {}
    };

    res.json(bookDetail);
  } catch (error) {
    console.error('❌ Error fetching public book details from Gutenberg:', error.message);
    res.status(500).json({ message: 'Error al obtener detalles del libro' });
  }
};

export const getSubscriptionInfo = (req, res) => {
  const isPremium = req.user.role === 'PREMIUM';

  res.json({
    tieneSuscripcion: isPremium,
    tipoPlan: isPremium ? 'PREMIUM' : 'FREE',
    limiteDiario: isPremium ? -1 : 3,
    leidosHoy: 1,
    restantesHoy: isPremium ? -1 : 2,
    esPremium: isPremium
  });
};