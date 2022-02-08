const pool = require('../lib/utils/pool');
const setup = require('../data/setup');
const request = require('supertest');
const app = require('../lib/app');
const UserService = require('../lib/services/UserService');

// Mock user for testing
const mockUser = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test@defense.gov',
  password: '12345',
};


const registerAndLogin = async (userProps = {}) => {
  const password = userProps.password ?? mockUser.password;

  // agent dependency allows the storage of cookies for tests
  const agent = request.agent(app);

  // Call create user method
  const user = await UserService.create({ ...mockUser, ...userProps });

  // after user creation this signs into the page
  const { email } = user;
  await agent.post('/api/v1/users/sessions').send({ email, password });
  return [agent, user];
};

describe('user routes', () => {
  beforeEach(() => {
    return setup(pool);
  });

  afterAll(() => {
    pool.end();
  });

  it('creates a new user', async () => {
    const res = await request(app).post('/api/v1/users').send(mockUser);
    const { firstName, lastName, email } = mockUser;
    

    expect(res.body).toEqual({
      id: expect.any(String),
      firstName,
      lastName,
      email,
    });
  });

  it('should return a 401 when signed out and trying to view secrets', async () => {
    const res = await request(app).get('/api/v1/secrets');

    expect(res.body).toEqual({
      message: 'You must be signed in to continue',
      status: 401,
    });
  });

  it('should return a list of secrets if signed in', async () => {
    const [agent] = await registerAndLogin({ email: 'test@defense.gov' });

    const res = await agent.get('/api/v1/secrets');

    expect(res.body).toEqual([{ id: expect.any(String), title:'Aliens?', description:'Alf is real' }]);
  });
 
  it('should create a new secret', async () => {
    const [agent] = await registerAndLogin({ email: 'test@defense.gov' });
    await agent.post('/api/v1/secrets')
      .send({ title:'Origin of Life?', description:'Mars' });
    const res = await agent.get('/api/v1/secrets');

    expect(res.body).toEqual(expect.arrayContaining([{ id: expect.any(String), title:'Origin of Life?', description:'Mars' }]));
  });

  it('should log into the app, then call the delete method to log out and then try to get a secret and receive the 401 error to sign in', async () => {
    const [agent] = await registerAndLogin({ email: 'test@defense.gov' });
    await agent.delete('/api/v1/users/sessions');
    const res = await request(app).get('/api/v1/secrets');

    expect(res.body).toEqual({
      message: 'You must be signed in to continue',
      status: 401,
    });
    
  });
  
});
