const {Router, response} = require('express')
const router = Router()
const md5 = require('js-md5')
const axios = require('axios')
const moment = require('moment')
const nodeSid = require('node-sid');
const jwt = require('jsonwebtoken');
const config = require('../config/secret');

moment.locale('ru')

const devicesSchema = require('../models/devices')
const accountingSchema = require('../models/accounting')
const usersSchema = require('../models/users')
const logsSchema = require('../models/logs')

var check = require('../scripts/check')
var hsh = require('../scripts/hash')

exports.signIn = async (req, res) => {
    let response = {}
    if (!req.body.login || !req.body.password) {
        response = {
            errorType: 'login',
            error: 'Необходимо заполнить все поля.'
        }
    } else {
        const user = await usersSchema.findOne({$or: [{login: req.body.login.toLocaleLowerCase()}, {email: req.body.login.toLocaleLowerCase()}]})
        if (!user) {
            response = {
                errorType: 'login',
                error: 'Логин не существует или введён неверно.',
            }
        } else {
            if (hsh.getHash(req.body.password, user.salt) == user.password){    
                if (user.new_password) {   
                    let token = jwt.sign({ _id: user._id }, config.secret, { expiresIn: 86000 });
                    response = {
                        new_password_hash: user.new_password_hash,
                        token: token
                    }
                } 
                let token = jwt.sign({ _id: user._id }, config.secret, { expiresIn: 86000 });
                console.log('Пользователь (_id: '+user._id+') вошёл в систему. token: ' + token) 
                let type = '';
                if (user.type == 1)
                    type = 'Администратор'
                else if (user.type == 0)
                    type = 'Не подтвержден'
                else if (user.type == 2)
                    type = 'Студент'
                response = Object.assign(response, {
                    auth: true,
                    token: token,
                    user: {
                        _id: user._id,
                        login: user.login,
                        isAdmin: user.type == 1,
                        isBlock: user.type == 0,
                        about: user.about,
                        eMail: user.email,
                        phone: user.phone,
                        code: user.code,
                        type: type,
                        imgSrc: user.imgSrc
                    }
                })
            } else {
                response = {
                    errorType: 'password',
                    error: 'Пароль введен неверно.'
                }
            }
        }
    }
    res.send({
        response
    })
}

exports.signUp = async (req, res) => {
    let response = {}
    if (!req.body.about || !req.body.login || !req.body.eMail || !req.body.phone || !req.body.password) {
        response = {
            errorType: 'login',
            error: 'Необходимо заполнить все поля.'
        }
    } else {
        const userL = await usersSchema.findOne({login: req.body.login.toLocaleLowerCase()})
        const userE = await usersSchema.findOne({email: req.body.eMail})
        if (userL) {
            response = {
                errorType: 'login',
                error: 'Логин занят.'
            }
        } else if (userE) {
            response = {
                errorType: 'eMail',
                error: 'Почта уже используется.'
            }
        } else if (req.body.password == '1234567890') {
            response = {
                errorType: 'password',
                error: 'Пароль не должен совпадать со стандартным.'
            }
        } else {
            const salt = hsh.getSalt('', 8);
            const new_user = new usersSchema({
                about: req.body.about,
                login: req.body.login.toLocaleLowerCase(),
                email:  req.body.eMail,
                phone:  req.body.phone,
                password:  hsh.getHash(req.body.password, salt),
                salt: salt,
                vk_uid: '',
                ya_uid: '',
                google_uid: ''
            })
            await new_user.save();
            response = {
                status: 200
            }
        }
    }
    res.send({
        response    
    })
}

exports.connect = async (req, res) => {
    let token = req.headers['x-access-token'];
    if (!token) res.send({error: 'No access token', connect: true})
    jwt.verify(token, config.secret, async function(err, decoded) {
        if (err) {
            if(err.name == 'TokenExpiredError') {
                console.log('Token Expired Error')
                res.send({
                    connect: true,
                    logout: true
                })
                return
            } else {
                console.log(err.name)             
                res.send({
                    connect: true
                })
            }    
        } else {              
            res.send({
                connect: true
            })
        }

    })
}

exports.logs = async (req, res) => {
    let token = req.headers['x-access-token'];
    if (!token) res.send({error: 'No access token'})

    jwt.verify(token, config.secret, async function(err, decoded) {
        if (err) {
            if(err.name == 'TokenExpiredError') {
                console.log('Token Expired Error')
                res.send({
                    logout: true
                })
                return
            } else {
                console.log(err.name)
            }    
        } else {             
            var logs = await logsSchema.find({}).lean() 
            for (var i = 0; i < logs.length; i++){
                user = await usersSchema.findById(logs[i].user_id).lean();
                logs[i].user = user ? user.about : logs[i].user_id + ' (Пользователь удалён из базы)';
                accounting = await accountingSchema.findById(logs[i].device_id);
                var device = '';
                if (accounting)
                    device = await devicesSchema.findById(accounting.device_id).lean();
                logs[i].device = device ? device.name : logs[i].device_id + ' (Устройство удалено из базы)';
                logs[i].received = moment(logs[i].received).utcOffset('GMT+07:00').format('lll');
                if (logs[i].returned)
                    logs[i].returned = moment(logs[i].returned).utcOffset('GMT+07:00').format('lll');
                else    
                    logs[i].returned = "На руках"
            }
            res.send({
                logs
            })
        }

    })
}

exports.notFound = async (req, res) => {
    res.status(404).send({
        status: 404,
        text: 'Page not found'
    })
}