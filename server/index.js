/**
 * Gas Surfer API server entry — listens on PORT (default 3001).
 */

import app from './app.js';

const PORT = Number(process.env.PORT) || 3001;

app.listen(PORT, () => {
  console.log(`Gas Surfer API listening on http://localhost:${PORT}`);
});
