// @ts-check
const objectionUnique = require('objection-unique');
const BaseModel = require('./BaseModel.cjs');
const User = require('./User.cjs');
const TaskStatus = require('./TaskStatus.cjs');
const Label = require('./Label.cjs');

const unique = objectionUnique({ fields: ['name'] });

module.exports = class Task extends unique(BaseModel) {
  static get tableName() {
    return 'tasks';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'statusId', 'creatorId'],
      properties: {
        id: { type: 'integer' },
        name: { type: 'string', minLength: 1 },
        description: { type: 'string' },
        statusId: { type: 'integer', minimum: 1 },
        creatorId: { type: 'integer' },
        executorId: { type: 'integer' },
      },
    };
  }

  static get modifiers() {
    return {
      filter(builder, column, query) {
        builder.where(column, query);
      },
    };
  }

  static get relationMappings() {
    return {
      statuses: {
        relation: unique(BaseModel).BelongsToOneRelation,
        modelClass: TaskStatus,
        join: {
          from: 'tasks.statusId',
          to: 'task_statuses.id',
        },
      },
      creator: {
        relation: unique(BaseModel).BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'tasks.creatorId',
          to: 'users.id',
        },
      },
      executor: {
        relation: unique(BaseModel).BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'tasks.executorId',
          to: 'users.id',
        },
      },
      labels: {
        relation: unique(BaseModel).ManyToManyRelation,
        modelClass: Label,
        join: {
          from: 'tasks.id',
          through: {
            from: 'task_labels.taskId',
            to: 'task_labels.labelId',
          },
          to: 'labels.id',
        },
      },
    };
  }

  $parseJson(json, opt) {
    // eslint-disable-next-line no-param-reassign
    json = super.$parseJson(json, opt);
    return {
      ...json,
      statusId: Number(json.statusId),
      executorId: Number(json.executorId),
      creatorId: json.creatorId,
    };
  }
};
