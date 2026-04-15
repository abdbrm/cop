const express = require('express');
const session = require('express-session');
const path = require('path');
require('./db/db'); // init DB

const authRoutes = require('./routes/auth');
const clubRoutes = require('./routes/club');
const adminRoutes = require('./routes/admin');
const abdoRoutes = require('./routes/abdo');

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'changethis_secret',
  resave: false,
  saveUninitialized: false
}));

app.use(authRoutes);
app.use(clubRoutes);
app.use(adminRoutes);
app.use(abdoRoutes);

app.get('/home', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const u = req.session.user;
  if (u.role === 'worker') {
    if (u.club === 'neon') return res.redirect('/club/neon');
    if (u.club === 'elvis') return res.redirect('/club/elvis');
    if (u.club === 'enot') return res.redirect('/club/enot');
    return res.send('Клуб не назначен');
  }
  if (u.role === 'admin') return res.redirect('/admin');
  if (u.role === 'abdo') return res.redirect('/abdo');
  res.send('Неизвестная роль');
});

app.listen(PORT, () => {
  console.log('Server running on http://localhost:' + PORT);
});
