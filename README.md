<h1 align="center">
  Task manager
</h1>

[![Actions Status](https://github.com/LarendsD/backend-project-lvl4/workflows/hexlet-check/badge.svg)](https://github.com/LarendsD/backend-project-lvl4/actions)
<a href="https://codeclimate.com/github/LarendsD/backend-project-lvl4/maintainability"><img src="https://api.codeclimate.com/v1/badges/c4a9e975fd756a6b2447/maintainability" /></a>

## :mag_right: Demo ##
Try <a href=https://task-manager.up.railway.app/> task manager </a>.

## :pencil2: Capabilities ##
This web application allows:
- **Create, edit own and other users tasks**
- **Delete own tasks**
- **Create, edit and delete statuses, which can be used in tasks**
- **Create, edit and delete labels, wthich can be user in tasks**
## 🛠️ Instruction for local deployment ##
1. Clone this repo:
```bash
git clone https://github.com/LarendsD/backend-project-lvl4.git
```
2. Deploy locally:
```bash
make setup
```
3. Run server locally:
```bash
make start
```
### :checkered_flag: Next, the server will be available for local use!

## :large_blue_circle: Local development ##
- **Run tests**
```bash
make test
```
- **Run migrations**
```bash
make db-migrate
```

- **Drop migrations**
```bash
make db-drop
```

### :wrench: Tools, which used in development:
- **Web-framework <a href=https://www.fastify.io>fastify</a>**
- **Pages markup <a href=https://getbootstrap.com/>bootstrap</a>**
- **Text <a href=https://www.i18next.com/>i18next</a>**
- **Migrations <a href=https://knexjs.org/>knex</a>**
- **ORM <a href=https://vincit.github.io/objection.js/>objection.js</a>**
- **Template engine <a href=https://pugjs.org/>pug</a>**
- **Error logging <a href=https://rollbar.com/>rollbar</a>**
- **SQL DB(locally) <a href=https://www.sqlite.org/index.html>sqlite</a>**
- **SQL DB(on demo) <a href=https://www.postgresql.org/>postgreSQL</a>**
