const fs = require('fs');

var options = {
    key: fs.readFileSync('../../../../etc/letsencrypt/live/rfpdnd.com/privkey.pem'),
    cert: fs.readFileSync('../../../../etc/letsencrypt/live/rfpdnd.com/cert.pem'),
    requestCert: false,
    rejectUnathorized: false,
};

const Server = require('./app');

new Server(options);