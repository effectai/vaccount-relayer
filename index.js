import express from 'express';
import { Api, JsonRpc } from 'eosjs'
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig.js'
import fetch from 'node-fetch';
import bodyParser from 'body-parser'
import cors from 'cors'
const app = express()
const port = 3001

app.use(cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
})); 

// Add proper config
const config = {
  host: 'https://api.kylin.alohaeos.com:443',
  relayer: '',
  permission: 'active',
  privateKey: '',
  contracts: ['acckylin1111', 'forceonkyli2'],
  actions: ['open', 'vtransfer', 'withdraw', 'joincampaign', 'mkbatch', 'mkcampaign', 'reservetask', 'submittask']
}

const signatureProvider = new JsSignatureProvider([config.privateKey]);
const rpc = new JsonRpc(config.host, { fetch });
const api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });

app.post('/transaction', async (req, res) => {
  try {
    const transaction = req.body
  
    if (config.contracts.includes(transaction.account) && config.actions.includes(transaction.name)) {
      transaction.authorization[0].actor = config.relayer
      transaction.authorization[0].permission = config.permission

      // maybe specify for every action when payer needs to added?
      if (transaction.data.payer) {
        transaction.data.payer = config.relayer
      }

      const result = await api.transact({
        actions: [transaction]
      }, {
        blocksBehind: 3,
        expireSeconds: 30,
      });

      console.log('result', result)

      res.end(JSON.stringify(result.transaction_id));
    } else {
      throw new Error('Action not permitted')
    }
  } catch (error) {
    throw new Error(error)
  }
})

app.listen(port, () => {
  console.log(`Force relayer listening at http://localhost:${port}`)
})