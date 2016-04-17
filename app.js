// dependencies
var oid = require('openid'),
    express = require('express'),
    app = express();

// substitute your port
var port = normalizePort(process.env.PORT || '8080');

// substitute your open id callback url
var verifyUrl = 'https://qbo-openid-node-sample-stormgrrl.c9users.io:' + port +'/verify/';

// use Intuit's discovery url instead of provider, because OpenID for node.js uses discovery
var openIdDiscovery = 'https://openid.intuit.com/openid/xrds';

// openid extensions -- update as needed for your application
var extensions = [
    new oid.SimpleRegistration({
        "realmId" : true, 
        "email" : true, 
        "fullname" : true
    }),
    new oid.AttributeExchange({
        "http://axschema.org/contact/email": "required",
        "http://axschema.org/namePerson": "required",
        "http://axschema.org/intuit/realmId": "required"
    }),
    new oid.PAPE({
        "max_auth_age": 24 * 60 * 60, // one day
        "preferred_auth_policies" : "none" // no auth method preferred.
    })
];

app.set('port', port);
app.set('views', 'views');
app.set('view engine', 'ejs');
app.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});

app.get('/', function(req, res) {
    res.render('index.ejs');
});

// create relying party
var relyingParty = new oid.RelyingParty(verifyUrl, null, false, false, extensions);
var user = {};

// call openid's RelyingParty to authenticate
app.get('/authenticate', function(req, res) {
    relyingParty.authenticate(openIdDiscovery, false, function(error, authUrl) {
        if (error) {
            res.writeHead(200, { 'Content-Type' : 'text/plain; charset=utf-8' });
            res.end('Authentication failed: ' + error.message);
        } else if (!authUrl) {
            res.writeHead(200, { 'Content-Type' : 'text/plain; charset=utf-8' });
            res.end('Authentication failed');
        } else {
            res.writeHead(302, { Location: authUrl });
            res.end();
        }
    });
});

// verify whether authentication has succeeded
app.get('/verify', function(req, res) {
    relyingParty.verifyAssertion(req, function(error, result) {
        if (error) {
            // handle error, e.g.:
            res.writeHead(200, { 'Content-Type' : 'text/plain; charset=utf-8' });
            res.end('Error occurred during authentication: ' + error.message);
        } else {
            // Result contains:
            // - authenticated (true/false)
            // - answers from any extensions
            if (result.authenticated) {
                // handle successful authentication, e.g.:
                user.id = result.claimedIdentifier;
                user.email = result.email;
                user.fullname = result.fullname;
                // realmId won't be returned for this example because the user isn't launching it from Apps.com
                user.realmId = result.realmId;
                // substitute appropriate behavior (e.g. redirect)
                res.writeHead(200, { 'Content-Type' : 'text/plain; charset=utf-8' });
                res.end('Authentication succeeded: ' + '\n\n' + JSON.stringify(user));
            } else {
                // handle failure to authenticate (do something better than this)
                res.writeHead(200, { 'Content-Type' : 'text/plain; charset=utf-8' });
                res.end('Authentication failed: ' + '\n\n' + JSON.stringify(result));
            }
        }
    });
});

// normalize port into a number, string, or false
function normalizePort(val) {
    var port = parseInt(val, 10);
    if (isNaN(port)) {
        // named pipe
        return val;
    }
    if (port >= 0) {
        // port number
        return port;
    }
    // false
    return false;
}