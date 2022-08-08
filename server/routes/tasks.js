// @ts-check

import i18next from 'i18next';

export default (app) => {
  app
    .get('/tasks', { name: 'tasks' }, async (req, reply) => {
      if (!req.user) {
        req.flash('error', i18next.t('flash.authError'));
        reply.redirect(app.reverse('root'));
        return reply;
      }
      const queries = {
        status: req.query.status ?? [],
        label: req.query.label ?? [],
        executor: req.query.executor ?? [],
        isCreatorUser: req.query.isCreatorUser ? 'On' : '',
      };
      const tasks = await app.objection.models.task.query()
        .withGraphJoined('[statuses, executor, creator, labels]')
        .select('tasks.id', 'tasks.name', 'tasks.createdAt')
        .skipUndefined()
        .modify('filter', 'statuses.id', req.query.status)
        .modify('filter', 'executor.id', req.query.executor)
        .modify('filter', 'labels.id', req.query.label)
        .modify('onlyMyTasks', req.query.isCreatorUser, req.user.id);
      const users = await app.objection.models.user.query();
      const statuses = await app.objection.models.taskStatus.query();
      const labels = await app.objection.models.label.query();
      reply.render('tasks/index', {
        tasks, users, statuses, labels, queries,
      });
      return reply;
    })

    .get('/tasks/new', { name: 'createTask' }, async (req, reply) => {
      if (!req.user) {
        req.flash('error', i18next.t('flash.authError'));
        reply.redirect(app.reverse('root'));
        return reply;
      }
      const statuses = await app.objection.models.taskStatus.query();
      const users = await app.objection.models.user.query();
      const labels = await app.objection.models.label.query();
      reply.render('tasks/new', { statuses, users, labels });
      return reply;
    })

    .get('/tasks/:id', async (req, reply) => {
      if (!req.user) {
        req.flash('error', i18next.t('flash.authError'));
        reply.redirect(app.reverse('root'));
        return reply;
      }
      const task = await app.objection.models.task.query()
        .withGraphJoined('[statuses, executor, creator, labels]')
        .select('tasks.id', 'tasks.name', 'tasks.createdAt', 'tasks.description')
        .findById(req.params.id);
      const labels = await task.$relatedQuery('labels');
      reply.render('tasks/view', { task, labels });
      return reply;
    })

    .get('/tasks/:id/edit', async (req, reply) => {
      if (!req.user) {
        req.flash('error', i18next.t('flash.authError'));
        reply.redirect(app.reverse('root'));
        return reply;
      }
      const { id } = req.params;
      const task = await app.objection.models.task.query()
        .withGraphJoined('[statuses, executor]')
        .select('tasks.name', 'tasks.description', 'tasks.id')
        .findById(req.params.id);
      const statuses = await app.objection.models.taskStatus.query();
      const users = await app.objection.models.user.query();
      const labels = await app.objection.models.label.query();
      const relatedLabels = await task.$relatedQuery('labels');
      const labelNames = relatedLabels.map((label) => label.name);
      reply.render('tasks/edit', {
        task, statuses, users, labels, labelNames, id,
      });
      return reply;
    })

    .post('/tasks', async (req, reply) => {
      const creatorId = req.user.id;
      const datas = await app.objection.models.task.fromJson({ creatorId, ...req.body.data }, {
        skipValidation: true,
      });
      const task = new app.objection.models.task();
      const users = await app.objection.models.user.query();
      const statuses = await app.objection.models.taskStatus.query();
      const labels = await app.objection.models.label.query();
      task.$set(datas);

      try {
        const validTask = await app.objection.models.task.fromJson(datas);
        await app.objection.models.task.transaction(async (trx) => {
          const insertLabels = await app.objection.models.label
            .query(trx)
            .findByIds(datas.labels || []);
          const result = await app.objection.models.task.query(trx).insertGraph({
            ...validTask,
            labels:
              insertLabels,
          }, { relate: true });
          return result;
        });
        req.flash('info', i18next.t('flash.tasks.create.success'));
        reply.redirect(app.reverse('tasks'));
      } catch ({ data }) {
        req.flash('error', i18next.t('flash.tasks.create.error'));
        reply.render('tasks/new', {
          task, users, statuses, labels, errors: data,
        });
      }
      return reply;
    })

    .patch('/tasks/:id', async (req, reply) => {
      const { id } = req.params;
      const datas = await app.objection.models.task.fromJson(req.body.data, {
        skipValidation: true,
      });
      const {
        labels, ...patchTask
      } = datas;
      try {
        await app.objection.models.task.transaction(async (trx) => {
          const task = await app.objection.models.task.query(trx).findById(id);
          const updateLabels = await app.objection.models.label
            .query(trx)
            .findByIds(labels || []);
          await app.objection.models.task.query(trx)
            .upsertGraph({
              ...patchTask,
              id: task.id,
              creatorId: task.creatorId,
              labels:
              updateLabels,
            }, { relate: true, unrelate: true, noUpdate: ['labels'] });
        });
        req.flash('info', i18next.t('flash.tasks.update.success'));
        reply.redirect(app.reverse('tasks'));
      } catch ({ data }) {
        req.flash('error', i18next.t('flash.tasks.update.error'));
        reply.redirect((`/tasks/${id}/edit`), { errors: data });
      }
    })

    .delete('/tasks/:id', async (req, reply) => {
      if (!req.isAuthenticated()) {
        req.flash('error', i18next.t('flash.authError'));
        reply.redirect(app.reverse('root'));
        return reply;
      }
      const task = await app.objection.models.task.query().findById(req.params.id);
      const creator = await task.$relatedQuery('creator');
      if (creator.id !== req.user.id) {
        req.flash('error', i18next.t('flash.tasks.delete.error'));
        reply.redirect(app.reverse('tasks'));
        return reply;
      }
      try {
        await app.objection.models.task.transaction(async (trx) => {
          await app.objection.models.taskLabels.query(trx)
            .delete()
            .where('task_id', req.params.id);
          await app.objection.models.task.query(trx).deleteById(req.params.id);
        });
        req.flash('info', i18next.t('flash.tasks.delete.success'));
        reply.redirect('/tasks');
      } catch ({ data }) {
        req.flash('error', i18next.t('flash.tasks.delete.error'));
        reply.redirect(app.reverse('tasks'));
      }
      return reply;
    });
};
