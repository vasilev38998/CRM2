require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const shopRoutes = require('./routes/shops');
const planRoutes = require('./routes/plans');
const productRoutes = require('./routes/products');
const ingredientRoutes = require('./routes/ingredients');
const salesRoutes = require('./routes/sales');
const expenseRoutes = require('./routes/expenses');
const subscriptionRoutes = require('./routes/subscription');
const webhookRoutes = require('./routes/webhooks');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'change_me',
    resave: false,
    saveUninitialized: false
  })
);

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.currentShop = req.session.currentShop || null;
  next();
});

app.use('/', authRoutes);
app.use('/', planRoutes);
app.use('/', dashboardRoutes);
app.use('/shops', shopRoutes);
app.use('/products', productRoutes);
app.use('/ingredients', ingredientRoutes);
app.use('/sales', salesRoutes);
app.use('/expenses', expenseRoutes);
app.use('/subscription', subscriptionRoutes);
app.use('/webhooks', webhookRoutes);

app.use((req, res) => {
  res.status(404).render('pages/404');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});
