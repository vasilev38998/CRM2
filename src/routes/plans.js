const express = require('express');
const knex = require('../db/knex');
const { requireAdmin } = require('./middleware');

const router = express.Router();

router.get('/plans', async (req, res) => {
  const plans = await knex('plans').where({ is_active: true });
  res.render('pages/plans', { plans });
});

router.get('/admin/plans', requireAdmin, async (req, res) => {
  const plans = await knex('plans');
  res.render('pages/admin-plans', { plans, error: null });
});

router.post('/admin/plans', requireAdmin, async (req, res) => {
  const { name, price_rub, duration_days, description } = req.body;
  if (!name || !price_rub || !duration_days) {
    const plans = await knex('plans');
    return res.render('pages/admin-plans', { plans, error: 'Заполните обязательные поля' });
  }
  await knex('plans').insert({
    name,
    price_rub: Number(price_rub),
    duration_days: Number(duration_days),
    description
  });
  return res.redirect('/admin/plans');
});

router.post('/admin/plans/:id/toggle', requireAdmin, async (req, res) => {
  const plan = await knex('plans').where({ id: req.params.id }).first();
  if (plan) {
    await knex('plans').where({ id: plan.id }).update({ is_active: !plan.is_active });
  }
  return res.redirect('/admin/plans');
});

module.exports = router;
