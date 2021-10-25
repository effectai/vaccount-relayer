import express from 'express';
import { Api, JsonRpc } from 'eosjs'
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig.js'
import fetch from 'node-fetch';
import bodyParser from 'body-parser'
import cors from 'cors'
import dotenv from 'dotenv'
dotenv.config()
const app = express()
const port = 3001

app.use(cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
})); 

const config = {
  host: process.env.HOST,
  relayer: process.env.RELAYER,
  permission: process.env.PERMISSION,
  privateKey: process.env.PRIV_KEY,
  contracts: ['acckylin1111', 'forceonkyli2'],
  actions: [
    {
      name: 'open',
      payer: true,
      sig: false
    },
    {
      name: 'vtransfer',
      payer: false,
      sig: true
    },
    {
      name: 'withdraw',
      payer: false,
      sig: true
    },
    {
      name: 'joincampaign',
      payer: true,
      sig: true
    },
    {
      name: 'mkbatch',
      payer: true,
      sig: true
    },
    {
      name: 'mkcampaign',
      payer: true,
      sig: true
    },
    {
      name: 'reservetask',
      payer: true,
      sig: true
    },
    {
      name: 'submittask',
      payer: true,
      sig: true
    }]
}

const signatureProvider = new JsSignatureProvider([config.privateKey]);
const rpc = new JsonRpc(config.host, { fetch });
const api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });

// TODO: UNIT test
app.post('/transaction', async (req, res) => {
  try {
    const transaction = req.body

    const action = config.actions.filter(action => {
      return action.name === transaction.name
    })
  
    if (action && config.contracts.includes(transaction.account) && (action[0].sig ? (transaction.data.sig && transaction.data.sig.length > 0) : true)) {
      transaction.authorization[0].actor = config.relayer
      transaction.authorization[0].permission = config.permission

      if (action[0].payer) {
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