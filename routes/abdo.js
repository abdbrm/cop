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

router.get('/abdo', requireLogin, requireRole('abdo'), (req, res) => {
  const users = db.prepare('SELECT * FROM users ORDER BY id').all();
  const permsRows = db.prepare('SELECT key, allowed FROM permissions WHERE target = ?').all('admin');
  const perms = {};
  permsRows.forEach(r => { perms[r.key] = !!r.allowed; });

  const permRow = (key, label) => {
    const allowed = perms[key] !== false;
    return `
      <tr>
        <td>${label}</td>
        <td>${allowed ? 'Разрешено' : 'Скрыто'}</td>
      </tr>
    `;
  };

  const usersHtml = users.map(u => `
    <li>${u.username} — ${u.role} — ${u.club || '-'}</li>
  `).join('');

  res.send(layout('Abdo Root', `
    <h2>Панель Abdo (ROOT)</h2>

    <h3>Права администратора</h3>
    <table class="perm-table">
      ${permRow('prices', 'Цены')}
      ${permRow('offers', 'Акции')}
    </table>
    <p>Долгое нажатие по заголовку в панели администратора открывает настройки прав.</p>

    <h3>Пользователи</h3>
    <ul>${usersHtml}</ul>

    <a href="/logout">Выйти</a>
  `));
});

router.post('/abdo/permissions/toggle', requireLogin, requireRole('abdo'), (req, res) => {
  const { key } = req.body;
  if (!key) return res.json({ ok: false });

  const row = db.prepare('SELECT * FROM permissions WHERE target = ? AND key = ?').get('admin', key);
  if (!row) {
    db.prepare('INSERT INTO permissions (target, key, allowed) VALUES (?, ?, ?)').run('admin', key, 0);
    return res.json({ ok: true, value: false });
  } else {
    const newVal = row.allowed ? 0 : 1;
    db.prepare('UPDATE permissions SET allowed = ? WHERE id = ?').run(newVal, row.id);
    return res.json({ ok: true, value: !!newVal });
  }
});

module.exports = router;
