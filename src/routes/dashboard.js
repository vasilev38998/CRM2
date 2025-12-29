const express = require('express');
const knex = require('../db/knex');
const { requireAuth, requireActiveSubscription, requireShop } = require('./middleware');
const { calculateAnalytics } = require('../utils/analytics');

const router = express.Router();

router.get('/dashboard', requireAuth, requireActiveSubscription, requireShop, async (req, res) => {
  const shopId = req.session.currentShop.id;

  const [sales, expenses, recipes, products, ingredients] = await Promise.all([
    knex('sales').where({ coffee_shop_id: shopId }),
    knex('expenses').where({ coffee_shop_id: shopId }),
    knex('recipes').join('products', 'recipes.product_id', 'products.id').where('products.coffee_shop_id', shopId).select('recipes.*'),
    knex('products').where({ coffee_shop_id: shopId }),
    knex('ingredients').where({ coffee_shop_id: shopId })
  ]);

  const analytics = calculateAnalytics({ sales, expenses, recipes, products, ingredients });

  res.render('pages/dashboard', { analytics });
});

router.get('/pnl', requireAuth, requireActiveSubscription, requireShop, async (req, res) => {
  const shopId = req.session.currentShop.id;
  const [sales, expenses, recipes, products, ingredients] = await Promise.all([
    knex('sales').where({ coffee_shop_id: shopId }),
    knex('expenses').where({ coffee_shop_id: shopId }),
    knex('recipes').join('products', 'recipes.product_id', 'products.id').where('products.coffee_shop_id', shopId).select('recipes.*'),
    knex('products').where({ coffee_shop_id: shopId }),
    knex('ingredients').where({ coffee_shop_id: shopId })
  ]);

  const analytics = calculateAnalytics({ sales, expenses, recipes, products, ingredients });
  res.render('pages/pnl', { analytics });
});

module.exports = router;
