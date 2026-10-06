const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../database');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('WARNING: JWT_SECRET not set!');
}

// Register
router.post('/register', (req, res) => {
  try {
    var name = req.body.name;
    var email = req.body.email;
    var password = req.body.password;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required'
      });
    }

    name = name.trim();
    email = email.trim().toLowerCase();
    password = password.trim();

    if (name.length < 2) {
      return res.status(400).json({ success: false, message: 'Name must be at least 2 characters' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    var db = getDb();
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database not available' });
    }

    db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      if (row) {
        return res.status(409).json({ success: false, message: 'Email already registered' });
      }

      var hashedPassword = bcrypt.hashSync(password, 10);

      db.run(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
        [name, email, hashedPassword],
        function(err) {
          if (err) {
            console.error('Insert error:', err);
            return res.status(500).json({ success: false, message: 'Registration failed' });
          }

          var token = jwt.sign(
            { userId: this.lastID, email: email },
            JWT_SECRET,
            { expiresIn: '7d' }
          );

          res.status(201).json({
            success: true,
            message: 'Registration successful',
            token: token,
            user: { id: this.lastID, name: name, email: email }
          });
        }
      );
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// Login
router.post('/login', (req, res) => {
  try {
    var email = req.body.email;
    var password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    email = email.trim().toLowerCase();
    password = password.trim();

    var db = getDb();
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database not available' });
    }

    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      var isValidPassword = bcrypt.compareSync(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      var token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: 'Login successful',
        token: token,
        user: { id: user.id, name: user.name, email: user.email }
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  var db = getDb();
  if (!db) {
    return res.status(500).json({ success: false, message: 'Database not available' });
  }

  db.get('SELECT id, name, email, created_at FROM users WHERE id = ?', [req.userId], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user: user });
  });
});

// Middleware: verify JWT
function authenticateToken(req, res, next) {
  var authHeader = req.headers['authorization'];
  var token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  try {
    var decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
}

module.exports = router;
module.exports.authenticateToken = authenticateToken;
