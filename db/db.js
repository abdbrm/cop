const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');

const dbPath = path.join(__dirname, 'clubs.db');
const db = new Database(dbPath);

// ---------- INIT SCHEMA ----------
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  club TEXT
);

CREATE TABLE IF NOT EXISTS menu (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  section TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  club TEXT NOT NULL,
  code TEXT NOT NULL,
  price REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  target TEXT NOT NULL,
  key TEXT NOT NULL,
  allowed INTEGER NOT NULL
);
`);

// ---------- HELPERS ----------
function ensureDefaultData() {
  const countUsers = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (countUsers === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (username, password_hash, role, club)
      VALUES (@username, @password_hash, @role, @club)
    `);

    const hash = (pwd) => bcrypt.hashSync(pwd, 10);

    insertUser.run({ username: 'abdo', password_hash: hash('abdo123'), role: 'abdo', club: null });
    insertUser.run({ username: 'admin', password_hash: hash('admin123'), role: 'admin', club: null });
    insertUser.run({ username: 'worker.neon', password_hash: hash('1234'), role: 'worker', club: 'neon' });
    insertUser.run({ username: 'worker.elvis', password_hash: hash('1234'), role: 'worker', club: 'elvis' });
    insertUser.run({ username: 'worker.enot', password_hash: hash('1234'), role: 'worker', club: 'enot' });
  }

  const countMenu = db.prepare('SELECT COUNT(*) AS c FROM menu').get().c;
  if (countMenu === 0) {
    const insertMenu = db.prepare(`
      INSERT INTO menu (code, name, section)
      VALUES (@code, @name, @section)
    `);

    const add = (section, items) => {
      items.forEach(i => insertMenu.run({ code: i.code, name: i.name, section }));
    };

    add('Холодные закуски', [
      { code: 'lemon_slice', name: 'Нарезка лимона' },
      { code: 'orange_slice', name: 'Нарезка апельсина' },
      { code: 'veg_plate', name: 'Овощная тарелка' },
      { code: 'pickles_plate', name: 'Тарелка с соленьями' },
      { code: 'meat_plate', name: 'Мясная тарелка' },
      { code: 'cheese_plate', name: 'Сырное ассорти' },
      { code: 'fruit_plate', name: 'Фруктовое ассорти' },
      { code: 'chicken_sandwich', name: 'Сэндвич с курицей' },
      { code: 'hamcheesesandwich', name: 'Сэندвич с ветчиной и сыром' }
    ]);

    add('Салаты', [
      { code: 'salad_greek', name: 'Греческий' },
      { code: 'saladcaesarchicken', name: 'Цезарь с курицей' },
      { code: 'saladcaesartuna', name: 'Цезарь с тунцом' },
      { code: 'saladbaconcheese', name: 'Салат с беконом и сыром' },
      { code: 'salad_nezhny', name: 'Салат нежный' }
    ]);

    add('Закуски к пиву', [
      { code: 'beer_set', name: 'Пивной сет' },
      { code: 'meatbeersnack', name: 'Мясная закуска к пиву' },
      { code: 'chicken_strips', name: 'Куриные стрипсы' },
      { code: 'nuggets', name: 'Наггетсы' },
      { code: 'onion_rings', name: 'Луковые кольца' },
      { code: 'potato_sticks', name: 'Картофельные палочки' },
      { code: 'fries', name: 'Картофель фри' },
      { code: 'potato_idaho', name: 'Картофель айдахо' },
      { code: 'garlic_croutons', name: 'Гренки чесночные' },
      { code: 'fried_dumplings', name: 'Жареные пельмени куриные' },
      { code: 'cheese_braid', name: 'Сыр косичка' },
      { code: 'cheesebraidlemon', name: 'Сыр косичка с лимоном' },
      { code: 'sauce_assortment', name: 'Соус в ассортименте' }
    ]);

    add('Паста', [
      { code: 'pasta_bolognese', name: 'Болоньезе' },
      { code: 'pasta_carbonara', name: 'Карбонара' },
      { code: 'pastachickenmushroom', name: 'Курица-грибы' }
    ]);

    add('Горячие блюда', [
      { code: 'pan', name: 'Сковородка' },
      { code: 'panchickenmushroom', name: 'Сковородка с курицей и грибами' },
      { code: 'pan_fish', name: 'Рыбная' }
    ]);

    add('Пицца', [
      { code: 'pizzafourcheese', name: 'Четыре сыра' },
      { code: 'pizza_margherita', name: 'Маргарита' },
      { code: 'pizza_carbonara', name: 'Карбонара' },
      { code: 'pizza_okhotsk', name: 'Охотская' },
      { code: 'pizza_farmer', name: 'Фермерская' },
      { code: 'pizza_bavarian', name: 'Баварская' }
    ]);

    add('Снеки', [
      { code: 'chips_lays', name: "Чипсы Lay's" },
      { code: 'croutons_kirieshki', name: 'Сухарики Кириешки' },
      { code: 'pistachios', name: 'Фисташки' },
      { code: 'peanuts', name: 'Арахис' },
      { code: 'chocolate_milka', name: 'Шоколад Milka' }
    ]);
  }

  const countPerms = db.prepare('SELECT COUNT(*) AS c FROM permissions').get().c;
  if (countPerms === 0) {
    const insertPerm = db.prepare(`
      INSERT INTO permissions (target, key, allowed)
      VALUES (@target, @key, @allowed)
    `);
    insertPerm.run({ target: 'admin', key: 'prices', allowed: 1 });
    insertPerm.run({ target: 'admin', key: 'offers', allowed: 1 });
  }
}

ensureDefaultData();

// ---------- EXPORTED API ----------
module.exports = {
  db,
  bcrypt
};
