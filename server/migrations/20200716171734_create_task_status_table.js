// @ts-check

export const up = (knex) => {
  return knex.schema.createTable('task_statuses', (table) => {
    table.increments('id').primary();
    table.string('name');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  }).then(() => console.log('task_statuses done'));
};
  
export const down = (knex) => {
  return knex.schema.dropTable('task_statuses').then(() => console.log('task_statuses drop done!'));
};
