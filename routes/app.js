// libs
const {Router} = require('express')
const router = Router()
const md5 = require('js-md5')
// url API
let api = require('../controllers/api-v1.0')
let apiUser = require('../controllers/api-user')
let apiDevice = require('../controllers/api-device')
let apiAccounting = require('../controllers/api-accounting')


const url = '/api/v1.0'

//connect
router.route(url+'/signin').post(api.signIn)
router.route(url+'/signup').post(api.signUp)
router.route(url+'/connect').post(api.connect)
router.route('/*').get(api.notFound).post(api.notFound)
router.route(url+'/logs').post(api.logs)

//user
router.route(url+'/new/password').post(apiUser.userNewPassword)
router.route(url+'/user/onhands').post(apiUser.onHands)
router.route(url+'/admin/users').post(apiUser.users)
router.route(url+'/admin/users/edit').post(apiUser.userEdit)
router.route(url+'/admin/users/delete').post(apiUser.userDelete)
router.route(url+'/admin/users/reset/password').post(apiUser.userResetPassword)

//device
router.route(url+'/devices/search').post(apiDevice.devicesSearch)
router.route(url+'/devices').post(apiDevice.devices)
router.route(url+'/admin/devices/edit').post(apiDevice.deviceEdit)
router.route(url+'/admin/devices/delete').post(apiDevice.deviceDelete)

//accounting
router.route(url+'/admin/accounting').post(apiAccounting.accounting)
router.route(url+'/admin/accounting/add').post(apiAccounting.accountingAdd)
router.route(url+'/admin/accounting/edit').post(apiAccounting.accountingEdit)
router.route(url+'/admin/accounting/delete').post(apiAccounting.accountingDelete)

module.exports = router