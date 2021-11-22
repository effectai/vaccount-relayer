import supertest from "supertest"
import app from "../index.js"

// transaction with same vaccount id as relayer itself
describe("POST /transaction with same vaccount id as relayer itself", function() {
  it("it should have status code 403", function(done) {
    supertest(app)
      .post("/transaction")
      .send([{
        account: 'forceonkyli2',
        name: 'joincampaign',
        authorization: [{
          actor: 'testjairtest',
          permission: 'active',
        }],
        data: {
          account_id: process.env.VACCOUNT_ID,
          campaign_id: 1,
          payer: process.env.RELAYER,
          sig: 'sig',
        }
      }])
      .expect(403)
      .end(function(err, res){
        if (err) {
          done(err)
        } else {
          done()
        }
      });
  });
});

// transaction with an unvalid action
describe("POST /transaction wrong action", function() {
  it("it should give an error that the isnt action allowed", function(done) {
    supertest(app)
      .post("/transaction")
      .send([
        {
          account: 'forceonkyli2',
          name: 'joincampaign',
          authorization: [{
            actor: 'testjairtest',
            permission: 'active',
          }],
          data: {
            account_id: process.env.VACCOUNT_ID,
            campaign_id: 1,
            payer: process.env.RELAYER,
            sig: 'sig',
          }
        }, {
          account: 'forceonkyli2',
          name: 'fakeaction!',
          authorization: [{
            actor: 'testjairtest',
            permission: 'active',
          }],
          data: {}
        }
      ])
      .expect(403)
      .end(function(err, res){
        if (err) done(err);
        done();
      });
  });
});

describe("POST /transaction wrong contract", function() {
  it("it should give an error that the contract isnt allowed", function(done) {
    supertest(app)
      .post("/transaction")
      .send([{
        account: 'forceonkyli3',
        name: 'joincampaign',
        authorization: [{
          actor: 'testjairtest',
          permission: 'active',
        }],
        data: {}
      }])
      .expect(403)
      .end(function(err, res){
        if (err) done(err);
        done();
      });
  });
});