// @ts-check

export const up = (knex) => knex.schema.createTable('task_labels', (table) => {
  table.increments('id').primary();
  table.integer('task_id').unsigned();
  table.integer('label_id').unsigned();
  table.timestamp('created_at').defaultTo(knex.fn.now());
  table.timestamp('updated_at').defaultTo(knex.fn.now());
}).then(() => console.log('tasks_labels done'));

export const down = (knex) => knex.schema.dropTable('task_labels').then(() => console.log('drop task_labels done'));
