import request from 'supertest';
import app from '../src/index.js';

describe("Dummy tests", ()=>{
  describe('API routes', () => {
    it('should return pong from /ping', (done) => {
      request(app)
        .get('/ping')
        .expect(200)
        .expect('pong <team’s number>', done);
    });
  });
})