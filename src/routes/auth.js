const express = require('express');
const bcrypt = require('bcrypt');
const dayjs = require('dayjs');
const crypto = require('crypto');
const knex = require('../db/knex');

const router = express.Router();

router.get('/', async (req, res) => {
  const plans = await knex('plans').where({ is_active: true });
  res.render('pages/landing', { plans });
});

router.get('/register', (req, res) => {
  res.render('pages/register', { error: null });
});

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  const existing = await knex('users').where({ email }).first();
  if (existing) {
    return res.render('pages/register', { error: 'Пользователь уже существует' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [id] = await knex('users').insert({ name, email, password_hash: passwordHash });
  req.session.user = { id, name, email, is_admin: false };
  return res.redirect('/shops');
});

router.get('/login', (req, res) => {
  res.render('pages/login', { error: null });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await knex('users').where({ email }).first();
  if (!user) {
    return res.render('pages/login', { error: 'Неверные учетные данные' });
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    return res.render('pages/login', { error: 'Неверные учетные данные' });
  }

  req.session.user = { id: user.id, name: user.name, email: user.email, is_admin: user.is_admin };
  return res.redirect('/dashboard');
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

router.get('/forgot', (req, res) => {
  res.render('pages/forgot', { message: null });
});

router.post('/forgot', async (req, res) => {
  const { email } = req.body;
  const user = await knex('users').where({ email }).first();
  if (!user) {
    return res.render('pages/forgot', { message: 'Если email зарегистрирован, токен отправлен.' });
  }

  const token = crypto.randomBytes(16).toString('hex');
  const expiresAt = dayjs().add(1, 'hour').toDate();
  await knex('password_resets').insert({ user_id: user.id, token, expires_at: expiresAt });
  return res.render('pages/forgot', { message: `Демо-токен для сброса: ${token}` });
});

router.get('/reset', (req, res) => {
  res.render('pages/reset', { error: null, token: req.query.token || '' });
});

router.post('/reset', async (req, res) => {
  const { token, password } = req.body;
  const reset = await knex('password_resets')
    .where({ token })
    .andWhere('expires_at', '>=', dayjs().toDate())
    .first();
  if (!reset) {
    return res.render('pages/reset', { error: 'Токен недействителен', token });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await knex('users').where({ id: reset.user_id }).update({ password_hash: passwordHash });
  await knex('password_resets').where({ id: reset.id }).del();
  return res.redirect('/login');
});

module.exports = router;
