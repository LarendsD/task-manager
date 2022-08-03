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
        .modify('filter', 'statuses.id', req.query.status)
        .modify('filter', 'executor.id', req.query.executor)
        .modify('filter', 'labels.id', req.query.label)
        .modify('onlyMyTasks', req.query.isCreatorUser, req.user.id);
      // .where((task) => {
      //  if (req.query.status) {
      //    task.where('statuses.id', req.query.status);
      //    queries.status.push(req.query.status);
      //  }
      //  if (req.query.executor) {
      //    task.where('executor.id', req.query.executor);
      //    queries.executor.push(req.query.executor);
      //  }
      //  if (req.query.label) {
      //    task.where('labels.id', req.query.label);
      //    queries.label.push(req.query.label);
      //  }
      //  if (req.query.isCreatorUser) {
      //    task.where('creator.id', req.user.id);
      //    queries.isCreatorUser = 'On';
      //  }
      // });
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
      const { user } = req;
      req.body.data.creatorId = user.id;
      req.body.data.statusId = Number(req.body.data.statusId);
      req.body.data.executorId = Number(req.body.data.executorId);
      const {
        name, description, statusId, executorId, creatorId, ...selectedLabels
      } = req.body.data;
      const task = new app.objection.models.task();
      const users = await app.objection.models.user.query();
      const statuses = await app.objection.models.taskStatus.query();
      const labels = await app.objection.models.label.query();
      task.$set({
        name, description, statusId, executorId, creatorId,
      });

      try {
        const validTask = await app.objection.models.task.fromJson({
          name, description, statusId, executorId, creatorId,
        });
        await app.objection.models.task.transaction(async (trx) => {
          await app.objection.models.task.query(trx).insert(validTask);
          const createdTask = await app.objection.models.task.query(trx).where(validTask);
          const taskId = createdTask[0].id;
          if (selectedLabels.labels) {
            const insert = Array.from(selectedLabels.labels).map(async (label) => {
              const labelId = Number(label);
              await app.objection.models.taskLabels.query(trx).insert({ taskId, labelId });
            });
            const result = Promise.all(insert);
            return result;
          }
          return createdTask;
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

    .post('/tasks/:id', async (req, reply) => {
      const { id } = req.params;
      req.body.data.statusId = Number(req.body.data.statusId);
      req.body.data.executorId = Number(req.body.data.executorId);
      const {
        labels, ...patchTask
      } = req.body.data;
      const task = await app.objection.models.task.query().findById(req.params.id);
      try {
        await app.objection.models.task.transaction(async (trx) => {
          await task.$query(trx).patch(patchTask);
          const update = await app.objection.models.taskLabels.query(trx)
            .delete()
            .where('task_id', id);
          if (labels) {
            const insert = Array.from(labels).map(async (label) => {
              const labelId = Number(label);
              await app.objection.models.taskLabels.query(trx)
                .insert({ taskId: Number(id), labelId });
            });
            const result = Promise.all(insert);
            return result;
          }
          return update;
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
