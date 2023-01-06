const pdb = require('./db');

pdb.connect().
  then(res => {
    console.log('listening on port', 5432);
  }).
  catch(err => {
    console.log(err);
  });

//import path from 'path';
// import { fileURLToPath } from 'url';

//const __filename = fileURLToPath(import.meta.url);
//const __dirname = path.dirname(__filename);

const express = require('express');
// require('dontenv').config();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const path = require('path');
const url = require('url');
const querystring = require('querystring');
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

const app = express();
app.use(morgan('dev'));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended:true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/../public')));

// TODO: replace with ENV
const port = 3000;

// Helper function: accepts array of objects and iterates through array to form an object of objects with modified fields;
const transformAnswersInQuestions = async (arrayOfAnswers) => {
  const objectOfAnswers = await arrayOfAnswers.reduce(async (prev, cur) => {
    const object = await prev; // putting await here forces asynchronous reduce to run sequentially rather than in parallel
    let _photos = await pdb.query(`SELECT url FROM answer_photos WHERE answer_id = ${cur['answer_id']}`)
    _photos = _photos.rows.map(el => el.url);
    object[Number(cur['answer_id'])] = {
      id: cur['answer_id'],
      body: cur['answer_body'],
      date: new Date(Number(cur['answer_date'])),
      answerer_name: cur['answerer_name'],
      helpfulness: cur['helpful'],
      photos: _photos
    };
    return prev;
  }, {});

  return objectOfAnswers;
};

// api to get reviews
app.get('/qa/questions', async (req, res) => {
  const rq = req.query;

  const psqlQuestionsQuery = `SELECT question_id, question_body, question_date, asker_name, reported, helpful FROM questions WHERE product_id = ${rq['product_id']} AND reported = false LIMIT ${rq.count}`;
  const questions = await pdb.query(psqlQuestionsQuery);

  for (let i = 0; i < questions.rows.length; i++) {
    const answerid = questions.rows[i]['question_id'];
    const listanswers = await pdb.query(`SELECT * FROM answers where question_id = ${answerid}`);
    const answersAsObject = await transformAnswersInQuestions(listanswers.rows);
    questions.rows[i].answers = answersAsObject;
  }

  res.send(JSON.stringify({
    product_id: req.query['product_id'],
    results: questions.rows
  }));
})

// Gets all the answers for a single question:
app.get('/qa/questions/:questionID/answers', async (req, res) => {
  let rq = req.query;
  // let [qID, page, count] = [rq['question_id'], rq['page']], rq['count'];
  let qID = req.params.questionID;
  let page = rq['page'];
  let count = rq['count'];
  let offset = (count * (page - 1));

  const listAnswersQuery = await pdb.query(`SELECT * FROM answers WHERE question_id = ${qID} AND reported = false ORDER BY answer_id LIMIT ${count} OFFSET ${offset}`);

  const response = await Promise.all(listAnswersQuery.rows.map(async (el) => {
    const photos = await pdb.query(`select id, url FROM answer_photos where answer_id = ${el['answer_id']}`);
    // console.log(photos.rows);
    const urls = photos.rows;
    const inputObject = await {
      answer_id: el['answer_id'],
      body: el['answer_body'],
      date: new Date(Number(el['answer_date'])),
      answerer_name: el['answerer_name'],
      helpfulness: el['helpful'],
      photos: urls
    }
    return inputObject;
  }));

  res.end(JSON.stringify({
    question: qID,
    page: Number(page),
    count: Number(count),
    response: response}));
})

// TODO: Submit a question:
app.post('/qa/questions/', async (req, res) => {
  const body = req.body.body;
  const name = req.body.name;
  const email = req.body.email;
  const productID = req.body['product_id'];
  const values = [productID, body, name, email];

  // organize the data into a json object that can accept the current data:
  const insertQuery = {
    text: 'insert into questions (product_id, question_body, asker_name, asker_email) VALUES ( $1, $2, $3, $4)',
    values: values
  }

  await pdb.query(insertQuery);

  res.end();
});

app.post('/qa/questions/:question_id/answers', async (req, res) => {
  const body = req.body.body;
  const name = req.body.name;
  const email = req.body.email;
  const questionID = req.params['question_id'];
  const photos = req.body.photos;
  const values = [questionID, body, name, email];

  // TODO: ------------------------------------------------->
  // TODO:Add new Answer to Answers =>
  // TODO: return the answer_id and save to a variable
  const insertAnswerQuery = {
    text: 'insert into answers (question_id, answer_body, answerer_name, answerer_email) VALUES ( $1, $2, $3, $4 ) RETURNING answer_id',
    values: values
  }

  const newAnswerID = await pdb.query(insertAnswerQuery)
    .catch((err) => {
      console.log(err)
      res.send(err);
    }); //returns an object with rows

  const newPhotosJSON = photos.map((el) => {
    // console.log('inside the function definition', newAnswerID.rows[0]['answer_id']);
    // eslint-disable-next-line dot-notation
    const answerID = newAnswerID.rows[0]['answer_id']
    const object = {
      answer_id: answerID,
      url: el
    }
    return object
  })

  // console.log('this is the array of objects to be inserted', newPhotosJSON);

  await pdb.query('INSERT INTO answer_photos (answer_id, url) ' +
              'SELECT answer_id, url FROM json_populate_recordset(null::answer_photos, $1)', [JSON.stringify(newPhotosJSON)])

  res.end(JSON.stringify(newAnswerID[0]));
})

// TODO: endpoint for marking QUESTIONS - helpful
app.put('/qa/questions/:questionID/helpful', async (req, res) => {
  // console.log('just need to know ID', req.query, req.body);

  const questionID = req.params.questionID;
  const updateQuery = `UPDATE questions
                    SET helpful = questions.helpful + 1
                    WHERE question_id = ${questionID}
                    RETURNING *;`;
  const updatedRow = await pdb.query(updateQuery);
  // console.log(updatedRow.rows);
  res.end(JSON.stringify(updatedRow.rows));
})

// Report QUESTIONs
app.put('/qa/questions/:questionID/report', async (req, res) => {
  // console.log('just need to know ID', req.query, req.body);

  const questionID = req.params.questionID;
  const updateQuery = `UPDATE questions
                    SET reported = true
                    WHERE question_id = ${questionID}
                    RETURNING *;`;
  const updatedRow = await pdb.query(updateQuery);
  // console.log(updatedRow.rows);
  res.end(JSON.stringify(updatedRow.rows));
})

// set ANSWERs as HELPFUL
app.put('/qa/answers/:answerID/helpful', async (req, res) => {
  console.log('just need to know ID', req.query, req.body);

  const answerID = req.params.answerID;
  const updateQuery = `UPDATE answers
                    SET helpful = answers.helpful + 1
                    WHERE answer_id = ${answerID}
                    RETURNING *;`;
  const updatedRow = await pdb.query(updateQuery);
  // console.log(updatedRow.rows);
  res.end(JSON.stringify(updatedRow.rows));
})

// report ANSWERS
app.put('/qa/answers/:answerID/report', async (req, res) => {
  console.log('just need to know ID', req.query, req.body);

  const answerID = req.params.answerID
  const updateQuery = `UPDATE answers
                    SET reported = true
                    WHERE answer_id = ${answerID}
                    RETURNING *;`
  const updatedRow = await pdb.query(updateQuery)
  // console.log(updatedRow.rows)
  res.end(JSON.stringify(updatedRow.rows))
})

app.listen(port, () => {
  console.log('Successful Connection')
  console.log(`To get started, visit: http://localhost:${port}`)
})
