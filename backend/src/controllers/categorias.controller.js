const axios = require('axios');

exports.getCategorias = async (req, res) => {
  const response = await axios.get('https://gutendex.com/books');
  const results = response.data.results;

  const categorias = new Set();

  results.forEach(book => {
    if (book.subjects) {
      book.subjects.forEach(s => {
        if (categorias.size < 10) categorias.add(s);
      });
    }
  });

  res.json([...categorias]);
};