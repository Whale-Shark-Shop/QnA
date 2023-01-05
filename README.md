# QnA

App to query data for questions and answers in Atelier E-commerce site


## Dev Dependencies

- Uses node-postgres (pg-admin) for ETL process
- Plans to switch queries from using node-postgres to using pg-promise to make queries to the database

## Folder Structure

```
- src \
  |-- config\
  |-- controllers\
  |-- docs\
  |-- middlewares\
  |-- models\
  |-- routes\
  |-- services\
  |-- utils\
  |-- validations\
  |-- app.js
  |-- index.js
```

## Git workflow
If you are already on local branch. Use -u to establish origin.

```
git checkout <branch-name>
git push -u origin <branch-name>
```