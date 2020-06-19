const express = require("express");
var session = require('cookie-session')
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as bcrypt from 'bcryptjs';
import * as ownf from "./functions";

const router = express.Router();

// router.use(function (req, res, next) {
//     try {
//         var Config = yaml.safeLoad(fs.readFileSync('./data/config.yml', 'utf8'));
//     } catch (e) {
//         console.log(e);
//     }

//     if(Config.Setup != "account") {
//         if(req.session.user_email === undefined || req.session.user_CheckFree === undefined
//             || req.session.user_Password === undefined) {
//             res.redirect('/setup/login')
//         } else if(req.session.user_CheckFree < 1) {
//             ownf.checkuser(req, res, next);
//             next();
//         } else {
//             console.log("testas");
//             req.session.user_CheckFree--;
//             next();
//         }
//     }
// })


router.get("/setup", (req, res) => {
    try {
        var Config = yaml.safeLoad(fs.readFileSync('./data/config.yml', 'utf8'));
    } catch (e) {
        console.log(e);
    }
    if(Config.Setup == "account") {
        res.render('setup/account');
    } else if(Config.Setup == "Config") {
        if(req.session.user_email === undefined || req.session.user_CheckFree === undefined
            || req.session.user_Password === undefined) {
                res.redirect('/setup/login');
        } else {
            res.render('setup/Config');
        }
    }
});


router.post('/setup/account', function (req, res) {
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(req.body.password, salt);
    try {
        var Config = yaml.safeLoad(fs.readFileSync('./data/config.yml', 'utf8'));
    } catch (e) {
        console.log(e);
    }
    var t = JSON.stringify(req.body.name);
    let data = {
        [req.body.name]: {
            Naam: req.body.email,
            Password: hash,
            Email: req.body.email,
            Rights: [
                "all"
            ],
            Web: {
                'Perms': [
                    "all"
                ]   
            }
        }
    };

    
let yamlStr = yaml.safeDump(data);
fs.writeFileSync('data-out.yaml', yamlStr, 'utf8');

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

router.get("/setup/login", (req, res) => {
    if(req.session.user_email === undefined || req.session.user_CheckFree === undefined
        || req.session.user_Password === undefined) {
        res.render('setup/login');
    } else {
        res.redirect('/dashboard');
    }
});

router.post('/login', function (req, res) {
    try {
        var Config = yaml.safeLoad(fs.readFileSync('./data/config.yml', 'utf8'));
    } catch (e) {
        console.log(e);
    }
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

router.get("/system/reboot", (req, res) => {
    res.redirect("/");
    process.exit();
});

module.exports = router;