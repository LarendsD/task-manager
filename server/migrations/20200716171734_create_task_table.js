// @ts-check

export const up = (knex) => knex.schema.createTable('tasks', (table) => {
  table.increments('id').primary();
  table.string('name');
  table.string('description');
  table.integer('status_id').unsigned();
  table.foreign('status_id')
    .references('id')
    .inTable('task_statuses');
  table.integer('creator_id').unsigned();
  table.foreign('creator_id')
    .references('id')
    .inTable('users');
  table.integer('executor_id').unsigned();
  table.foreign('executor_id')
    .references('id')
    .inTable('users');
  table.timestamp('created_at').defaultTo(knex.fn.now());
  table.timestamp('updated_at').defaultTo(knex.fn.now());
}).then(() => console.log('tasks done'));

export const down = (knex) => knex.schema.dropTable('tasks').then(() => console.log('drop tasks done!'));
