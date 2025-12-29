require('dotenv').config();
const knex = require('./knex');

async function seedPlans() {
  const existing = await knex('plans').select('id').limit(1);
  if (existing.length) {
    console.log('Plans already seeded');
    return;
  }

  await knex('plans').insert([
    {
      name: 'Trial 7 дней',
      price_rub: 299,
      duration_days: 7,
      description: 'Базовый доступ для проверки сервиса'
    },
    {
      name: 'Pro 30 дней',
      price_rub: 1299,
      duration_days: 30,
      description: 'Полный доступ для небольшой сети'
    },
    {
      name: 'Maxi 30 дней',
      price_rub: 2499,
      duration_days: 30,
      description: 'Расширенный доступ и приоритет'
    }
  ]);

  console.log('Plans seeded');
}

seedPlans()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seed error', error);
    process.exit(1);
  });
