import 'dotenv/config';
import { createApp } from './src/app.js';

const port = Number(process.env.PORT || 5000);
createApp().listen(port, () => console.log(`API listening at http://localhost:${port}`));
