// @ts-check
const objectionUnique = require('objection-unique');
const BaseModel = require('./BaseModel.cjs');

const unique = objectionUnique({ fields: ['id'] });

module.exports = class TaskLabels extends unique(BaseModel) {
  static get tableName() {
    return 'task_labels';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['taskId'],
      properties: {
        id: { type: 'integer' },
        taskId: { type: 'integer' },
        labelId: { type: 'integer' },
      },
    };
  }
};
