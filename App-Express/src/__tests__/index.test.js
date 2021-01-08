const app = require('../sls');
const request = require('supertest');

describe('Test', () => {
  test('[GET /] success', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Express.js');
  });
  test('[GET /user] success', async () => {
    const res = await request(app).get('/user');
    expect(res.status).toBe(200);
    expect(JSON.parse(res.text)).toEqual([
      {
        title: 'serverless framework',
        link: 'https://serverless.com',
      },
    ]);
  });
  test('[GET /user/:id] success', async () => {
    const res = await request(app).get('/user/1');
    expect(res.status).toBe(200);
    expect(JSON.parse(res.text)).toEqual({
      id: '1',
      title: 'serverless framework',
      link: 'https://serverless.com',
    });
  });
});
