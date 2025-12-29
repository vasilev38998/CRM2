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
  const [sales, products] = await Promise.all([
    knex('sales')
      .join('products', 'sales.product_id', 'products.id')
      .where('sales.coffee_shop_id', shopId)
      .orderBy('sales.sold_at', 'desc')
      .select('sales.*', 'products.name as product_name'),
    knex('products').where({ coffee_shop_id: shopId })
  ]);
  res.render('pages/sales', { sales, products, error: null });
});

router.post('/', requireAuth, requireActiveSubscription, requireShop, async (req, res) => {
  const shopId = req.session.currentShop.id;
  const { product_id, quantity, price, sold_at } = req.body;
  if (!product_id || !quantity || !price || !sold_at) {
    const [sales, products] = await Promise.all([
      knex('sales')
        .join('products', 'sales.product_id', 'products.id')
        .where('sales.coffee_shop_id', shopId)
        .orderBy('sales.sold_at', 'desc')
        .select('sales.*', 'products.name as product_name'),
      knex('products').where({ coffee_shop_id: shopId })
    ]);
    return res.render('pages/sales', { sales, products, error: 'Заполните данные продажи' });
  }
  await knex('sales').insert({
    coffee_shop_id: shopId,
    product_id,
    quantity: Number(quantity),
    price: Number(price),
    sold_at: dayjs(sold_at).toDate()
  });
  return res.redirect('/sales');
});

router.get('/template', requireAuth, requireActiveSubscription, requireShop, (req, res) => {
  res.type('text/csv');
  res.send('product_id,quantity,price,sold_at\n1,10,250,2024-01-01');
});

router.post('/import', requireAuth, requireActiveSubscription, requireShop, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.redirect('/sales');
  }
  const rows = parse(req.file.buffer.toString('utf-8'), {
    columns: true,
    skip_empty_lines: true
  });

  const preview = rows.slice(0, 20).map((row) => ({
    product_id: Number(row.product_id),
    quantity: Number(row.quantity),
    price: Number(row.price),
    sold_at: row.sold_at
  }));

  req.session.csvPreview = { type: 'sales', rows: preview, allRows: rows };
  res.render('pages/csv-preview', { rows: preview, type: 'Продажи', action: '/sales/import/confirm' });
});

router.post('/import/confirm', requireAuth, requireActiveSubscription, requireShop, async (req, res) => {
  const shopId = req.session.currentShop.id;
  const preview = req.session.csvPreview;
  if (!preview || preview.type !== 'sales') {
    return res.redirect('/sales');
  }

  for (const row of preview.allRows) {
    await knex('sales').insert({
      coffee_shop_id: shopId,
      product_id: Number(row.product_id),
      quantity: Number(row.quantity),
      price: Number(row.price),
      sold_at: dayjs(row.sold_at).toDate()
    });
  }

  req.session.csvPreview = null;
  return res.redirect('/sales');
});

module.exports = router;
