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
function requireRole(role) {
  return (req, res, next) => {
    if (!req.session.user || req.session.user.role !== role) return res.status(403).send('Forbidden');
    next();
  };
}

function getAdminPerms() {
  const rows = db.prepare('SELECT key, allowed FROM permissions WHERE target = ?').all('admin');
  const perms = {};
  rows.forEach(r => { perms[r.key] = !!r.allowed; });
  return perms;
}

router.get('/admin', requireLogin, requireRole('admin'), (req, res) => {
  const perms = getAdminPerms();

  const menuRows = db.prepare('SELECT * FROM menu ORDER BY section, id').all();
  const pricesRows = db.prepare('SELECT club, code, price FROM prices').all();
  const offers = db.prepare('SELECT * FROM offers ORDER BY id DESC').all();

  const prices = { neon: {}, elvis: {}, enot: {} };
  pricesRows.forEach(p => {
    if (!prices[p.club]) prices[p.club] = {};
    prices[p.club][p.code] = p.price;
  });

  const sections = {};
  menuRows.forEach(r => {
    if (!sections[r.section]) sections[r.section] = [];
    sections[r.section].push(r);
  });

  const sectionsHtml = Object.keys(sections).map(sec => {
    const itemsHtml = sections[sec].map(item => {
      const code = item.code;
      const neonPrice = prices.neon?.[code] ?? '';
      const elvisPrice = prices.elvis?.[code] ?? '';
      const enotPrice = prices.enot?.[code] ?? '';
      return `
        <tr>
          <td>${item.name}</td>
          <td><input name="neon_${code}" value="${neonPrice}"></td>
          <td><input name="elvis_${code}" value="${elvisPrice}"></td>
          <td><input name="enot_${code}" value="${enotPrice}"></td>
        </tr>
      `;
    }).join('');
    return `
      <h3>${sec}</h3>
      <table class="prices-table">
        <tr>
          <th>Позиция</th>
          <th>NEON</th>
          <th>ELVIS</th>
          <th>ENOT</th>
        </tr>
        ${itemsHtml}
      </table>
    `;
  }).join('');

  const offersHtml = offers.map(o => `
    <li>${o.title} — ${o.description}</li>
  `).join('');

  res.send(layout('Админ', `
    <h2>Панель администратора</h2>

    ${perms.prices !== false ? `
      <h3 data-perm-key="prices" class="perm-target">Цены</h3>
      <form method="POST" action="/admin/prices">
        ${sectionsHtml}
        <button type="submit">Сохранить цены</button>
      </form>
    ` : ''}

    ${perms.offers !== false ? `
      <h3 data-perm-key="offers" class="perm-target">Акции</h3>
      <form method="POST" action="/admin/offers/add">
        <input name="title" placeholder="Название акции">
        <input name="description" placeholder="Описание">
        <button type="submit">Добавить акцию</button>
      </form>
      <ul>${offersHtml}</ul>
    ` : ''}

    <a href="/logout">Выйти</a>
  `));
});

router.post('/admin/prices', requireLogin, requireRole('admin'), (req, res) => {
  const body = req.body;
  const menuRows = db.prepare('SELECT code FROM menu').all();

  const del = db.prepare('DELETE FROM prices');
  del.run();

  const insert = db.prepare('INSERT INTO prices (club, code, price) VALUES (?, ?, ?)');
  const clubs = ['neon', 'elvis', 'enot'];

  const tx = db.transaction(() => {
    menuRows.forEach(m => {
      clubs.forEach(club => {
        const key = `${club}_${m.code}`;
        if (body[key]) {
          const price = Number(body[key]);
          if (!isNaN(price)) insert.run(club, m.code, price);
        }
      });
    });
  });
  tx();

  res.redirect('/admin');
});

router.post('/admin/offers/add', requireLogin, requireRole('admin'), (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.redirect('/admin');
  db.prepare('INSERT INTO offers (title, description) VALUES (?, ?)').run(title, description || '');
  res.redirect('/admin');
});

module.exports = router;
