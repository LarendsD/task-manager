// @ts-check

import i18next from 'i18next';

export default (app) => {
  app
    .get('/labels', { name: 'labels' }, async (req, reply) => {
      if (!req.user) {
        req.flash('error', i18next.t('flash.authError'));
        reply.redirect(app.reverse('root'));
        return reply;
      }
      const labels = await app.objection.models.label.query();
      reply.render('labels/index', { labels });
      return reply;
    })

    .get('/labels/new', { name: 'newLabel' }, async (req, reply) => {
      if (!req.user) {
        req.flash('error', i18next.t('flash.authError'));
        reply.redirect(app.reverse('root'));
        return reply;
      }
      reply.render('labels/new');
      return reply;
    })

    .get('/labels/:id/edit', async (req, reply) => {
      const label = await app.objection.models.label.query().findById(req.params.id);
      if (!req.user) {
        req.flash('error', i18next.t('flash.authError'));
        reply.redirect(app.reverse('root'));
        return reply;
      }
      reply.render('/labels/edit', { label });
      return reply;
    })

    .post('/labels', async (req, reply) => {
      const label = new app.objection.models.label();
      label.$set(req.body.data);

      try {
        const validLabel = await app.objection.models.label.fromJson(req.body.data);
        await app.objection.models.label.query().insert(validLabel);
        req.flash('info', i18next.t('flash.labels.create.success'));
        reply.redirect(app.reverse('labels'));
      } catch ({ data }) {
        req.flash('error', i18next.t('flash.labels.create.error'));
        reply.render('labels/new', { label, errors: data });
      }

      return reply;
    })

    .patch('/labels/:id', async (req, reply) => {
      const { id } = req.params;
      const label = await app.objection.models.label.query().findById(id);
      try {
        await label.$query().update(req.body.data);
        req.flash('info', i18next.t('flash.labels.update.success'));
        reply.redirect(app.reverse('labels'));
      } catch ({ data }) {
        req.flash('error', i18next.t('flash.labels.update.error'));
        reply.redirect((`/labels/${id}/edit`), { errors: data });
      }
    })

    .delete('/labels/:id', async (req, reply) => {
      if (!req.user) {
        req.flash('error', i18next.t('flash.authError'));
        reply.redirect(app.reverse('root'));
        return reply;
      }
      const labelInTask = await app.objection.models.taskLabels.query()
        .where('labelId', req.params.id);
      if (labelInTask.length !== 0) {
        req.flash('error', i18next.t('flash.labels.delete.error'));
        reply.redirect(app.reverse('labels'));
        return reply;
      }
      await app.objection.models.label.query().deleteById(req.params.id);
      req.flash('info', i18next.t('flash.labels.delete.success'));
      reply.redirect('/labels');
      return reply;
    });
};
