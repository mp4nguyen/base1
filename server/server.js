var loopback = require('loopback');
var boot = require('loopback-boot');
var fs = require('fs'); //**fs: Handle file system**
var http = require('http');
var https = require('https');

var app = module.exports = loopback();

/*
app.start = function() {
  // start the web server
  return app.listen(function() {
    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module)
    app.start();
});
*/


app.httpsStart = function() {
    // start the web server
    var ssl_options = {
        pfx: fs.readFileSync('key/star_redimed_com_au.pfx'),
        passphrase: '1234'
    }; //**SSL file and passphrase use for server
    var server = https.createServer(ssl_options, app);
    server.listen(app.get('port'), function() {
        var baseUrl = 'https://' + app.get('host') + ':' + app.get('port');
        app.emit('started', baseUrl);
        console.log('LoopBack server listening @ %s%s', baseUrl, '/');
        if (app.get('loopback-component-explorer')) {
            var explorerPath = app.get('loopback-component-explorer').mountPath;
            console.log('Browse your REST API at %s%s' + 'process = ' + process.pid, baseUrl, explorerPath);
        }
    });
    return server;
};


// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.

boot(app, __dirname, function(err) {
    if (err) throw err;

    // start the server if `$ node server.js`
    if (require.main === module)
        app.httpsStart();
});
