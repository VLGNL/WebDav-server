// @ts-nocheck
import { v2 as webdav } from 'webdav-server';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as bcrypt from 'bcryptjs';
import * as ownf from "./modules/functions";
import * as apps from "./modules/WebServer";
import * as setupapp from "./modules/Setup";
import * as express from 'express';
import * as cookieSession from 'cookie-session'
var spawn = require('child_process').spawn;

const app: express.Application = express();

app.set('view engine', 'ejs');
app.set('trust proxy', 1) // trust first proxy

app.use(express.urlencoded());
app.use(express.json());







app.use('/assets', express.static('views/assets'))

function installed() {
    var Config = {};

    try {
        const configF = yaml.safeLoad(fs.readFileSync('data/config.yml', 'utf8'));
        Config = configF;
    } catch (e) {
        console.log(e);
    }

    var renderconf = {"Config": Config};

    app.use(cookieSession({
        maxAge: 1*60*60*1000, //1 hour
        name: 'session',
        keys: ['VLG', 'NL'],
        saveUninitialized: true
    }));


    app.get("/login", (req, res) => {
        if(req.session.user_email === undefined || req.session.user_CheckFree === undefined
            || req.session.user_Password === undefined) {
            res.render('login', renderconf);
        } else {
            res.redirect('/dashboard');
        }
    });

    app.post('/login', function (req, res) {
        try {
            const users = yaml.safeLoad(fs.readFileSync('data/users.yml', 'utf8'));
            Object.keys(users).forEach(function(key) {
                var val = users[key];
                if(val.Email == req.body.email) {
                    if(bcrypt.compareSync(req.body.Password, val.Password)) {
                        req.session.user_email = req.body.email;
                        req.session.user_Password = val.Password;
                        req.session.user_CheckFree = Config.Security.CheckFree;
                        res.redirect('/dashboard');
                    } else {
                        req.session.loginfail = 1;
                        res.redirect('/login');
                    }
                } else {
                    req.session.loginfail = 1;
                    res.redirect('/login');
                }
            });
        } catch (e) {
            console.log(e);
        }
    })
    app.use('/', apps);



    const userManager = new webdav.SimpleUserManager();
    const privilegeManager = new webdav.SimplePathPrivilegeManager();

    var passwordhashs = {};

    class Auth implements HTTPAuthentication {
        constructor(public userManager : ITestableUserManager, public realm : string = 'realm') { }

        askForAuthentication(ctx : HTTPRequestContext) {
            return {
                'WWW-Authenticate': 'Basic realm="' + this.realm + '"'
            }
        }

        getUser(ctx : HTTPRequestContext, callback : (error : Error, user : IUser) => void) {
            const onError = (error : Error) => {
                this.userManager.getDefaultUser((defaultUser) => {
                    callback(error, defaultUser)
                })
            }

            const authHeader = ctx.headers.find('Authorization');
            if(!authHeader)  {
                onError(webdav.Errors.MissingAuthorisationHeader)
                return;
            }
            if(!/^Basic \s*[a-zA-Z0-9]+=*\s*$/.test(authHeader)) {
                onError(webdav.Errors.WrongHeaderFormat);
                return;
            }

            const value = Buffer.from(/^Basic \s*([a-zA-Z0-9]+=*)\s*$/.exec(authHeader)[1], 'base64').toString().split(':', 2);
            const username = value[0];
            var password = "false";

            if(passwordhashs[username]) {
                if(bcrypt.compareSync(value[1], passwordhashs[username])) {
                    password = "true";
                }
            }

            this.userManager.getUserByNamePassword(username, password, (e, user) => {
                if(e) {
                    onError(webdav.Errors.BadAuthentication);
                } else {
                    callback(null, user);
                }
            });
        }
    }


    try {
        const users = yaml.safeLoad(fs.readFileSync('data/users.yml', 'utf8'));
        Object.keys(users).forEach(function(key) {
            var val = users[key];
            passwordhashs[val.Naam] = val.Password;

            var user = userManager.addUser(val.Naam, "true", false);
            privilegeManager.setRights(user, '/', [ 'all' ]);
        });
    } catch (e) {
        console.log(e);
    }

    const server = new webdav.WebDAVServer({
        requireAuthentification: true,
        httpAuthentication: new Auth(userManager, 'Default realm'),
        privilegeManager: privilegeManager,
        port: 2000
    });

    server.setFileSystem('/test', new webdav.PhysicalFileSystem('data'), (success) => console.log(success));
    server.start(() => console.log('READY'));
}

app.get("/setup/reboot", (req, res) => {
    console.log("tkg");
});

function setup() {
    app.use('/', setupapp);
}

function runcheck() {
    try {
        if(!fs.existsSync("./data/users.yml")) {
            setup();
            console.log("setup 2");
        } else {
            installed();
        }
    } catch (err) {
        console.error(err);
    }    
}

try {
    var Config = yaml.safeLoad(fs.readFileSync('./data/config.yml', 'utf8'));
    if(Config.Setup != false) {
        setup();
        console.log("setup 1");
    } else {
        runcheck();
    }
} catch (e) {
    console.log(e);
}


app.listen(3000, function () {
    console.log('App is listening on port 3000!');
});