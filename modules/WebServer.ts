const express = require("express");
var session = require('cookie-session')
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as bcrypt from 'bcryptjs';

const router = express.Router();


router.use(function (req, res, next) {
    if(req.session.user_CheckFree < 1) {
        console.log("tesqst");
        req.session.user_CheckFree = 3;
    } else {
        console.log("test");
        req.session.user_CheckFree--;
    }
})

router.get("/", (req, res)=>{
    res.status(200).send("hello");
});

// Access the session as req.session
router.get('/e', function(req, res, next) {
    if(req.session.views) {
        req.session.views++
        res.setHeader('Content-Type', 'text/html')
        res.write('<p>view: ' + req.session.view + '</p>')
        res.write('<p>views: ' + req.session.views + '</p>')
        res.end()
    } else {
        req.session.views = 1
        res.end('welcome to the session demo. refresh!')
    }
});
router.get('/a', function(req, res, next) {
    if(req.session.view) {
        req.session.view++
        res.setHeader('Content-Type', 'text/html')
        res.write('<p>view: ' + req.session.view + '</p>')
        res.write('<p>views: ' + req.session.views + '</p>')
        res.end()
    } else {
        req.session.view = 1
        res.end('welcome to the session demo. refresh!')
    }
});

module.exports = router;