// @ts-check

import i18next from 'i18next';

export default (app) => {
  app
    .get('/statuses', { name: 'statuses' }, async (req, reply) => {
      if (!req.user) {
        req.flash('error', i18next.t('flash.authError'));
        reply.redirect(app.reverse('root'));
        return reply;
      }
      const taskStatuses = await app.objection.models.taskStatus.query();
      reply.render('statuses/index', { taskStatuses });
      return reply;
    })

    .get('/statuses/new', { name: 'newStatus' }, async (req, reply) => {
      if (!req.user) {
        req.flash('error', i18next.t('flash.authError'));
        reply.redirect(app.reverse('root'));
        return reply;
      }
      reply.render('statuses/new');
      return reply;
    })

    .get('/statuses/:id/edit', async (req, reply) => {
      const status = await app.objection.models.taskStatus.query().findById(req.params.id);
      if (!req.user) {
        req.flash('error', i18next.t('flash.authError'));
        reply.redirect(app.reverse('root'));
        return reply;
      }
      reply.render('/statuses/edit', { status });
      return reply;
    })

    .post('/statuses', { name: 'createStatus' }, async (req, reply) => {
      const status = new app.objection.models.taskStatus();
      status.$set(req.body.data);

      try {
        const validStatus = await app.objection.models.taskStatus.fromJson(req.body.data);
        await app.objection.models.taskStatus.query().insert(validStatus);
        req.flash('info', i18next.t('flash.statuses.create.success'));
        reply.redirect(app.reverse('statuses'));
      } catch ({ data }) {
        req.flash('error', i18next.t('flash.statuses.create.error'));
        reply.render('statuses/new', { status, errors: data });
      }

      return reply;
    })

    .post('/statuses/:id', async (req, reply) => {
      const { id } = req.params;
      const status = await app.objection.models.taskStatus.query().findById(id);
      try {
        await status.$query().update(req.body.data);
        req.flash('info', i18next.t('flash.statuses.update.success'));
        reply.redirect(app.reverse('statuses'));
      } catch ({ data }) {
        req.flash('error', i18next.t('flash.statuses.update.error'));
        reply.redirect((`/statuses/${id}/edit`), { errors: data });
      }
    })

    .delete('/statuses/:id', async (req, reply) => {
      if (!req.user) {
        req.flash('error', i18next.t('flash.authError'));
        reply.redirect(app.reverse('root'));
        return reply;
      }
      await app.objection.models.taskStatus.query().deleteById(req.params.id);
      req.flash('error', i18next.t('flash.statuses.delete.success'));
      reply.redirect('/statuses');
      return reply;
    });
};
