const express = require('express');
const mystiko = require('mystiko');

(async () => {
  await mystiko({ env: 'dev' });

  const app = express();
  const port = 3000;

  app.get('/', (req, res) => {
    const { SOME_CREDS } = process.env;

    res.json(JSON.stringify({
      SOME_CREDS: new Array(SOME_CREDS.length).fill('*')
    }));
  });

  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
  });

})();
