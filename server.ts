/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import JSZip from 'jszip';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/routes/apiRoutes.js';
import dotenv from 'dotenv';

dotenv.config();

async function handleDownloadZip(req: express.Request, res: express.Response) {
  try {
    const zip = new JSZip();
    const rootDir = process.cwd();

    function addDirectoryToZip(currentDir: string, zipFolder: JSZip) {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        if (
          entry.name === 'node_modules' ||
          entry.name === 'dist' ||
          entry.name === '.git' ||
          entry.name === '.cache' ||
          entry.name.endsWith('.zip')
        ) {
          continue;
        }

        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          const nextFolder = zipFolder.folder(entry.name);
          if (nextFolder) {
            addDirectoryToZip(fullPath, nextFolder);
          }
        } else if (entry.isFile()) {
          const fileData = fs.readFileSync(fullPath);
          zipFolder.file(entry.name, fileData);
        }
      }
    }

    addDirectoryToZip(rootDir, zip);

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `hasebo-pos-app-${timestamp}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', zipBuffer.length);
    res.send(zipBuffer);
  } catch (error: any) {
    console.error('Failed to create zip archive:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to create zip archive: ' + (error?.message || 'Unknown error') });
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // CORS headers for PWA manifest & static asset inspectors (PWABuilder, Google Play TWA)
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Explicit PWA Manifest endpoints with correct content-type
  const serveManifest = (req: express.Request, res: express.Response) => {
    const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      const manifestContent = fs.readFileSync(manifestPath, 'utf8');
      res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.send(manifestContent);
    }
    res.status(404).json({ error: 'Manifest not found' });
  };

  app.get('/manifest.json', serveManifest);
  app.get('/site.webmanifest', serveManifest);
  app.get('/manifest.webmanifest', serveManifest);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Direct ZIP download endpoints
  app.get('/download-zip', handleDownloadZip);
  app.get('/api/download-zip', handleDownloadZip);
  app.get('/api/export-project-zip', handleDownloadZip);
  app.get('/hasebo-pos-source.zip', handleDownloadZip);
  app.get('/hasebo-pos-app.zip', handleDownloadZip);

  // Mount ERP API routes
  app.use('/api', apiRouter);

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(` Grocery ERP & POS Server running at http://0.0.0.0:${PORT}`);
    console.log(` Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(`====================================================`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
