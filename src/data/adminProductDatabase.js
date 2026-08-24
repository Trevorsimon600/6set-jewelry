/*
|--------------------------------------------------------------------------
| ADMIN PRODUCT DATABASE (LOCAL HELPERS)
|--------------------------------------------------------------------------
| 6SET JEWELRY
|
| Pure, local helpers used to seed and validate the admin
| product/category forms. No Supabase calls live here — that's
| productService.js and categoryService.js.
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| EMPTY CATEGORY
|--------------------------------------------------------------------------
*/

export function createEmptyCategory() {
  return {
    name: "",
    slug: "",
    description: "",
    published: true,
    image: "",
  };
}


/*
|--------------------------------------------------------------------------
| EMPTY PRODUCT
|--------------------------------------------------------------------------
*/

export function createEmptyProduct() {
  return {
    name: "",
    category: "",
    categoryId: "",
    productCode: "",
    description: "",
    price: "",
    initialStock: 0,
    currentStock: 0,
    minimumOrderQuantity: 1,
    maximumOrderQuantity: 10,
    lowStockThreshold: 5,
    published: true,
    mainImage: "",
  };
}


/*
|--------------------------------------------------------------------------
| PRICE VALIDATION
|--------------------------------------------------------------------------
*/

export function isValidPrice(value) {
  if (value === null || value === undefined || value === "") {
    return false;
  }

  const number = Number(value);

  return Number.isFinite(number) && number > 0;
}


/*
|--------------------------------------------------------------------------
| PRICE FORMATTING
|--------------------------------------------------------------------------
*/

export function formatPrice(value) {
  const number = Number(value || 0);

  return `KES ${number.toLocaleString("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}


const adminProductDatabase = {
  createEmptyCategory,
  createEmptyProduct,
  isValidPrice,
  formatPrice,
};

export default adminProductDatabase;