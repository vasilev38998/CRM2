const express = require('express');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const dayjs = require('dayjs');
const knex = require('../db/knex');
const { requireAuth, requireActiveSubscription, requireShop } = require('./middleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

async function updateAvgCost(ingredientId) {
  const purchases = await knex('purchases').where({ ingredient_id: ingredientId });
  const totalQuantity = purchases.reduce((sum, purchase) => sum + Number(purchase.quantity), 0);
  const totalCost = purchases.reduce((sum, purchase) => sum + Number(purchase.total_cost), 0);
  const avgCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;
  await knex('ingredients').where({ id: ingredientId }).update({ avg_cost_per_unit: avgCost });
}

router.get('/', requireAuth, requireActiveSubscription, requireShop, async (req, res) => {
  const shopId = req.session.currentShop.id;
  const ingredients = await knex('ingredients').where({ coffee_shop_id: shopId });
  const purchases = await knex('purchases')
    .join('ingredients', 'purchases.ingredient_id', 'ingredients.id')
    .where('purchases.coffee_shop_id', shopId)
    .orderBy('purchases.purchased_at', 'desc')
    .select('purchases.*', 'ingredients.name as ingredient_name');
  res.render('pages/ingredients', { ingredients, purchases, error: null });
});

router.post('/', requireAuth, requireActiveSubscription, requireShop, async (req, res) => {
  const { name, unit } = req.body;
  const shopId = req.session.currentShop.id;
  if (!name || !unit) {
    const ingredients = await knex('ingredients').where({ coffee_shop_id: shopId });
    const purchases = await knex('purchases')
      .join('ingredients', 'purchases.ingredient_id', 'ingredients.id')
      .where('purchases.coffee_shop_id', shopId)
      .orderBy('purchases.purchased_at', 'desc')
      .select('purchases.*', 'ingredients.name as ingredient_name');
    return res.render('pages/ingredients', { ingredients, purchases, error: 'Введите данные ингредиента' });
  }
  await knex('ingredients').insert({ coffee_shop_id: shopId, name, unit });
  return res.redirect('/ingredients');
});

router.post('/purchase', requireAuth, requireActiveSubscription, requireShop, async (req, res) => {
  const shopId = req.session.currentShop.id;
  const { ingredient_id, quantity, total_cost, purchased_at } = req.body;
  if (!ingredient_id || !quantity || !total_cost || !purchased_at) {
    const ingredients = await knex('ingredients').where({ coffee_shop_id: shopId });
    const purchases = await knex('purchases').where({ coffee_shop_id: shopId }).orderBy('purchased_at', 'desc');
    return res.render('pages/ingredients', { ingredients, purchases, error: 'Заполните данные закупки' });
  }
  await knex('purchases').insert({
    coffee_shop_id: shopId,
    ingredient_id,
    quantity: Number(quantity),
    total_cost: Number(total_cost),
    purchased_at: dayjs(purchased_at).toDate()
  });
  await updateAvgCost(ingredient_id);
  return res.redirect('/ingredients');
});

router.get('/template', requireAuth, requireActiveSubscription, requireShop, (req, res) => {
  res.type('text/csv');
  res.send('ingredient_id,quantity,total_cost,purchased_at\n1,2.5,500,2024-01-01');
});

router.post('/import', requireAuth, requireActiveSubscription, requireShop, upload.single('file'), async (req, res) => {
  const shopId = req.session.currentShop.id;
  if (!req.file) {
    return res.redirect('/ingredients');
  }
  const rows = parse(req.file.buffer.toString('utf-8'), {
    columns: true,
    skip_empty_lines: true
  });

  const preview = rows.slice(0, 20).map((row) => ({
    ingredient_id: Number(row.ingredient_id),
    quantity: Number(row.quantity),
    total_cost: Number(row.total_cost),
    purchased_at: row.purchased_at
  }));

  req.session.csvPreview = { type: 'purchases', rows: preview, allRows: rows };
  res.render('pages/csv-preview', { rows: preview, type: 'Закупки', action: '/ingredients/import/confirm' });
});

router.post('/import/confirm', requireAuth, requireActiveSubscription, requireShop, async (req, res) => {
  const shopId = req.session.currentShop.id;
  const preview = req.session.csvPreview;
  if (!preview || preview.type !== 'purchases') {
    return res.redirect('/ingredients');
  }

  for (const row of preview.allRows) {
    const ingredientId = Number(row.ingredient_id);
    await knex('purchases').insert({
      coffee_shop_id: shopId,
      ingredient_id: ingredientId,
      quantity: Number(row.quantity),
      total_cost: Number(row.total_cost),
      purchased_at: dayjs(row.purchased_at).toDate()
    });
    await updateAvgCost(ingredientId);
  }

  req.session.csvPreview = null;
  return res.redirect('/ingredients');
});

module.exports = router;
