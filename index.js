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
  relayerVAccountId: process.env.VACCOUNT_ID,
  contracts: ['acckylin1111', 'forceonkyli2'],
  actions: [
    {
      name: 'open',
      payer: true,
      sig: false,
      relayerNotAllowed: []
    },
    {
      name: 'vtransfer',
      payer: false,
      sig: true,
      relayerNotAllowed: ['from_id']
    },
    {
      name: 'withdraw',
      payer: false,
      sig: true,
      relayerNotAllowed: ['from_id']
    },
    {
      name: 'joincampaign',
      payer: true,
      sig: true,
      relayerNotAllowed: ['account_id']
    },
    {
      name: 'mkbatch',
      payer: true,
      sig: true,
      relayerNotAllowed: []
    },
    {
      name: 'mkcampaign',
      payer: true,
      sig: true,
      relayerNotAllowed: []
    },
    {
      name: 'reservetask',
      payer: true,
      sig: true,
      relayerNotAllowed: ['account_id']
    },
    {
      name: 'submittask',
      payer: true,
      sig: true,
      relayerNotAllowed: ['account_id']
    }]
}

const signatureProvider = new JsSignatureProvider([config.privateKey]);
const rpc = new JsonRpc(config.host, { fetch });
const api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });

app.post('/transaction', async (req, res) => {
  try {
    const transaction = req.body

    const action = config.actions.filter(action => {
      return action.name === transaction.name
    })

    // check if relayer vaccountid isn't used as account_id or from_account
    if (action[0]) {
      action[0].relayerNotAllowed.forEach(element => {
        if(transaction.data[element] == config.relayerVAccountId) {
          res.sendStatus(403)
          throw new Error('Action not permitted')
        }
      });
    }
  
    if (action[0] && config.contracts.includes(transaction.account) && (action[0].sig ? (transaction.data.sig && transaction.data.sig.length > 0) : true)) {
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

      res.end(JSON.stringify(result));
    } else {
      res.sendStatus(403)
      throw new Error('Action not permitted')
    }
  } catch (error) {
    res.sendStatus(400)
    throw new Error(error)
  }
})

app.listen(port, () => {
  console.log(`Force relayer listening at http://localhost:${port}`)
})

export default app