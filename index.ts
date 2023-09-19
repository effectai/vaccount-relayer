import express, { Request, Response } from 'express';
import dotenv from 'dotenv'
import cors from 'cors'

const app = express();

app.use(express.json());
app.use(cors());

const config = {
    host: process.env.HOST,
    relayer: process.env.RELAYER,
    permission: process.env.PERMISSION,
    privateKey: process.env.PRIV_KEY,
    relayerVAccountId: process.env.VACCOUNT_ID,
    contracts: (process.env.ALLOWED_CONTRACTS || '').split(', '),
    actions: ['mkbatch', 'rmcampaign', 'editcampaign', 'publishbatch', 'mkcampaign', 'reservetask',
              'submittask', 'payout'],
}

app.get('/', (req: Request, res: Response) => {
    res.send('OK');
});

app.get('/config', async (req, res) => {
  try {
    res.json(config.actions)
  } catch (error) {
    console.error(error)
    res.status(500).json(error)
  }
})

app.listen(3000, () => {
    console.log('Server is running on port 3000');
})
