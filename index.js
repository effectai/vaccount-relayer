import express from 'express';
import { Api, JsonRpc } from 'eosjs'
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig.js'
import fetch from 'node-fetch';
import bodyParser from 'body-parser'
import cors from 'cors'
import dotenv from 'dotenv'

if(process.argv[2] === 'local') {
  console.log(`Running local environment\Host: ${process.env.HOST}, Relayer: ${process.env.RELAYER}`)
  dotenv.config({ path: '.env.local' })
} else {
  console.log(`Running local environment\Host: ${process.env.HOST}, Relayer: ${process.env.RELAYER}`)
  dotenv.config({ path: '.env' })
}

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
  contracts: process.env.ALLOWED_CONTRACTS.split(", "),
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
      sig: false,
      relayerNotAllowed: []
    },
    {
      name: 'rmbatch',
      payer: false,
      sig: true,
      relayerNotAllowed: []
    },
    {
      name: 'rmcampaign',
      payer: false,
      sig: true,
      relayerNotAllowed: []
    },
    {
      name: 'publishbatch',
      payer: false,
      sig: false,
      relayerNotAllowed: ['account_id']
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
    },
    {
      name: 'releasetask',
      payer: true,
      sig: true,
      relayerNotAllowed: ['account_id']
    },
    {
      name: 'reclaimtask',
      payer: true,
      sig: true,
      relayerNotAllowed: ['account_id']
    },
    {
      name: 'editcampaign',
      payer: true,
      sig: true,
      relayerNotAllowed: []
    },
    {
      name: 'payout',
      payer: false,
      sig: true,
      relayerNotAllowed: []
    },
    {
      name: 'closebatch',
      payer: false,
      sig: true,
      relayerNotAllowed: []
    },
    {
      name: 'reopenbatch',
      payer: false,
      sig: true,
      relayerNotAllowed: []
    },
    {
      name: 'mkquali',
      payer: false,
      sig: true,
      relayerNotAllowed: []
    },
    {
      name: 'assignquali',
      payer: false,
      sig: true,
      relayerNotAllowed: []
    },
    {
      name: 'uassignquali',
      payer: true,
      sig: false,
      relayerNotAllowed: []
    },
    {
      name: 'editquali',
      payer: true,
      sig: false,
      relayerNotAllowed: []
    }
  ]
}

const signatureProvider = new JsSignatureProvider([config.privateKey]);
const rpc = new JsonRpc(config.host, { fetch });
const api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });

app.post('/transaction', async (req, res) => {
  try {
    const reqActions = req.body

    // If action is not present return a 404
    // if (!config.actions.includes(reqActions.name)) {
    //   return res.status(404).json(JSON.stringify(`Action ${reqActions.name} not found`))
    // } 

    for (let i = 0; i < reqActions.length; i++) {
      const action = config.actions.filter(action => {
        return action.name === reqActions[i].name
      })[0]

      // check if relayer vaccountid isn't used as account_id or from_account
      if (action) {
        action.relayerNotAllowed.forEach(element => {
          if(reqActions[i].data[element] == config.relayerVAccountId) {
            return res.status(403).json(JSON.stringify(`Action ${action.name} not permitted`));
          }
        });
      }

      console.log(reqActions[i].name)
      if (action && config.contracts.includes(reqActions[i].account) && (action.sig ? (reqActions[i].data.sig && reqActions[i].data.sig.length > 0) : true)) {
        reqActions[i].authorization[0].actor = config.relayer
        reqActions[i].authorization[0].permission = config.permission

        if (action.payer) {
          reqActions[i].data.payer = config.relayer
        }
      } else {
        return res.status(403).json(JSON.stringify(`Action ${action.name} not permitted`));
      }
    }

    await api.transact({
      actions: reqActions
    }, {
      blocksBehind: 3,
      expireSeconds: 30,
    }).then((data) => {
      return res.json(JSON.stringify(data));
    })
    .catch((error) => {
      console.error('api.transact error: ', error.toString())
      return res.status(500).json(JSON.stringify(error.toString()));
    });

  } catch (error) {
    console.error(error)
    res.status(500)
    return res.json(JSON.stringify(error));
  }
})

app.get('/config', async (req, res) => {
  try {
    res.json(config.actions)
  } catch (error) {
    console.error(error)
    res.status(500).json(error)
  }
})

app.get('/info', async (req, res) => {
  try {
    const info = await rpc.get_info()
    res.json(info)
  } catch (error) {
    console.error(error)
    res.status(500).json(error)
  }
})

app.get('/hello', async (req, res) => {
  try {
    res.json('Hello World!')
  } catch (error) {
    console.error(error)
    res.status(500).json(error)
  }
})

app.get('/status', async (req, res) => {
  try {
    const account_info = await rpc.get_account(config.relayer) 
    res.json(account_info)
  } catch (error) {
    console.error(error)
    res.status(500).json(error)
  }
})

app.listen(port, () => {
  console.log(`Force listening at http://localhost:${port}`)
})

export default app
