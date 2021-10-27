import { Api, JsonRpc } from 'eosjs'
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig.js'
import dotenv from 'dotenv'
import fetch from 'node-fetch';
dotenv.config()

const config = {
  host: process.env.HOST,
  relayer: process.env.RELAYER,
  permission: process.env.PERMISSION,
  privateKey: process.env.PRIV_KEY,
  relayerVAccountId: process.env.VACCOUNT_ID,
  contracts: ['acckylin1111', 'forceonkyli2']
}

const signatureProvider = new JsSignatureProvider([config.privateKey]);
const rpc = new JsonRpc(config.host, { fetch });
const api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });

export default api