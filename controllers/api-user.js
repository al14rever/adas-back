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


//получение пользователей
exports.users = async (req, res) => {
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
            if (req.body.search)  {
                console.log(1)
                var usersFull = await usersSchema.find({ 
                    $or: [ 
                        { about: { $regex: req.body.search, $options: '-i' } }, 
                        { login: { $regex: req.body.search, $options: '-i'  } },
                        { email: { $regex: req.body.search, $options: '-i'  } },
                        { phone: { $regex: req.body.search, $options: '-i'  } }
                    ] 
                }).lean()  
            } else var usersFull = await usersSchema.find({}).lean()
            let users = []
            var date = new Date()
            var new_code = '700'
            //var new_code = '7'+(date.getSeconds()+10)+''+date.getTime()
            for (i = 0; usersFull.length > i; i++) {
                users[i] = {
                    _id: usersFull[i]._id,
                    login: usersFull[i].login,
                    about: usersFull[i].about,
                    eMail: usersFull[i].email,
                    phone: usersFull[i].phone,
                    code: usersFull[i].code,
                    new_password: usersFull[i].new_password,
                    imgSrc: usersFull[i].imgSrc,
                    typeNum: usersFull[i].type
                }
                if (usersFull[i].type == 1)
                    users[i].type = 'Администратор'
                else if (usersFull[i].type == 0)
                    users[i].type = 'Не подтвержден'
                else if (usersFull[i].type == 2)
                    users[i].type = 'Студент'
                if (!usersFull[i].code) {
                    users[i].code = new_code
                }
            }
            res.send({
                users
            })
        }

    })
}

//поиск устройств которые находятся у пользователя
exports.onHands = async (req, res) => {
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
            let acc = await accountingSchema.find({taken: req.body._id})
            const have = []
            for (let i = 0; i < acc.length; i++) {
                var device = await devicesSchema.findOne({_id: acc[i].device_id}).lean()
                have[i] = Object.assign({name: device.name}, acc[i])
            }
            res.send({
                have
            })
        }

    })
}

//изменение пользователя
exports.userEdit = async (req, res) => {
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
            let Luser = await usersSchema.findById(req.body.user._id).lean()
            let new_user = {}
            let date = new Date()
            let new_code = '7'+(date.getSeconds()+10)+''+date.getTime()
            if (Luser) {
                await usersSchema.findByIdAndUpdate(req.body.user._id, {
                    about: req.body.user.about,
                    login: req.body.user.login.toLocaleLowerCase(),
                    email: req.body.user.eMail,
                    phone: req.body.user.phone,
                    type: req.body.user.typeNum,
                    imgSrc: req.body.user.imgSrc
                })
            } else {
                const salt = hsh.getSalt('', 8);
                new_user = new usersSchema({
                    about: req.body.user.about,
                    login: req.body.user.login.toLocaleLowerCase(),
                    email: req.body.user.eMail,
                    phone: req.body.user.phone,
                    imgSrc: req.body.user.imgSrc,
                    password: hsh.getHash('1234567890', salt),
                    code: new_code,
                    salt: salt,
                    vk_uid: '',
                    ya_uid: '',
                    google_uid: ''
                })
                await user.save();
            }
            let user = await usersSchema.findById(req.body.user._id).lean()
            users = {
                _id: user._id,
                login: user.login,
                about: user.about,
                eMail: user.email,
                phone: user.phone,
                code: user.code,
                new_password: user.new_password,
                imgSrc: user.imgSrc,
                typeNum: user.type
            }
            if (user.type == 1)
                users.type = 'Администратор'
            else if (user.type == 0)
                users.type = 'Не подтвержден'
            else if (user.type == 2)
                users.type = 'Студент'
            res.send({
                user: users
            })
        }

    })
}

//удаление пользователя
exports.userDelete = async (req, res) => {
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
            await usersSchema.findByIdAndDelete(req.body._id)
            res.send({
                status: 200
            })
        }

    })
}

//сброс пароля пользователя
exports.userResetPassword = async (req, res) => {
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
            const salt = hsh.getSalt('', 8);
            let new_user = await usersSchema.findByIdAndUpdate(req.body._id, {
                new_password: true,
                new_password_hash: hsh.getSalt('', 32),
                password:  hsh.getHash('1234567890', salt),
                salt: salt,
            })
            users = {
                _id: req.body._id,
                login: new_user.login,
                about: new_user.about,
                eMail: new_user.email,
                phone: new_user.phone,
                code: new_user.code,
                new_password: true,
                imgSrc: new_user.imgSrc,
                typeNum: new_user.type
            }
            if (new_user.type == 1)
                users.type = 'Администратор'
            else if (new_user.type == 0)
                users.type = 'Не подтвержден'
            else if (new_user.type == 2)
                users.type = 'Студент'
            res.send({
                user: users
            })
        }

    })
}

//установка нового пароля
exports.userNewPassword = async (req, res) => {
    let token = req.body.token;
    let response = {}
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
            const user = await usersSchema.findById(req.body._id)       
            if (user.new_password_hash != req.body.hash) { 
                res.send({
                    logout: true
                })
                return
            } else
            if (!req.body.password || !req.body.password2) { 
                response = {
                    errorType: 'password',
                    error: 'Заполните все поля!'
                }            
            } else if (user.password == hsh.getHash(req.body.password, user.salt)) {                 
                response = {
                    errorType: 'password',
                    error: 'Новый пароль не должен совпадать со стандартным.'
                }
            } else if (req.body.password == req.body.password2) {   
                const salt = hsh.getSalt('', 8);
                await usersSchema.findByIdAndUpdate(req.body._id, {'password': hsh.getHash(req.body.password, salt), 'salt': salt, 'new_password': false, 'new_password_hash': ''})
                console.log('Пользователь (_id: '+req.body._id+') удачно сменил пароль.');
                response = {
                    auth: true
                }
            } else {      
                response = {
                    errorType: 'password',
                    error: 'Пароли не совпадают.'
                }
            }
            res.send({
                response
            })
        }

    })
}