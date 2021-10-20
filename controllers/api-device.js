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

//получение устройств из базы
exports.devices = async (req, res) => {
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
            let devices = await devicesSchema.find({}).lean()
            res.send({
                devices
            })
        }

    })
}

//поиск устройства
exports.devicesSearch = async (req, res) => {
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
            let devices = []
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
                devices[i].accounting404 = await accountingSchema.find({device_id: devices[i]._id, place: '404', taken: 0}).countDocuments()
                devices[i].accounting707 = await accountingSchema.find({device_id: devices[i]._id, place: '707', taken: 0}).countDocuments()
            }
            res.send({
                devices
            })
        }

    })
}

//изменение устройства
exports.deviceEdit = async (req, res) => {
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
            console.log(req.body)         
            let device = await devicesSchema.findById(req.body._id).lean()
            if (device) {
                await devicesSchema.findByIdAndUpdate(req.body._id, {
                    name: req.body.name,
                    about: req.body.about,
                    imgSrc: req.body.imgSrc,
                    type: req.body.type
                })
            } else {
                let new_device = new devicesSchema({
                    name: req.body.name,
                    about: req.body.about,
                    imgSrc: req.body.imgSrc,
                    type: req.body.type
                })
                await new_device.save()
            }
            res.send({
                status: 200
            })
        }

    })
}

//удаление устройства
exports.deviceDelete = async (req, res) => {
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
            await devicesSchema.findByIdAndDelete(req.body._id)
            res.send({
                status: 200
            })
        }

    })
}