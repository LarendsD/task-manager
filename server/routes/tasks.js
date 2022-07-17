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
      const tasks = await app.objection.models.task.query()
        .select('tasks.id', 'tasks.name', 'tasks.created_at', 'statuses.name as statusName', `
        executor.firstName as executorFirstName`, 'executor.lastName as executorLastName', `
        creator.firstName as creatorFirstName`, 'creator.lastName as creatorLastName')
        .joinRelated({
          statuses: true,
          executor: true,
          creator: true,
        });
      reply.render('tasks/index', { tasks });
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
      reply.render('tasks/new', { statuses, users });
      return reply;
    })

    .get('/tasks/:id', async (req, reply) => {
      if (!req.user) {
        req.flash('error', i18next.t('flash.authError'));
        reply.redirect(app.reverse('root'));
        return reply;
      }
      const task = await app.objection.models.task.query()
        .select('tasks.id', 'tasks.name', 'tasks.created_at', 'tasks.description', 'statuses.name as statusName', `
        executor.firstName as executorFirstName`, 'executor.lastName as executorLastName', `
        creator.firstName as creatorFirstName`, 'creator.lastName as creatorLastName')
        .joinRelated({
          statuses: true,
          executor: true,
          creator: true,
        })
        .findById(req.params.id);
      reply.render('tasks/view', { task });
      return reply;
    })

    .get('/tasks/:id/edit', async (req, reply) => {
      if (!req.user) {
        req.flash('error', i18next.t('flash.authError'));
        reply.redirect(app.reverse('root'));
        return reply;
      }
      const task = await app.objection.models.task.query()
        .select('tasks.id', 'tasks.name', 'tasks.description', 'statuses.name as statusName', `
        executor.firstName as executorFirstName`, 'executor.lastName as executorLastName')
        .joinRelated({
          statuses: true,
          executor: true,
        })
        .findById(req.params.id);
      const statuses = await app.objection.models.taskStatus.query();
      const users = await app.objection.models.user.query();
      reply.render('tasks/edit', { task, statuses, users });
      return reply;
    })

    .post('/tasks', async (req, reply) => {
      const { user } = req;
      req.body.data.creatorId = user.id;
      req.body.data.statusId = Number(req.body.data.statusId);
      req.body.data.executorId = Number(req.body.data.executorId);
      const task = new app.objection.models.task();
      const users = await app.objection.models.user.query();
      const statuses = await app.objection.models.taskStatus.query();
      task.$set(req.body.data);

      try {
        const validTask = await app.objection.models.task.fromJson(req.body.data);
        await app.objection.models.task.query().insert(validTask);
        req.flash('info', i18next.t('flash.tasks.create.success'));
        reply.redirect(app.reverse('tasks'));
      } catch ({ data }) {
        req.flash('error', i18next.t('flash.tasks.create.error'));
        reply.render('tasks/new', {
          task, users, statuses, errors: data,
        });
      }

      return reply;
    })

    .post('/tasks/:id', async (req, reply) => {
      const { id } = req.params;
      req.body.data.statusId = Number(req.body.data.statusId);
      req.body.data.executorId = Number(req.body.data.executorId);
      const task = await app.objection.models.task.query().findById(req.params.id);
      try {
        await task.$query().patch(req.body.data);
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
      await app.objection.models.task.query().deleteById(req.params.id);
      req.flash('info', i18next.t('flash.tasks.delete.success'));
      reply.redirect('/tasks');
      return reply;
    });
};
