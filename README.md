<h1 align="center">
  Менеджер задач
</h1>

[![Actions Status](https://github.com/LarendsD/backend-project-lvl4/workflows/hexlet-check/badge.svg)](https://github.com/LarendsD/backend-project-lvl4/actions)
<a href="https://codeclimate.com/github/LarendsD/backend-project-lvl4/maintainability"><img src="https://api.codeclimate.com/v1/badges/c4a9e975fd756a6b2447/maintainability" /></a>

## :mag_right: Демо ##
Попробовать <a href=https://manager-app4.herokuapp.com/> менеджер задач </a>.
## :pencil2: Возможности ##
Данное веб-приложение позволяет:
- **Создавать, редактировать задачи как других пользователей, так и своих**
- **Удалять свои задачи**
- **Создавать, редактировать и удалять статусы, которые будут использоваться в задачах**
- **Создавать, редактировать и удалять метки, которые будут использоваться в задачах**
## 🛠️ Инструкция для локального развертывания ##
1. Склонировать данный репозиторий
```bash
git clone https://github.com/LarendsD/backend-project-lvl4.git
```
2. Развернуть локально
```bash
make setup
```
3. Запустить сервер локально
```bash
make start
```
### :checkered_flag: Далее сервер будет доступен для локального использования!

## :large_blue_circle: Локальная разработка ##
- **Для запуска тестов используйте
```bash
make test
```
- **Чтобы выполнить миграции используйте
```bash
make db-migrate
```
### :wrench: Инструменты, используемые в разработке
- **Веб-фреймворк <a href=https://www.fastify.io>fastify</a>**
- **Верстка страниц <a href=https://getbootstrap.com/>bootstrap</a>**
- **Для текстов <a href=https://www.i18next.com/>i18next</a>**
- **Миграции <a href=https://knexjs.org/>knex</a>**
- **ORM <a href=https://vincit.github.io/objection.js/>objection.js</a>**
- **Шаблонизатор <a href=https://pugjs.org/>pug</a>**
- **Обработчик ошибок <a href=https://rollbar.com/>rollbar</a>**
- **SQL БД(локально) <a href=https://www.sqlite.org/index.html>sqlite</a>**
- **SQL БД(на демо) <a href=https://www.postgresql.org/>postgreSQL</a>**
