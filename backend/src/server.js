/**
 * server.js
 * Base Express application entry point.
 */

const http = require('http');
const ProjectService = require('./projects/project.service');
const { TaskService } = require('./tasks/task.service');

const PORT = process.env.PORT || 4000;

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200);
    return res.end(JSON.stringify({ status: 'UP', service: 'Qveto SaaS API', version: '1.0.0' }));
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: true, message: 'Endpoint not found' }));
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Qveto SaaS API server running on port ${PORT}`);
  });
}

module.exports = server;
