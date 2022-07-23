// @ts-check

export const up = (knex) => {
    return knex.schema.createTable('task_labels', (table) => {
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
  ).then(() => console.log('tasks_labels done'))
}
  
export const down = (knex) => {
  return knex.schema.dropTable('task_labels').then(() => console.log('drop task_labels done'))
}