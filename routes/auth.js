'use strict';
/**
 * Load Module Dependencies.
 */
const Router  = require('koa-router');
const debug   = require('debug')('api:user-router');

const userController  = require('../controllers/user');
const authController    = require('../controllers/auth');

const acl               = authController.accessControl;

var router  = Router();

/**
 * @api {post} /auth/login Login A user
 * @apiVersion 1.0.0
 * @apiName Login
 * @apiGroup User
 *
 * @apiDescription Log in a user. The request returns a token used to authentication
 * of the user on subsequent requests. The token is placed as an HTTP header ie
 * ```Authorization: Bearer <Token-here>``` otherwise requests are rejected.
 *
 * @apiParam {String} password Password
 * @apiParam {String} username Username of the user
 *
 * @apiParamExample Request Example:
 *  {
 *    "username": "officer@bidir.com",
 *    "password": "passwordl"
 *  }
 *
 * @apiSuccess {String} token auth token
 * @apiSuccess {Object} user user info
 *
 * @apiSuccessExample Response Example:
 *  {
 *    "token" : "ylHUMaVrS0dpcO/+nT+6aAVVGcRJzu=",
 *    "user": {
 *      _id : "556e1174a8952c9521286a60"
 *      is_active: true,
 *      username: "mary.jane@gmail.com",
 *      last_login: '2017-03-16T10:50:52.305Z',
 *      role: "manager",
 *      realm: "consumer",
 *      account: {
 *        _id : "556e1174a8952c9521286a60",
 *        preferences : "556e1174a8952c9521286a60",
 *        first_name: "Mary",
 *        last_name: "Jane",
 *        email: "mary.jane@gmail.com",
 *        mobile: "0700112233"
 *        ...
 *      }
 *    }
 *  }
 *
 */
router.post('/login', authController.login);

/**
 * @api {post} /auth/logout Logout a user
 * @apiVersion 1.0.0
 * @apiName Logout
 * @apiGroup User
 *
 * @apiDescription Invalidate a users token
 *
 * @apiSuccess {Boolean} logged_out message
 *
 * @apiSuccessExample Response Example:
 *  {
 *    "logged_out" : true
 *  }
 *
 */
router.post('/logout', authController.logout);

// Expose User Router
module.exports = router;
