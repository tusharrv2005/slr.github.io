const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');

const sectionDetails = {
  hospital: {
    title: 'SLR Hospital',
    description:
      '24x7 emergency, OPD, diagnostics aur specialist doctors ke saath comprehensive healthcare services.',
    services: ['Emergency Care', 'General OPD', 'Diagnostics', 'Pharmacy']
  },
  lawn: {
    title: 'SLR Lawn',
    description:
      'Shaadi, reception, birthday aur corporate events ke liye spacious aur well-managed event lawn.',
    services: ['Wedding Events', 'Catering Support', 'Decoration', 'Parking Facility']
  },
  school: {
    title: 'SLR School',
    description:
      'Quality education, experienced teachers aur co-curricular activities ke saath holistic development.',
    services: ['Primary to Senior Classes', 'Smart Classrooms', 'Sports', 'Computer Lab']
  }
};

const inquiries = [];

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      if (!data) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function serveFile(res, filename) {
  const filePath = path.join(publicDir, filename);

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Page not found');
      return;
    }

    const ext = path.extname(filePath);
    res.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream'
    });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = requestUrl;

  if (req.method === 'GET' && pathname === '/api/sections') {
    sendJson(res, 200, { success: true, data: sectionDetails });
    return;
  }

  if (req.method === 'GET' && pathname.startsWith('/api/sections/')) {
    const sectionName = pathname.split('/').pop().toLowerCase();
    const section = sectionDetails[sectionName];

    if (!section) {
      sendJson(res, 404, {
        success: false,
        message: 'Section nahi mila. Valid options: hospital, lawn, school.'
      });
      return;
    }

    sendJson(res, 200, { success: true, data: section });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/inquiry') {
    try {
      const body = await parseBody(req);
      const { name, phone, section, message } = body;

      if (!name || !phone || !section || !message) {
        sendJson(res, 400, {
          success: false,
          message: 'Name, phone, section aur message sab required hain.'
        });
        return;
      }

      const inquiry = {
        id: inquiries.length + 1,
        name,
        phone,
        section,
        message,
        createdAt: new Date().toISOString()
      };

      inquiries.push(inquiry);

      sendJson(res, 201, {
        success: true,
        message: 'Inquiry successfully submit ho gayi.',
        data: inquiry
      });
    } catch (error) {
      sendJson(res, 400, {
        success: false,
        message: error.message
      });
    }
    return;
  }

  if (req.method === 'GET' && pathname === '/api/inquiry') {
    sendJson(res, 200, { success: true, data: inquiries });
    return;
  }

  if (req.method === 'GET' && pathname === '/') {
    serveFile(res, 'index.html');
    return;
  }

  if (req.method === 'GET' && pathname === '/hospital') {
    serveFile(res, 'hospital.html');
    return;
  }

  if (req.method === 'GET' && pathname === '/lawn') {
    serveFile(res, 'lawn.html');
    return;
  }

  if (req.method === 'GET' && pathname === '/school') {
    serveFile(res, 'school.html');
    return;
  }

  const safePath = path.normalize(pathname).replace(/^\/+/, '');
  if (req.method === 'GET' && safePath.startsWith('..') === false) {
    const potentialFile = path.join(publicDir, safePath);
    if (potentialFile.startsWith(publicDir) && fs.existsSync(potentialFile)) {
      serveFile(res, safePath);
      return;
    }
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`SLR Group website server running on http://localhost:${PORT}`);
});
