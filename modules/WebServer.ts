const express = require("express");
var session = require('cookie-session')
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as bcrypt from 'bcryptjs';
import * as ownf from "./functions";

const router = express.Router();

try {
    var Config = yaml.safeLoad(fs.readFileSync('./data/config.yml', 'utf8'));
} catch (e) {
    console.log(e);
}

router.use(function (req, res, next) {
    if(req.session.user_email === undefined || req.session.user_CheckFree === undefined
        || req.session.user_Password === undefined) {
        res.redirect('/login')
        console.log("tesqasaswst");
    } else if(req.session.user_CheckFree < 1) {
        ownf.checkuser(req, res, next);
        next();
    } else {
        console.log("testas");
        req.session.user_CheckFree--;
        next();
    }
})

router.get("/", (req, res)=>{
    res.status(200).send("hello");
});

module.exports = router;