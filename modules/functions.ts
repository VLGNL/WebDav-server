const express = require("express");
var session = require('cookie-session')
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as bcrypt from 'bcryptjs';

exports.makeid = function makeid(length: number) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

export function checkuser(req, res, next) {
    try {
        var Config = yaml.safeLoad(fs.readFileSync('data/config.yml', 'utf8'));
        const users = yaml.safeLoad(fs.readFileSync('data/users.yml', 'utf8'));
        Object.keys(users).forEach(function(key) {
            var val = users[key];
            if(val.Email == req.session.user_email) {
                if(req.session.user_Password == val.Password) {
                    req.session.user_email = req.body.email;
                    req.session.user_Password = val.Password;
                    req.session.user_CheckFree = Config.Security.CheckFree;
                    console.log("3");
                } else {
                    req.session = null;
                    console.log("2");
                    res.redirect('/login');
                }
            } else {
                req.session = null;
                console.log("1");
                res.redirect('/login');
            }
        });
    } catch (e) {
        console.log(e);
    }
}