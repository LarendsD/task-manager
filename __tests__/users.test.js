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
  const testData = getTestData();

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
    const responseSignIn = await app.inject({
      method: 'POST',
      url: app.reverse('session'),
      payload: {
        data: testData.users.existing,
      },
    });
    const [sessionCookie] = responseSignIn.cookies;
    const { name, value } = sessionCookie;
    const cookie = { [name]: value };
    const withAuth = await app.inject({
      method: 'GET',
      url: '/users/10/edit',
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

  //  TODO ДОДЕЛАЙ!!
  it('update', async () => {
    const responseSignIn = await app.inject({
      method: 'POST',
      url: app.reverse('session'),
      payload: {
        data: testData.users.existing,
      },
    });
    const { email } = testData.users.existing;
    const [sessionCookie] = responseSignIn.cookies;
    const { name, value } = sessionCookie;
    const cookie = { [name]: value };
    testData.users.existing.email = 'newEmail@mail.ru';
    const response = await app.inject({
      method: 'POST',
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
    const responseSignIn = await app.inject({
      method: 'POST',
      url: app.reverse('session'),
      payload: {
        data: testData.users.existing,
      },
    });
    const [sessionCookie] = responseSignIn.cookies;
    const { name, value } = sessionCookie;
    const cookie = { [name]: value };
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
    // Пока Segmentation fault: 11
    // после каждого теста откатываем миграции
    // await knex.migrate.rollback();
  });

  afterAll(async () => {
    await app.close();
  });
});
