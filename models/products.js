// schema for the products
const productsSchema = `
  CREATE TABLE IF NOT EXISTS products (
    product_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(250),
    slogan VARCHAR(300),
    description VARCHAR(1200),
    category VARCHAR(250),
    default_price int
  );
`;

exports.schema = productsSchema;
