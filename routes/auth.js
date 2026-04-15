const express = require('express');
const router = express.Router();
const { db, bcrypt } = require('../db/db');

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

router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/home');
  res.send(layout('Вход', `
    <h2>Вход</h2>
    <form method="POST" action="/login">
      <label>Логин</label>
      <input name="username" required />
      <label>Пароль</label>
      <input name="password" type="password" required />
      <button type="submit">Войти</button>
    </form>
  `));
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.send(layout('Ошибка', `
      <h3>Неверный логин или пароль</h3>
      <a href="/login">Назад</a>
    `));
  }
  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) {
    return res.send(layout('Ошибка', `
      <h3>Неверный логин или пароль</h3>
      <a href="/login">Назад</a>
    `));
  }
  req.session.user = {
    id: user.id,
    username: user.username,
    role: user.role,
    club: user.club
  };
  res.redirect('/home');
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

module.exports = router;
