const http = require('http');

const data = JSON.stringify({ email: 'admin@insurance.com', password: 'admin123' });

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (d) => body += d);
  res.on('end', () => {
    const token = JSON.parse(body).token;
    
    // Now renew
    const renewReq = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/policy/2/renew',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Length': 0
      }
    }, (renewRes) => {
      let renewBody = '';
      renewRes.on('data', (d) => renewBody += d);
      renewRes.on('end', () => {
        console.log("Status:", renewRes.statusCode);
        console.log("Body starts with:", renewBody.substring(0, 1000));
      });
    });
    renewReq.end();
  });
});
req.write(data);
req.end();
