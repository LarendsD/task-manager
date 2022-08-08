// @ts-check

import _ from 'lodash';
import fastify from 'fastify';

import init from '../server/plugin.js';
import encrypt from '../server/lib/secure.cjs';
import { getTestData, prepareData } from './helpers/index.js';

describe('test users CRUD', () => {
  let app;
  let knex;
  let models;
  let testData;
  const logIn = async (user) => {
    const responseSignIn = await app.inject({
      method: 'POST',
      url: app.reverse('session'),
      payload: {
        data: user,
      },
    });
    const [sessionCookie] = responseSignIn.cookies;
    const { name, value } = sessionCookie;
    const cookie = { [name]: value };
    return cookie;
  };

  beforeAll(async () => {
    app = fastify({ logger: { prettyPrint: true } });
    await init(app);
    knex = app.objection.knex;
    models = app.objection.models;

    // TODO: пока один раз перед тестами
    // тесты не должны зависеть друг от друга
    // перед каждым тестом выполняем миграции
    // и заполняем БД тестовыми данными
  });

  beforeEach(async () => {
    await knex.migrate.latest();
    await prepareData(app);
    testData = getTestData();
  });

  it('index', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('users'),
    });
    expect(response.statusCode).toBe(200);
  });

  it('new', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('newUser'),
    });
    expect(response.statusCode).toBe(200);
  });

  it('create', async () => {
    const params = testData.users.new;
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('users'),
      payload: {
        data: params,
      },
    });

    expect(response.statusCode).toBe(302);
    const expected = {
      ..._.omit(params, 'password'),
      passwordDigest: encrypt(params.password),
    };
    const user = await models.user.query().findOne({ email: params.email });
    expect(user).toMatchObject(expected);
  });

  it('read', async () => {
    const noAuth = await app.inject({
      method: 'GET',
      url: '/users/2/edit',
    });
    expect(noAuth.statusCode).toBe(302);
    const cookie = await logIn(testData.users.existing);
    const withAuth = await app.inject({
      method: 'GET',
      url: '/users/3/edit',
      cookies: cookie,
    });
    expect(withAuth.statusCode).toBe(302);
    const trueUser = await app.inject({
      method: 'GET',
      url: '/users/2/edit',
      cookies: cookie,
    });
    expect(trueUser.statusCode).toBe(200);
  });

  it('update', async () => {
    const cookie = await logIn(testData.users.existing);
    const { email } = testData.users;
    testData.users.existing.email = 'newEmail@mail.ru';
    const response = await app.inject({
      method: 'PATCH',
      url: '/users/2',
      cookies: cookie,
      payload: {
        data: testData.users.existing,
      },
    });
    expect(response.statusCode).toBe(302);
    const updatedUser = await models.user.query().findById(2);
    expect(updatedUser.email).not.toBe(email);
  });

  it('delete', async () => {
    const responseNoAuth = await app.inject({
      method: 'DELETE',
      url: 'users/2',
    });
    const user = await models.user.query().findById(2);
    expect(responseNoAuth.statusCode).toBe(302);
    expect(user).not.toBeUndefined();
    const cookie = await logIn(testData.users.existing);
    await models.task.query().delete().where('creatorId', 2);
    await models.task.query().delete().where('executorId', 2);
    const response = await app.inject({
      method: 'DELETE',
      url: 'users/2',
      cookies: cookie,
    });
    const deletedUser = await models.user.query().findById(2);
    expect(response.statusCode).toBe(302);
    expect(deletedUser).toBeUndefined();
  });

  afterEach(async () => {
    await knex('users').truncate();
  });

  afterAll(async () => {
    await app.close();
  });
});
