'use strict';
require('dotenv').config();

const express     = require('express');
const bodyParser  = require('body-parser');
const cors        = require('cors');
const mongoose    = require('mongoose');

const apiRoutes         = require('./routes/api.js');
const fccTestingRoutes  = require('./routes/fcctesting.js');
const runner            = require('./test-runner');

const app = express();

/*
=========================
MONGODB CONNECTION
=========================
*/

mongoose.connect(process.env.DB)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

/*
=========================
MIDDLEWARE
=========================
*/

app.use('/public', express.static(process.cwd() + '/public'));
app.use(cors({ origin: '*' })); // FCC testing only
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/*
=========================
ROUTES
=========================
*/

// Sample front-end
app.route('/b/:board/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/board.html');
  });

app.route('/b/:board/:threadid')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/thread.html');
  });

// Index page
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });

// FCC testing
fccTestingRoutes(app);

// API routes
apiRoutes(app);

/*
=========================
404 HANDLER
=========================
*/

app.use(function(req, res) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

/*
=========================
START SERVER
=========================
*/

const listener = app.listen(process.env.PORT || 3000, function () {
  console.log('Your app is listening on port ' + listener.address().port);

  if (process.env.NODE_ENV === 'test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch (e) {
        console.log('Tests are not valid:');
        console.error(e);
      }
    }, 1500);
  }
});

module.exports = app;
