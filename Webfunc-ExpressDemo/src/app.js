const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

app.get(`/`, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get(`/logo`, (req, res) => {
  const logo = path.join(__dirname, 'logo.png');
  const content = fs.readFileSync(logo, {
    encoding: 'base64',
  });
  res.set('Content-Type', 'image/png');
  res.send(Buffer.from(content, 'base64'));
  res.status(200).end();
});

app.get('/user', (req, res) => {
  res.send([
    {
      title: 'serverless framework',
      link: 'https://serverless.com',
    },
  ]);
});

app.get('/user/:id', (req, res) => {
  const id = req.params.id;
  res.send({
    id: id,
    title: 'serverless framework',
    link: 'https://serverless.com',
  });
});

app.get('/404', (req, res) => {
  res.status(404).send('Not found');
});

app.get('/500', (req, res) => {
  res.status(500).send('Server Error');
});

// Error handler
app.use(function (err, req, res, next) {
  console.error(err);
  res.status(500).send('Internal Serverless Error');
});

// Web 类型云函数，只能监听 9000 端口
app.listen(9000, () => {
  console.log(`Server start on http://localhost:9000`);
});
