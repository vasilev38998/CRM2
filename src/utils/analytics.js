function calculateAnalytics({ sales, expenses, recipes, products, ingredients }) {
  const revenue = sales.reduce((sum, sale) => sum + Number(sale.price) * Number(sale.quantity), 0);

  const ingredientCostMap = new Map();
  ingredients.forEach((ingredient) => {
    ingredientCostMap.set(ingredient.id, Number(ingredient.avg_cost_per_unit));
  });

  const recipeMap = new Map();
  recipes.forEach((recipe) => {
    if (!recipeMap.has(recipe.product_id)) {
      recipeMap.set(recipe.product_id, []);
    }
    recipeMap.get(recipe.product_id).push(recipe);
  });

  const cogs = sales.reduce((sum, sale) => {
    const recipeItems = recipeMap.get(sale.product_id) || [];
    const recipeCost = recipeItems.reduce((recipeSum, item) => {
      const unitCost = ingredientCostMap.get(item.ingredient_id) || 0;
      return recipeSum + unitCost * Number(item.quantity);
    }, 0);
    return sum + recipeCost * Number(sale.quantity);
  }, 0);

  const grossProfit = revenue - cogs;
  const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

  const operatingExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const netProfit = grossProfit - operatingExpenses;
  const profitability = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  const productMargins = products.map((product) => {
    const productSales = sales.filter((sale) => sale.product_id === product.id);
    const productRevenue = productSales.reduce((sum, sale) => sum + Number(sale.price) * Number(sale.quantity), 0);
    const recipeItems = recipeMap.get(product.id) || [];
    const productCogsPerUnit = recipeItems.reduce((recipeSum, item) => {
      const unitCost = ingredientCostMap.get(item.ingredient_id) || 0;
      return recipeSum + unitCost * Number(item.quantity);
    }, 0);
    const productCogs = productSales.reduce((sum, sale) => sum + productCogsPerUnit * Number(sale.quantity), 0);
    const productGrossProfit = productRevenue - productCogs;
    const margin = productRevenue > 0 ? (productGrossProfit / productRevenue) * 100 : 0;

    return {
      product,
      revenue: productRevenue,
      cogs: productCogs,
      grossProfit: productGrossProfit,
      margin
    };
  });

  const breakEvenRevenue = grossMargin > 0 ? operatingExpenses / (grossMargin / 100) : 0;
  const breakEvenPoint = revenue > 0 ? (breakEvenRevenue / revenue) * 100 : 0;

  return {
    revenue,
    cogs,
    grossProfit,
    grossMargin,
    operatingExpenses,
    netProfit,
    profitability,
    productMargins,
    breakEvenRevenue,
    breakEvenPoint
  };
}

module.exports = {
  calculateAnalytics
};
