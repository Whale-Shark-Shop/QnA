const products = require('./models/products');
const questions = require('./models/questions');
const answers = require('./models/answers');
const answerPhotos = require('./models/answerPhotos');
const db = require('./db');

const models = [products, questions, answers, answerPhotos];

const printSchema = () => {
  models.forEach(file => {
    console.log('check product schema works', typeof file.schema, file.schema);
  });
};

db
  .connect()
  .then(() => {
    return db.query(products.schema);
  })
  .then(() => {
    return db.query(questions.schema);
  })
  .then(() => {
    return db.query(answers.schema);
  })
  .then(() => {
    return db.query(answerPhotos.schema)
      .then(() => {console.log('finished adding photos schema')})
      .catch((error) => {console.log(error)});
  })
  .then(() => {
    return db.query(`COPY products FROM '/Users/calvin/Documents/SDC/SDC_Application_Data/products.csv' DELIMITERS ',' CSV HEADER`);
  })
  .then(() => {
    return db.query(`COPY questions FROM '/Users/calvin/Documents/SDC/SDC_Application_Data/questions.csv'  DELIMITERS ',' CSV HEADER`)
      .then(() => {
        console.log('added questions');
      })
      .catch((err) => {
        console.log(err);
      });
  })
  .then(() => {
    console.log('completed questions, onto answers');
    return db.query(`COPY answers FROM '/Users/calvin/Documents/SDC/SDC_Application_Data/answers.csv' DELIMITERS ',' CSV HEADER`)
      .then(() => {
        console.log('added answers')
      })
      .catch((err) => {
        console.log(err);
      });
  })
  .then(() => {
    return db.query(`COPY answer_photos FROM '/Users/calvin/Documents/SDC/SDC_Application_Data/answers_photos.csv' DELIMITERS ',' CSV HEADER`)
      .then(() => {
        console.log('added answer_photos')
      })
      .catch((err) => {
        console.log(err);
      });
  })
  .then(async () => {
    // modifies existing tables
    console.log('Adding Indexes');
    const indexQuestion = await db.query(`CREATE INDEX idx_questions_product_id_hash ON questions USING HASH (product_id);`);
    const indexAnswer = await db.query(`CREATE INDEX idx_answers_question_id_hash ON answers USING HASH (question_id);`);
    const indexPhoto = await db.query(`CREATE INDEX idx_answerPhoto_answer_id_hash ON answer_photos USING HASH (answer_id);`);
    console.log('Added indices', indexQuestion, indexAnswer, indexPhoto);
  })
  .then(async () => {
    // correct Seqeuence
    const sequence = await db.query(`SELECT setval ('products_product_id_seq', (SELECT MAX(product_id) FROM products)+1);`);
    const questionSeq = await db.query(`SELECT setval ('questions_question_id_seq', (SELECT MAX(question_id) FROM questions)+1);`);
    const answerSeq = await db.query(`SELECT setval ('answers_answer_id_seq', (SELECT MAX(answer_id) FROM answers)+1);`);
    const answerPhotoSeq = await db.query(`SELECT setval ('answer_photos_id_seq', (SELECT MAX(answer_id) FROM answer_photos)+1);`);
    console.log('updated seqeuence', sequence, questionSeq, answerSeq, answerPhotoSeq);
  })
  .then(async () => {
    // TODO: count rows to ensure correctness;
    const productCount = await db.query(`SELECT COUNT (*) FROM products`);
    const questionCount = await db.query(`SELECT COUNT (*) FROM questions`);
    const answerCount = await db.query(`SELECT COUNT (*) FROM answers`);
    const answerPhotoCount = await db.query(`SELECT COUNT (*) FROM answer_photos`);

    return {
      productCount: productCount.rows[0],
      questionCount: questionCount.rows[0],
      answerCount: answerCount.rows[0],
      answerPhotosCount: answerPhotoCount.rows[0]
    };
  })
  .then((result) => {
    console.log(result);
    db.end()
      .then(() => {
        console.log('All items added -- ended connection with DB');
      })
      .catch((err) => {
        console.log('Could not exit database');
        return new Error(err);
      });
  });