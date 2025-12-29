exports.up = async function up(knex) {
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('name');
    table.string('email').notNullable().unique();
    table.string('password_hash').notNullable();
    table.boolean('is_admin').notNullable().defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('coffee_shops', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('users.id').onDelete('CASCADE');
    table.string('name').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('plans', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.integer('price_rub').notNullable();
    table.integer('duration_days').notNullable();
    table.text('description');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('subscriptions', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('users.id').onDelete('CASCADE');
    table.integer('plan_id').unsigned().references('plans.id').onDelete('SET NULL');
    table.timestamp('start_at').notNullable();
    table.timestamp('end_at').notNullable();
    table.string('status').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('payments', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('users.id').onDelete('CASCADE');
    table.integer('plan_id').unsigned().references('plans.id').onDelete('SET NULL');
    table.integer('amount_rub').notNullable();
    table.string('status').notNullable();
    table.string('provider').notNullable();
    table.string('provider_payment_id');
    table.json('payload');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('ingredients', (table) => {
    table.increments('id').primary();
    table.integer('coffee_shop_id').unsigned().references('coffee_shops.id').onDelete('CASCADE');
    table.string('name').notNullable();
    table.string('unit').notNullable();
    table.decimal('avg_cost_per_unit', 12, 4).notNullable().defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('purchases', (table) => {
    table.increments('id').primary();
    table.integer('coffee_shop_id').unsigned().references('coffee_shops.id').onDelete('CASCADE');
    table.integer('ingredient_id').unsigned().references('ingredients.id').onDelete('CASCADE');
    table.decimal('quantity', 12, 4).notNullable();
    table.decimal('total_cost', 12, 2).notNullable();
    table.timestamp('purchased_at').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('products', (table) => {
    table.increments('id').primary();
    table.integer('coffee_shop_id').unsigned().references('coffee_shops.id').onDelete('CASCADE');
    table.string('name').notNullable();
    table.decimal('price', 12, 2).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('recipes', (table) => {
    table.increments('id').primary();
    table.integer('product_id').unsigned().references('products.id').onDelete('CASCADE');
    table.integer('ingredient_id').unsigned().references('ingredients.id').onDelete('CASCADE');
    table.decimal('quantity', 12, 4).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('sales', (table) => {
    table.increments('id').primary();
    table.integer('coffee_shop_id').unsigned().references('coffee_shops.id').onDelete('CASCADE');
    table.integer('product_id').unsigned().references('products.id').onDelete('SET NULL');
    table.decimal('quantity', 12, 2).notNullable();
    table.decimal('price', 12, 2).notNullable();
    table.timestamp('sold_at').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('expenses', (table) => {
    table.increments('id').primary();
    table.integer('coffee_shop_id').unsigned().references('coffee_shops.id').onDelete('CASCADE');
    table.string('name').notNullable();
    table.decimal('amount', 12, 2).notNullable();
    table.string('category').notNullable();
    table.timestamp('expense_at').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('password_resets', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('users.id').onDelete('CASCADE');
    table.string('token').notNullable();
    table.timestamp('expires_at').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('password_resets');
  await knex.schema.dropTableIfExists('expenses');
  await knex.schema.dropTableIfExists('sales');
  await knex.schema.dropTableIfExists('recipes');
  await knex.schema.dropTableIfExists('products');
  await knex.schema.dropTableIfExists('purchases');
  await knex.schema.dropTableIfExists('ingredients');
  await knex.schema.dropTableIfExists('payments');
  await knex.schema.dropTableIfExists('subscriptions');
  await knex.schema.dropTableIfExists('plans');
  await knex.schema.dropTableIfExists('coffee_shops');
  await knex.schema.dropTableIfExists('users');
};
