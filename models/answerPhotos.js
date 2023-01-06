const schema = `
  CREATE TABLE IF NOT EXISTS answer_photos (
    id BIGSERIAL PRIMARY KEY,
    answer_id int,
    url varChar(1500),
    CONSTRAINT fk_answer_id
      FOREIGN KEY(answer_id)
        REFERENCES answers(answer_id)
  );
`;

exports.schema = schema;
