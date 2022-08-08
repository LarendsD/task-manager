// @ts-check

import i18next from 'i18next';

export default (app) => {
  app
    .get('/users', { name: 'users' }, async (req, reply) => {
      const users = await app.objection.models.user.query();
      reply.render('users/index', { users });
      return reply;
    })

    .get('/users/new', { name: 'newUser' }, (req, reply) => {
      const user = new app.objection.models.user();
      reply.render('users/new', { user });
    })

    .get('/users/:id/edit', { name: 'currentUser' }, async (req, reply) => {
      const user = await app.objection.models.user.query().findById(req.params.id);
      if (!req.user) {
        req.flash('error', i18next.t('flash.authError'));
        reply.redirect(app.reverse('root'));
        return reply;
      } if (req.user.id !== Number(user.id)) {
        req.flash('error', i18next.t('flash.accessError'));
        reply.redirect(app.reverse('users'));
        return reply;
      }
      reply.render('/users/edit', { user });
      return reply;
    })

    .patch('/users/:id', async (req, reply) => {
      const { id } = req.params;
      try {
        await req.user.$query().update(req.body.data);
        req.flash('info', i18next.t('flash.users.update.success'));
        reply.redirect('/users');
      } catch ({ data }) {
        req.flash('error', i18next.t('flash.users.update.error'));
        reply.redirect((`/users/${id}/edit`), { errors: data });
      }
    })

    .delete('/users/:id', { name: 'userDelete' }, async (req, reply) => {
      const user = await app.objection.models.user.query().findById(req.params.id);
      if (!req.isAuthenticated()) {
        req.flash('error', i18next.t('flash.authError'));
        reply.redirect(app.reverse('root'));
        return reply;
      } if (req.user.id !== Number(user.id)) {
        req.flash('error', i18next.t('flash.accessError'));
        reply.redirect(app.reverse('users'));
        return reply;
      }
      const executor = await app.objection.models.task.query().where('executorId', req.params.id);
      const creator = await app.objection.models.task.query().where('creatorId', req.params.id);
      if (executor.length !== 0 || creator.length !== 0) {
        req.flash('error', i18next.t('flash.users.delete.error'));
        reply.redirect(app.reverse('users'));
        return reply;
      }
      req.logOut();
      await app.objection.models.user.query().deleteById(req.params.id);
      req.flash('info', i18next.t('flash.users.delete.success'));
      reply.redirect('/users');
      return reply;
    })

    .post('/users', async (req, reply) => {
      const user = new app.objection.models.user();
      user.$set(req.body.data);

      try {
        const validUser = await app.objection.models.user.fromJson(req.body.data);
        await app.objection.models.user.query().insert(validUser);
        req.flash('info', i18next.t('flash.users.create.success'));
        reply.redirect(app.reverse('root'));
      } catch ({ data }) {
        req.flash('error', i18next.t('flash.users.create.error'));
        reply.render('users/new', { user, errors: data });
      }

      return reply;
    });
};
