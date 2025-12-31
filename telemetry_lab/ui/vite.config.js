import { promises as fs } from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'telemetry-data-files',
      configureServer(server) {
        const dataDir = path.resolve(__dirname, '..', 'data');
        const dataFiles = {
          sample: 'sample.csv',
          cleaned: 'cleaned.csv',
          labels: 'labels.json',
          alerts: 'alerts.json',
          assets: 'asset_comms.json'
        };

        server.middlewares.use('/data', async (req, res, next) => {
          const requestPath = req.url?.split('?')[0].replace(/^\/+/, '');
          if (!requestPath) {
            return next();
          }

          const fileName = dataFiles[requestPath];
          if (!fileName) {
            res.statusCode = 404;
            res.end();
            return;
          }

          try {
            const filePath = path.join(dataDir, fileName);
            const contents = await fs.readFile(filePath);
            const extension = path.extname(fileName);
            const contentType =
              extension === '.csv' ? 'text/csv' : 'application/json';
            res.setHeader('Content-Type', contentType);
            res.statusCode = 200;
            res.end(contents);
          } catch (error) {
            next(error);
          }
        });
      }
    }
  ],
  server: {
    port: 5173,
    fs: {
      allow: ['..']
    }
  }
});
