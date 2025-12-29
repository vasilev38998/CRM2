const dayjs = require('dayjs');
const knex = require('../db/knex');

async function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  return next();
}

async function requireActiveSubscription(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const now = dayjs().toDate();
  const active = await knex('subscriptions')
    .where({ user_id: req.session.user.id, status: 'active' })
    .andWhere('start_at', '<=', now)
    .andWhere('end_at', '>=', now)
    .first();

  if (!active) {
    return res.redirect('/subscription');
  }

  return next();
}

async function requireShop(req, res, next) {
  if (!req.session.currentShop) {
    return res.redirect('/shops');
  }
  return next();
}

async function requireAdmin(req, res, next) {
  if (!req.session.user || !req.session.user.is_admin) {
    return res.status(403).render('pages/403');
  }
  return next();
}

module.exports = {
  requireAuth,
  requireActiveSubscription,
  requireShop,
  requireAdmin
};
