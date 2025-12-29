const express = require('express');
const knex = require('../db/knex');
const { requireAuth, requireActiveSubscription } = require('./middleware');

const router = express.Router();

router.get('/', requireAuth, requireActiveSubscription, async (req, res) => {
  const shops = await knex('coffee_shops').where({ user_id: req.session.user.id });
  res.render('pages/shops', { shops, error: null });
});

router.post('/', requireAuth, requireActiveSubscription, async (req, res) => {
  const { name } = req.body;
  if (!name) {
    const shops = await knex('coffee_shops').where({ user_id: req.session.user.id });
    return res.render('pages/shops', { shops, error: 'Введите название кофейни' });
  }
  const [id] = await knex('coffee_shops').insert({ user_id: req.session.user.id, name });
  req.session.currentShop = { id, name };
  return res.redirect('/dashboard');
});

router.post('/:id/select', requireAuth, requireActiveSubscription, async (req, res) => {
  const shop = await knex('coffee_shops')
    .where({ id: req.params.id, user_id: req.session.user.id })
    .first();
  if (shop) {
    req.session.currentShop = { id: shop.id, name: shop.name };
  }
  return res.redirect('/dashboard');
});

module.exports = router;
