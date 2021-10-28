import supertest from "supertest"
import api from "../services/eos.js"
import app from "../index.js"
import sinon from "sinon"

const transaction = { 
  transaction_id: 'ba846e8c265d473cd36dc6ba6c40e9ab2b091d192092b9bbec56d360bafc3b02'
}

// make sure transact isn't called
const stub = sinon.stub(api, "transact").returns(transaction)

// transaction with same vaccount id as relayer itself
// should return 403
describe("POST /transaction", function() {
  it("transaction with same vaccount id as relayer itself", function(done) {

    supertest(app)
      .post("/transaction")
      .send({
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
      })
      .expect(403)
      .expect(() => {
        // make sure api.transact isn't called
        sinon.assert.notCalled(stub);
      })
      .end(function(err, res){
        if (err) {
          done(err)
        } else {
          done()
        }
      });
  });
});

// transaction with an invalid action
describe("POST /transaction wrong action", function() {
  it("it should give an error that the action isn't allowed", function(done) {
    supertest(app)
      .post("/transaction")
      .send({
        account: 'forceonkyli2',
        name: 'fakeaction!',
        authorization: [{
          actor: 'testjairtest',
          permission: 'active',
        }],
        data: {}
      })
      .expect(403)
      .end(function(err, res){
        if (err) done(err);
        done();
      });
  });
});

// transaction with an invalid contract
describe("POST /transaction wrong contract", function() {
  it("it should give an error that the contract isnt allowed", function(done) {
    supertest(app)
      .post("/transaction")
      .send({
        account: 'forceonkyli3',
        name: 'joincampaign',
        authorization: [{
          actor: 'testjairtest',
          permission: 'active',
        }],
        data: {}
      })
      .expect(403)
      .expect(() => {
        // make sure api.transact isn't called
        sinon.assert.notCalled(stub);
      })
      .end(function(err, res){
        if (err) done(err);
        done();
      });
  });
});

// transaction without sig that requires sig
describe("POST /transaction transaction without sig that requires sig", function() {
  it("transaction without sig that requires sig", function(done) {
    supertest(app)
      .post("/transaction")
      .send({
        account: 'forceonkyli2',
        name: 'joincampaign',
        authorization: [{
          actor: 'testjairtest',
          permission: 'active',
        }],
        data: {
          account_id: 999,
          campaign_id: 1,
          payer: process.env.RELAYER,
          sig: null,
        }
      })
      .expect(403)
      .expect(() => {
        // make sure api.transact isn't called
        sinon.assert.notCalled(stub);
      })
      .end(function(err, res){
        if (err) done(err);
        done();
      });
  });
});

// transaction should succeed
describe("POST /transaction", function() {
  it("transaction should succeed", function(done) {
    supertest(app)
      .post("/transaction")
      .send({
        account: 'forceonkyli2',
        name: 'joincampaign',
        authorization: [{
          actor: 'testjairtest',
          permission: 'active',
        }],
        data: {
          account_id: 999,
          campaign_id: 1,
          payer: process.env.RELAYER,
          sig: '123',
        }
      })
      .expect(200)
      .expect(function(res) {
        res.body.transaction_id = transaction.transaction_id;
      })
      .end(function(err, res){
        if (err) done(err);
        done();
      });
  });
});