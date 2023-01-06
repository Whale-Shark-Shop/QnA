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

const copyFile = `COPY products FROM '/home/ec2-user/product.csv' DELIMITERS ',' CSV HEADER`;

const updateIndex = `SELECT setval ('products_product_id_seq', (SELECT MAX(product_id) FROM products)+1);`;

const createIndex = `CREATE INDEX idx_questions_product_id_hash ON questions USING HASH (product_id);`;

exports.schema = productsSchema;
exports.copyFile = copyFile;
exports.updateIndex = updateIndex;
exports.createIndex = createIndex;
