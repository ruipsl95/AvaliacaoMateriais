const https = require('https');

// Substitua pelo URL final do seu projeto no Render
const URL = 'https://espe-avaliacao.onrender.com';

const options = {
  headers: {
    // Disfarçar o script como se fosse um utilizador normal num browser (Chrome em Windows)
    // Isto evita que firewalls ou o próprio Render bloqueiem o pedido por ser um "bot"
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'pt-PT,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'Connection': 'keep-alive'
  }
};

https.get(URL, options, (res) => {
  console.log(`[${new Date().toISOString()}] Pinged ${URL}. Status Code: ${res.statusCode}`);
}).on('error', (err) => {
  console.error(`Error pinging ${URL}:`, err.message);
});
