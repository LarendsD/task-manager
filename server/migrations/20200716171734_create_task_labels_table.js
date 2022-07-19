// @ts-check

export const up = (knex) => (
    knex.schema.createTable('task_labels', (table) => {
      table.increments('id').primary();
      table.integer('task_id').unsigned();
      table.foreign('task_id')
        .references('id')
        .inTable('tasks');
      table.integer('label_id').unsigned();
      table.foreign('label_id')
        .references('id')
        .inTable('labels');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    }
  )
)
  
export const down = (knex) => {
  knex.schema.dropTable('task_labels');
}