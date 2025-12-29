const express = require('express');
const dayjs = require('dayjs');
const knex = require('../db/knex');
const { verifyTinkoffSignature } = require('../utils/tinkoff');

const router = express.Router();

router.post('/tinkoff', async (req, res) => {
  const password = process.env.TINKOFF_PASSWORD || '';
  const isValid = verifyTinkoffSignature(req.body, password);
  if (!isValid) {
    return res.status(400).json({ success: false });
  }

  const { PaymentId, Status, OrderId } = req.body;
  const payment = await knex('payments').where({ provider_payment_id: PaymentId }).first();
  if (!payment) {
    return res.status(404).json({ success: false });
  }

  await knex('payments')
    .where({ id: payment.id })
    .update({ status: Status?.toLowerCase() || 'unknown', payload: JSON.stringify(req.body) });

  if (Status === 'CONFIRMED') {
    const plan = await knex('plans').where({ id: payment.plan_id }).first();
    if (plan) {
      const startAt = dayjs().toDate();
      const endAt = dayjs().add(plan.duration_days, 'day').toDate();
      await knex('subscriptions').insert({
        user_id: payment.user_id,
        plan_id: plan.id,
        start_at: startAt,
        end_at: endAt,
        status: 'active'
      });
    }
  }

  return res.json({ success: true, orderId: OrderId });
});

module.exports = router;
