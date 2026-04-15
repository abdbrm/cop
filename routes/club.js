const express = require('express');
const router = express.Router();
const { db } = require('../db/db');

function layout(title, body) {
  return `
  <!DOCTYPE html>
  <html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <title>${title}</title>
    <link rel="stylesheet" href="/style.css" />
  </head>
  <body>
    <div class="box">
      ${body}
    </div>
    <script src="/main.js"></script>
  </body>
  </html>
  `;
}

function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

function renderClub(clubKey, clubTitle, clubClass) {
  return (req, res) => {
    const u = req.session.user;
    if (u.role === 'worker' && u.club !== clubKey) return res.status(403).send('Forbidden');

    const rows = db.prepare('SELECT * FROM menu ORDER BY section, id').all();
    const pricesRows = db.prepare('SELECT code, price FROM prices WHERE club = ?').all(clubKey);
    const prices = {};
    pricesRows.forEach(p => { prices[p.code] = p.price; });

    const sections = {};
    rows.forEach(r => {
      if (!sections[r.section]) sections[r.section] = [];
      sections[r.section].push(r);
    });

    const sectionsHtml = Object.keys(sections).map(sec => {
      const itemsHtml = sections[sec].map(item => {
        const price = prices[item.code];
        return `<li>${item.name}${price ? ` — ${price}₽` : ''}</li>`;
      }).join('');
      return `
        <h3>${sec}</h3>
        <ul>${itemsHtml}</ul>
      `;
    }).join('');

    res.send(layout(clubTitle, `
      <h2 class="${clubClass}">${clubTitle}</h2>
      ${sectionsHtml}
      <a href="/logout">Выйти</a>
    `));
  };
}

router.get('/club/neon', requireLogin, renderClub('neon', 'NEON', 'club-neon'));
router.get('/club/elvis', requireLogin, renderClub('elvis', 'ELVIS', 'club-elvis'));
router.get('/club/enot', requireLogin, renderClub('enot', 'ENOT', 'club-enot'));

module.exports = router;
