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

//учет устройств
exports.accounting = async (req, res) => {
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
            if (req.body.search)          
                devices = await devicesSchema.find({ 
                    $or: [ 
                        { name: { $regex: req.body.search, $options: '-i'  } },
                        { about: { $regex: req.body.search, $options: '-i'  } },
                        { type: { $regex: req.body.search, $options: '-i'  } }
                    ] 
                }).lean()
            else devices = await devicesSchema.find({}).lean()
            for (let i = 0; i < devices.length; i++) {
                let acc = await accountingSchema.find({device_id: devices[i]._id})
                devices[i].accounting = acc
            }
            res.send({
                devices
            })
        }

    })
}

//добавление в учет
exports.accountingAdd = async (req, res) => {
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
            let new_accounting = new accountingSchema({
                device_id: req.body.device_id,
                code: req.body.code,
                place: req.body.place,
                note: req.body.note
            })
            await new_accounting.save()
            res.send({
                status: 200
            })
        }

    })
}

//изменение учета
exports.accountingEdit = async (req, res) => {
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
            await accountingSchema.findByIdAndUpdate(req.body._id, {
                note: req.body.note, 
                place: req.body.place
            })
            res.send({
                status: 200
            })
        }

    })
}

//удаление учета
exports.accountingDelete = async (req, res) => {
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
            await accountingSchema.findByIdAndDelete(req.body._id)
            res.send({
                status: 200
            })
        }

    })
}