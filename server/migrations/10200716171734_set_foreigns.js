export const up = (knex) => {
  knex.schema.table('task_labels', (table) => {
    table.foreign('task_id')
      .references('id')
      .inTable('tasks');
    table.foreign('label_id')
      .references('id')
      .inTable('labels');
  })
  .then(() => console.log('tasks_labels done'));

  knex.schema.table('tasks', (table) => {
    table.foreign('status_id')
      .references('id')
      .inTable('task_statuses');
    table.foreign('creator_id')
      .references('id')
      .inTable('users');
    table.foreign('executor_id')
      .references('id')
      .inTable('users');
  })
  .then(() => console.log('tasks done'))
}

export const down = (knex) => console.log('drop tasks done!');