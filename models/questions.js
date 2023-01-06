/* eslint-disable no-unused-vars */
const questionsSchema = `
  CREATE TABLE IF NOT EXISTS questions (
    question_id BIGSERIAL PRIMARY KEY,
    product_id BIGINT,
    question_body varChar(1200),
    question_date BIGINT DEFAULT (date_part('epoch'::text, now()) * (1000)::double precision),
    asker_name varChar(200),
    asker_email varChar(200),
    reported BOOLEAN DEFAULT FALSE,
    helpful int DEFAULT 0,
    CONSTRAINT fk_product_id
      FOREIGN KEY(product_id)
        REFERENCES products(product_id)
);`;

exports.schema = questionsSchema;

// var module = { exports: {} };
// var exports = module.exports;
  // // your code
// return module.exports;