const express = require('express');
const axios = require('axios');
const dayjs = require('dayjs');
const knex = require('../db/knex');
const { requireAuth } = require('./middleware');
const { createTinkoffSignature } = require('../utils/tinkoff');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const [plans, subscription] = await Promise.all([
    knex('plans').where({ is_active: true }),
    knex('subscriptions')
      .where({ user_id: req.session.user.id })
      .orderBy('end_at', 'desc')
      .first()
  ]);

  res.render('pages/subscription', { plans, subscription });
});

router.post('/create', requireAuth, async (req, res) => {
  const { plan_id } = req.body;
  const plan = await knex('plans').where({ id: plan_id, is_active: true }).first();
  if (!plan) {
    return res.redirect('/subscription');
  }

  const orderId = `ORD-${req.session.user.id}-${Date.now()}`;
  const payload = {
    TerminalKey: process.env.TINKOFF_TERMINAL_KEY,
    Amount: plan.price_rub * 100,
    OrderId: orderId,
    Description: `Оплата тарифа ${plan.name}`,
    NotificationURL: process.env.TINKOFF_NOTIFICATION_URL,
    SuccessURL: process.env.TINKOFF_SUCCESS_URL,
    FailURL: process.env.TINKOFF_FAIL_URL
  };

  payload.Token = createTinkoffSignature(payload, process.env.TINKOFF_PASSWORD || '');

  let response;
  try {
    response = await axios.post('https://securepay.tinkoff.ru/v2/Init', payload);
  } catch (error) {
    console.error('Tinkoff init error', error.response?.data || error.message);
    return res.redirect('/subscription');
  }

  const data = response.data;
  await knex('payments').insert({
    user_id: req.session.user.id,
    plan_id: plan.id,
    amount_rub: plan.price_rub,
    status: data.Success ? 'pending' : 'failed',
    provider: 'tinkoff',
    provider_payment_id: data.PaymentId,
    payload: JSON.stringify(data)
  });

  if (data.PaymentURL) {
    return res.redirect(data.PaymentURL);
  }

  return res.redirect('/subscription');
});

router.get('/success', requireAuth, (req, res) => {
  res.render('pages/subscription-result', { success: true });
});

router.get('/fail', requireAuth, (req, res) => {
  res.render('pages/subscription-result', { success: false });
});

router.post('/activate', requireAuth, async (req, res) => {
  const { plan_id } = req.body;
  const plan = await knex('plans').where({ id: plan_id }).first();
  if (!plan) {
    return res.redirect('/subscription');
  }

  const startAt = dayjs().toDate();
  const endAt = dayjs().add(plan.duration_days, 'day').toDate();

  await knex('subscriptions').insert({
    user_id: req.session.user.id,
    plan_id: plan.id,
    start_at: startAt,
    end_at: endAt,
    status: 'active'
  });

  return res.redirect('/dashboard');
});

module.exports = router;
