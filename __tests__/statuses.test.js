// @ts-check

import fastify from 'fastify';

import init from '../server/plugin.js';
import { getTestData, prepareData } from './helpers/index.js';

describe('test statuses CRUD', () => {
  let app;
  let knex;
  let models;
  const testData = getTestData();
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
  });

  beforeEach(async () => {
    await knex.migrate.latest();
    await prepareData(app);
  });

  it('index', async () => {
    const responseNoAuth = await app.inject({
      method: 'GET',
      url: app.reverse('statuses'),
    });
    expect(responseNoAuth.statusCode).toBe(302);
    const cookie = await logIn(testData.users.existing);
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('statuses'),
      cookies: cookie,
    });
    expect(response.statusCode).toBe(200);
  });

  it('new', async () => {
    const responseNoAuth = await app.inject({
      method: 'GET',
      url: app.reverse('newStatus'),
    });
    expect(responseNoAuth.statusCode).toBe(302);
    const cookie = await logIn(testData.users.existing);
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('newStatus'),
      cookies: cookie,
    });
    expect(response.statusCode).toBe(200);
  });

  it('create', async () => {
    const params = testData.statuses.new;
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('statuses'),
      payload: {
        data: params,
      },
    });
    expect(response.statusCode).toBe(302);
    const expected = params;
    const status = await models.taskStatus.query().findOne({ name: params.name });
    expect(status).toMatchObject(expected);
  });

  it('read', async () => {
    const noAuth = await app.inject({
      method: 'GET',
      url: '/statuses/2/edit',
    });
    expect(noAuth.statusCode).toBe(302);
    const cookie = await logIn(testData.users.existing);
    const response = await app.inject({
      method: 'GET',
      url: '/statuses/2/edit',
      cookies: cookie,
    });
    expect(response.statusCode).toBe(200);
  });

  it('update', async () => {
    const cookie = await logIn(testData.users.existing);
    const { name } = testData.statuses.existing;
    testData.statuses.existing.name = 'Завершен';
    const response = await app.inject({
      method: 'POST',
      url: '/statuses/2',
      cookies: cookie,
      payload: {
        data: testData.statuses.existing,
      },
    });
    expect(response.statusCode).toBe(302);
    const updatedStatus = await models.taskStatus.query().findById(2);
    expect(updatedStatus.name).not.toBe(name);
  });

  it('delete', async () => {
    const responseNoAuth = await app.inject({
      method: 'DELETE',
      url: 'statuses/2',
    });
    expect(responseNoAuth.statusCode).toBe(302);
    const cookie = await logIn(testData.users.existing);
    const response = await app.inject({
      method: 'DELETE',
      url: 'statuses/2',
      cookies: cookie,
    });
    const deletedStatus = await models.taskStatus.query().findById(2);
    expect(response.statusCode).toBe(302);
    expect(deletedStatus).toBeUndefined();
  });

  afterAll(async () => {
    // await knex.migrate.rollback();
    await app.close();
  });
});
