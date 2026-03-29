import express from 'express';
import cors from 'cors';
import { simulateRoute } from './routes/simulate';
import { tokenRoute } from './routes/token';
import { riskRoute } from './routes/risk';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/simulate', simulateRoute);
app.use('/api/token', tokenRoute);
app.use('/api/risk', riskRoute);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'CLAW Engine Online', version: '1.0.0' });
});

app.listen(PORT, () => {
  console.log(`[CLAW] ShadowClaw engine running on port ${PORT}`);
});
