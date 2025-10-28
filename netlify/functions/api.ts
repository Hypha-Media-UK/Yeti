import serverless from 'serverless-http';
import app from '../../backend/src/app';

// Wrap the Express app with serverless-http for Netlify
export const handler = serverless(app);

