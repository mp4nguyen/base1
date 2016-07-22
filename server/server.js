var loopback = require('loopback');
var boot = require('loopback-boot');
var bodyParser = require('body-parser');
var multer = require('multer');
var fs = require('fs'); //**fs: Handle file system**
var http = require('http');
var https = require('https');

var app = module.exports = loopback();

/////////////////begin to set security/////////////////
var HashMap = require('hashmap');
var userHashMap = new HashMap();//to store all user
var companyHashMap = new HashMap();//to store all company of user

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
//app.use(multer({ dest: './uploads/'})); // for parsing multipart/form-data
//app.use(multer().any());

app.use(loopback.context());
app.use(loopback.token());
app.use(function setCurrentUser(req, res, next) {

    /*
    if( req.accessToken){
        logger.log('info',"> Req at proId =  " + process.pid + " url = " + req.url + " userId = " + req.accessToken.userId);
    }else{
        logger.log('info',"> Req at proId =  " + process.pid + " url = " + req.url);
    }
    */
    if (!req.accessToken) {
        //if no login and accessToken == null => set companyId = -1
        var loopbackContext = loopback.getCurrentContext();
        loopbackContext.set('companyId', -1);
        //logger.log('info',"> Req at proId =  " + process.pid + " url = " + req.url);
        return next();
    }
    else{
        /// caching user and company object .If in the hash, get in the hash
        var currUser = userHashMap.get(req.accessToken.id);
        if(currUser){
            //console.log(">>>>>>>Get from hash",currUser.password);
            var loopbackContext = loopback.getCurrentContext();
            loopbackContext.set('companyId', currUser.companyId);
            loopbackContext.set('currentUser', currUser);
            loopbackContext.set('accessToken', req.accessToken);
            var currCompany = companyHashMap.get(req.accessToken.id);
            if(currCompany){
                loopbackContext.set('company', currCompany);
                //logger.log('info',"> Req at proId =  " + process.pid + " url = " + req.url + " userId = " + req.accessToken.userId + " companyId = " + currUser.companyId + " companyName="+currCompany.companyName);
                next();
            }else{
                app.models.CCompanies.findById(currUser.companyId,function(err,company){
                    if (err) {
                        return next(err);
                    }
                    companyHashMap.set(req.accessToken.id,company);
                    if(company){
                        //logger.log('info',"> Req at proId =  " + process.pid + " url = " + req.url + " userId = " + req.accessToken.userId + " companyId = " + company.id + " companyName="+company.companyName);
                    }else{
                        //logger.log('info',"> Req at proId =  " + process.pid + " url = " + req.url + " userId = " + req.accessToken.userId);
                    }
                    loopbackContext.set('company', company);
                    next();
                });
            }

        }else{

            app.models.CUsers.findById(req.accessToken.userId, function(err, user) {
                console.log('user =',user);
                if (err) {
                    return next(err);
                }
                if (!user) {
                    return next(new Error('No user with this access token was found.'));
                }
                userHashMap.set(req.accessToken.id,user);
                //console.log("companyId = ",user);
                var loopbackContext = loopback.getCurrentContext();
                //console.log(loopbackContext);
                if (loopbackContext) {
                    loopbackContext.set('companyId', user.companyId);
                    loopbackContext.set('currentUser', user);
                    loopbackContext.set('accessToken', req.accessToken);
                }
                app.models.CCompanies.findById(user.companyId,function(err,company){
                    if (err) {
                        return next(err);
                    }
                    companyHashMap.set(req.accessToken.id,company);

                    if(company){
                        //logger.log('info',"> Req at proId =  " + process.pid + " url = " + req.url + " userId = " + req.accessToken.userId + " companyId = " + company.id + " companyName="+company.companyName);
                    }else{
                        //logger.log('info',"> Req at proId =  " + process.pid + " url = " + req.url + " userId = " + req.accessToken.userId);
                    }

                    loopbackContext.set('company', company);

                    next();
                });

            });
        }
    }
});
/////////////////end to set security/////////////////

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
