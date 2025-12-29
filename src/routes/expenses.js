const express = require('express');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const dayjs = require('dayjs');
const knex = require('../db/knex');
const { requireAuth, requireActiveSubscription, requireShop } = require('./middleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', requireAuth, requireActiveSubscription, requireShop, async (req, res) => {
  const shopId = req.session.currentShop.id;
  const expenses = await knex('expenses').where({ coffee_shop_id: shopId }).orderBy('expense_at', 'desc');
  res.render('pages/expenses', { expenses, error: null });
});

router.post('/', requireAuth, requireActiveSubscription, requireShop, async (req, res) => {
  const shopId = req.session.currentShop.id;
  const { name, amount, category, expense_at } = req.body;
  if (!name || !amount || !category || !expense_at) {
    const expenses = await knex('expenses').where({ coffee_shop_id: shopId }).orderBy('expense_at', 'desc');
    return res.render('pages/expenses', { expenses, error: 'Заполните данные расхода' });
  }
  await knex('expenses').insert({
    coffee_shop_id: shopId,
    name,
    amount: Number(amount),
    category,
    expense_at: dayjs(expense_at).toDate()
  });
  return res.redirect('/expenses');
});

router.get('/template', requireAuth, requireActiveSubscription, requireShop, (req, res) => {
  res.type('text/csv');
  res.send('name,amount,category,expense_at\nАренда,50000,Аренда,2024-01-01');
});

router.post('/import', requireAuth, requireActiveSubscription, requireShop, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.redirect('/expenses');
  }
  const rows = parse(req.file.buffer.toString('utf-8'), {
    columns: true,
    skip_empty_lines: true
  });

  const preview = rows.slice(0, 20).map((row) => ({
    name: row.name,
    amount: Number(row.amount),
    category: row.category,
    expense_at: row.expense_at
  }));

  req.session.csvPreview = { type: 'expenses', rows: preview, allRows: rows };
  res.render('pages/csv-preview', { rows: preview, type: 'Расходы', action: '/expenses/import/confirm' });
});

router.post('/import/confirm', requireAuth, requireActiveSubscription, requireShop, async (req, res) => {
  const shopId = req.session.currentShop.id;
  const preview = req.session.csvPreview;
  if (!preview || preview.type !== 'expenses') {
    return res.redirect('/expenses');
  }

  for (const row of preview.allRows) {
    await knex('expenses').insert({
      coffee_shop_id: shopId,
      name: row.name,
      amount: Number(row.amount),
      category: row.category,
      expense_at: dayjs(row.expense_at).toDate()
    });
  }

  req.session.csvPreview = null;
  return res.redirect('/expenses');
});

module.exports = router;
