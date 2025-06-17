// ---- IMPORTS sabse upar ----
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const pool = require('./db');

const app = express();
const PORT = 5001;

// ---- Multer Storage Setup ----
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// ---- Middlewares ----
app.use(cors());
app.use(bodyParser.json()); // JSON body support
app.use('/uploads', express.static('uploads')); // Static file serving

// ---- APIs ----

// Products
app.get('/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/products', async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: "Product name is required" });
  try {
    const result = await pool.query(
      'INSERT INTO products (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Home
app.get('/', (req, res) => {
  res.send('Ratings & Reviews backend is running!');
});

// Users
app.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/users', async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: "Name and email are required" });
  try {
    const result = await pool.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
      [name, email]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Reviews
app.get('/reviews', async (req, res) => {
  try {
    const { product_id, user_id } = req.query;
    let query = 'SELECT * FROM reviews';
    let params = [];

    if (product_id) {
      query += ' WHERE product_id = $1';
      params.push(product_id);
    }
    if (user_id) {
      if (params.length) {
        query += ' AND user_id = $2';
        params.push(user_id);
      } else {
        query += ' WHERE user_id = $1';
        params.push(user_id);
      }
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/reviews', upload.single('photo'), async (req, res) => {
  const { user_id, product_id, rating, review_text } = req.body;
  let photo_url = null;
  if (req.file) {
    photo_url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  }

  if (!user_id || !product_id) {
    return res.status(400).json({ error: 'user_id and product_id are required' });
  }
  if (!rating && !review_text) {
    return res.status(400).json({ error: 'At least rating or review_text is required' });
  }
  if (rating && (rating < 1 || rating > 5)) {
    return res.status(400).json({ error: 'Rating should be between 1 and 5' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO reviews (user_id, product_id, rating, review_text, photo_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, product_id, rating, review_text, photo_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'User has already reviewed this product' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Test endpoint (debugging)
app.post('/testreview', (req, res) => {
  res.send('POST review working!');
});

// ---- Start Server ----
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});