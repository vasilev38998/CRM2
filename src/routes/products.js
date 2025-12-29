const express = require('express');
const knex = require('../db/knex');
const { requireAuth, requireActiveSubscription, requireShop } = require('./middleware');

const router = express.Router();

router.get('/', requireAuth, requireActiveSubscription, requireShop, async (req, res) => {
  const shopId = req.session.currentShop.id;
  const [products, ingredients, recipes] = await Promise.all([
    knex('products').where({ coffee_shop_id: shopId }),
    knex('ingredients').where({ coffee_shop_id: shopId }),
    knex('recipes')
      .join('products', 'recipes.product_id', 'products.id')
      .join('ingredients', 'recipes.ingredient_id', 'ingredients.id')
      .where('products.coffee_shop_id', shopId)
      .select('recipes.*', 'products.name as product_name', 'ingredients.name as ingredient_name')
  ]);

  res.render('pages/products', { products, ingredients, recipes, error: null });
});

router.post('/', requireAuth, requireActiveSubscription, requireShop, async (req, res) => {
  const shopId = req.session.currentShop.id;
  const { name, price } = req.body;
  if (!name || !price) {
    const [products, ingredients, recipes] = await Promise.all([
      knex('products').where({ coffee_shop_id: shopId }),
      knex('ingredients').where({ coffee_shop_id: shopId }),
      knex('recipes')
        .join('products', 'recipes.product_id', 'products.id')
        .join('ingredients', 'recipes.ingredient_id', 'ingredients.id')
        .where('products.coffee_shop_id', shopId)
        .select('recipes.*', 'products.name as product_name', 'ingredients.name as ingredient_name')
    ]);
    return res.render('pages/products', { products, ingredients, recipes, error: 'Введите данные напитка' });
  }
  await knex('products').insert({ coffee_shop_id: shopId, name, price: Number(price) });
  return res.redirect('/products');
});

router.post('/:id/recipe', requireAuth, requireActiveSubscription, requireShop, async (req, res) => {
  const { ingredient_id, quantity } = req.body;
  if (!ingredient_id || !quantity) {
    return res.redirect('/products');
  }
  await knex('recipes').insert({
    product_id: req.params.id,
    ingredient_id,
    quantity: Number(quantity)
  });
  return res.redirect('/products');
});

module.exports = router;
