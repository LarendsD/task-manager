// @ts-check

import fastify from 'fastify';

import init from '../server/plugin.js';
import { getTestData, prepareData } from './helpers/index.js';

describe('test tasks CRUD', () => {
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
    const responseNoAuth = await app.inject({
      method: 'GET',
      url: app.reverse('tasks'),
    });
    expect(responseNoAuth.statusCode).toBe(302);
    const cookie = await logIn(testData.users.existing);
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('tasks'),
      cookies: cookie,
    });
    expect(response.statusCode).toBe(200);
  });

  it('indexWithFilters', async () => {
    const cookie = await logIn(testData.users.existing);
    const responseFullFilters = await app.inject({
      method: 'GET',
      url: `${app.reverse('tasks')}?status=3&executor=2&labels=1&isCreatorUser=on`,
      cookies: cookie,
    });
    expect(responseFullFilters.statusCode).toBe(200);
    const responseNoFilters = await app.inject({
      method: 'GET',
      url: `${app.reverse('tasks')}?status=&executor=&labels=`,
      cookies: cookie,
    });
    expect(responseNoFilters.statusCode).toBe(200);
    const response = await app.inject({
      method: 'GET',
      url: `${app.reverse('tasks')}?status=&executor=&labels=1&isCreatorUser=on`,
      cookies: cookie,
    });
    expect(response.statusCode).toBe(200);
  });

  it('new', async () => {
    const responseNoAuth = await app.inject({
      method: 'GET',
      url: app.reverse('createTask'),
    });
    expect(responseNoAuth.statusCode).toBe(302);
    const cookie = await logIn(testData.users.existing);
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('createTask'),
      cookies: cookie,
    });
    expect(response.statusCode).toBe(200);
  });

  it('read', async () => {
    const responseNoAuth = await app.inject({
      method: 'GET',
      url: 'tasks/1',
    });
    expect(responseNoAuth.statusCode).toBe(302);
    const cookie = await logIn(testData.users.existing);
    const response = await app.inject({
      method: 'GET',
      url: 'tasks/1',
      cookies: cookie,
    });
    expect(response.statusCode).toBe(200);
  });

  it('edit', async () => {
    const responseNoAuth = await app.inject({
      method: 'GET',
      url: 'tasks/2/edit',
    });
    expect(responseNoAuth.statusCode).toBe(302);
    const cookie = await logIn(testData.users.existing);
    const response = await app.inject({
      method: 'GET',
      url: 'tasks/2/edit',
      cookies: cookie,
    });
    expect(response.statusCode).toBe(200);
  });

  it('create', async () => {
    const cookie = await logIn(testData.users.existing);
    const params = testData.tasks.new;
    const testParams = { ...params };
    params.labels = [2, 3];
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('tasks'),
      payload: {
        data: params,
      },
      cookies: cookie,
    });
    expect(response.statusCode).toBe(302);
    const task = await models.task.query().findOne({ name: params.name });
    expect(task).toMatchObject(testParams);
  });

  it('update', async () => {
    const cookie = await logIn(testData.tasks.existing);
    const { name } = testData.tasks.existing;
    testData.tasks.existing.name = 'Сделать еще кое-что';
    const response = await app.inject({
      method: 'POST',
      url: '/tasks/1',
      cookies: cookie,
      payload: {
        data: testData.tasks.existing,
      },
    });
    expect(response.statusCode).toBe(302);
    const updatedTask = await models.task.query().findById(1);
    expect(updatedTask.name).not.toBe(name);
  });

  it('delete', async () => {
    const responseNoAuth = await app.inject({
      method: 'DELETE',
      url: 'tasks/2',
    });
    expect(responseNoAuth.statusCode).toBe(302);
    const cookie = await logIn(testData.users.existing);
    const withAuth = await app.inject({
      method: 'DELETE',
      url: 'tasks/2',
      cookies: cookie,
    });
    expect(withAuth.statusCode).toBe(302);
    const task = await models.task.query().findById(2);
    expect(task).not.toBeUndefined();
    const response = await app.inject({
      method: 'DELETE',
      url: 'tasks/3',
      cookies: cookie,
    });
    expect(response.statusCode).toBe(302);
    const deletedTask = await models.task.query().findById(3);
    expect(deletedTask).toBeUndefined();
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
