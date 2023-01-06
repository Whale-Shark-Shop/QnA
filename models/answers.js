const schema = `
CREATE TABLE IF NOT EXISTS answers (
  answer_id BIGSERIAL PRIMARY KEY,
  question_id int,
  answer_body varChar(1200),
  answer_date BIGINT DEFAULT (date_part('epoch'::text, now()) * (1000)::double precision),
  answerer_name varChar(200),
  answerer_email varChar(200),
  reported BOOLEAN DEFAULT FALSE,
  helpful int DEFAULT 0,
  CONSTRAINT fk_question_id
    FOREIGN KEY(question_id)
      REFERENCES questions(question_id)
);
`;

exports.schema = schema;
