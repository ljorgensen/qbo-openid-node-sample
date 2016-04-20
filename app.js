// dependencies
var oid = require('openid'),
    express = require('express'),
    app = express();

// substitute your port
var port = normalizePort(process.env.PORT || '3000');

// set up routing/middleware as needed
app.set('port', port);
app.set('views', 'views');
app.set('view engine', 'ejs');
app.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});
app.get('/', function(req, res) {
    res.render('index.ejs');
});

// substitute your open id verification url
var verifyUrl = 'https://qbo-openid-node-sample:' + port +'/verify/';

// use Intuit's discovery url instead of provider url, because OpenID for node.js uses discovery
var openIdXrds = 'https://openid.intuit.com/openid/xrds';

// openid extensions -- update as needed for your application
var extensions = [
    new oid.SimpleRegistration({
        "email" : true, 
        "fullname" : true
    }),
    new oid.AttributeExchange({
        "http://axschema.org/contact/email": "required",
        "http://axschema.org/namePerson": "required"
    }),
    new oid.PAPE({
        "max_auth_age": 24 * 60 * 60, // one day
        "preferred_auth_policies" : "none" // no auth method preferred.
    })
];

// initialize openId relying party, using your own choices for (returnUrl, realm, stateless, strict, extensions)
var relyingParty = new oid.RelyingParty(verifyUrl, null, false, false, extensions);
// a user object for the sake of this example
var user = {};

// call openid's RelyingParty to authenticate
app.get('/authenticate', function(req, res) {
    relyingParty.authenticate(openIdXrds, false, function(error, authUrl) {
        if (error) {
            // handle error, e.g.:
            res.writeHead(200, { 'Content-Type' : 'text/plain; charset=utf-8' });
            res.end('Authentication failed: ' + error.message);
        } else if (!authUrl) {
            // handle missing auth url, e.g.:
            res.writeHead(200, { 'Content-Type' : 'text/plain; charset=utf-8' });
            res.end('Authentication failed');
        } else {
            // handle success, e.g.:
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
            // Result contains the answers from the specified extensions
            if (result.authenticated) {
                // handle successful authentication, e.g. provision your user object:
                user.id = result.claimedIdentifier;
                user.email = result.email;
                user.fullname = result.fullname;
                // update with desired behavior (e.g. redirect to post-login url)
                res.writeHead(200, { 'Content-Type' : 'text/plain; charset=utf-8' });
                res.end('Authentication succeeded: ' + '\n\n' + JSON.stringify(user));
            } else {
                // update desired behavior (e.g. redirect to login retry url)
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