// @ts-check

import fastify from 'fastify';

import init from '../server/plugin.js';
import { getTestData, prepareData } from './helpers/index.js';

describe('test labels CRUD', () => {
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
      url: app.reverse('labels'),
    });
    expect(responseNoAuth.statusCode).toBe(302);
    const cookie = await logIn(testData.users.existing);
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('labels'),
      cookies: cookie,
    });
    expect(response.statusCode).toBe(200);
  });

  it('new', async () => {
    const responseNoAuth = await app.inject({
      method: 'GET',
      url: app.reverse('newLabel'),
    });
    expect(responseNoAuth.statusCode).toBe(302);
    const cookie = await logIn(testData.users.existing);
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('newLabel'),
      cookies: cookie,
    });
    expect(response.statusCode).toBe(200);
  });

  it('create', async () => {
    const params = testData.labels.new;
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('labels'),
      payload: {
        data: params,
      },
    });
    expect(response.statusCode).toBe(302);
    const label = await models.label.query().findOne({ name: params.name });
    expect(label).toMatchObject(params);
  });

  it('read', async () => {
    const noAuth = await app.inject({
      method: 'GET',
      url: '/labels/2/edit',
    });
    expect(noAuth.statusCode).toBe(302);
    const cookie = await logIn(testData.users.existing);
    const response = await app.inject({
      method: 'GET',
      url: '/labels/2/edit',
      cookies: cookie,
    });
    expect(response.statusCode).toBe(200);
  });

  it('update', async () => {
    const cookie = await logIn(testData.users.existing);
    const { name } = testData.labels.existing;
    testData.labels.existing.name = 'Обычная метка';
    const response = await app.inject({
      method: 'POST',
      url: '/labels/2',
      cookies: cookie,
      payload: {
        data: testData.labels.existing,
      },
    });
    expect(response.statusCode).toBe(302);
    const updatedLabel = await models.label.query().findById(2);
    expect(updatedLabel.name).not.toBe(name);
  });

  it('delete', async () => {
    const responseNoAuth = await app.inject({
      method: 'DELETE',
      url: 'labels/2',
    });
    expect(responseNoAuth.statusCode).toBe(302);
    const cookie = await logIn(testData.users.existing);
    const response = await app.inject({
      method: 'DELETE',
      url: 'labels/2',
      cookies: cookie,
    });
    const deletedLabel = await models.label.query().findById(2);
    expect(response.statusCode).toBe(302);
    expect(deletedLabel).toBeUndefined();
  });

  afterEach(async () => {
    await knex('labels').truncate();
  });

  afterAll(async () => {
    await app.close();
  });
});
