'use strict';
/**
 * Load Module Dependencies.
 */
const EventEmitter = require('events').EventEmitter;
const crypto       = require('crypto');

const debug     = require('debug')('api:auth-controller');
const moment    = require('moment');
const co        = require('co');
const validator = require('validator');

const config      = require('../config');
const CustomError = require('../lib/custom-error');

const UserModel   = require('../models/user');

const UserDal     = require('../dal/user');
const TokenDal    = require('../dal/token');
const LogDal      = require('../dal/log');


/**
 * Login a user
 *
 * @desc login a user using their phone number/email and password.
 * Return profile and user data with an authentication token.
 *
 * @param {Function*} next middleware dispatcher
 */
exports.login = function* loginUser(next) {
  debug('login a user');

  let body = this.request.body;

  try {

    // Validate Login Data
    this.checkBody('username')
	  	.notEmpty('Please Provide a valid Username!');
    this.checkBody('password')
        .notEmpty();


    if(this.errors) {
      throw new Error('Please correct the username and password');

    }

    let data = yield loginUser(body);

    this.body = data;

  } catch(ex) {
    this.throw(new CustomError({
      type: 'AUTHENTICATION_ERROR',
      message: ex.message
    }));
  }

  //Login Player Based
  function loginUser(body) {
    return co(function* () {
      let user = yield UserModel.findOne({ username: body.username }).exec();

      if(!user || user.archived) {
        throw new Error('User with the given credentials does not exist');

      }

      if(user.status === 'suspended') {
        throw new Error('You are not allowed to do this');
      }

      let isMatch = yield user.verifyPassword(body.password);
      if(!isMatch) {
        throw new Error('Password Provided is incorrect');
      }


      let token = yield TokenDal.get({ user: user._id });

      let tokenValue;

      if(token && token.user) {
        if(token.revoked) {
          tokenValue = createToken();

          let query = {
            _id: token._id
          };
          let updates = {
            value: tokenValue,
            revoked: false
          };

          yield TokenDal.update(query, updates);
        } else {
          tokenValue = createToken();
          
          let query = {
            _id: token._id
          };
          let updates = {
            value: tokenValue,
            revoked: false
          };

          yield TokenDal.update(query, updates);
        }

      } else {
        tokenValue = createToken();

        // First time login
        let tokenData = {
          value: tokenValue,
          user: user._id,
          revoked: false
        };

        yield TokenDal.create(tokenData);

      }

      let data;
      let now = moment().toISOString();
      let update = { last_login: now };
      let userQuery = { _id: user._id };

      yield UserDal.update(userQuery, update);

      user = yield UserDal.get({ _id: user._id }, true);

      data =  { token: tokenValue, user: user.toJSON() };

      yield LogDal.track({ event: 'login', user: data.user._id });

      return data;
    });
  }

};

/**
 * Log out a user.
 *
 * @desc
 *
 * @param {Function*} next middleware dispatcher
 */
exports.logout = function* logoutUser(next) {
  debug('logout user');

  if(!this.state._user) {
    return this.throw(new CustomError({
      type: 'LOGOUT_ERROR',
      message: 'You are not logged in!'
    }));
  }

  let user  = this.state._user;
  let now   = moment().toISOString();
  let query = {
    user: user._id
  };
  let updates = {
    value: 'EMPTY',
    revoked: true
  };

  try {
    yield TokenDal.update(query, updates);
    yield LogDal.track({ event: 'logout', user: user._id });

    this.body = { logged_out: true };

  } catch(ex) {
    this.throw(new CustomError({
      type: 'LOGOUT_ERROR',
      message: ex.message
    }));
  }
};

/**
 * Access Management control
 *
 * @desc
 *
 * @param {Array|String} roles allowed roles
 * @param {String} action action to apply
 */
exports.accessControl = function accessControl(roles, action) {

  action = action || 'ALLOW';
  roles = Array.isArray(roles) ? roles: [roles];

  return function* (next) {

    let user = this.state._user;

    if(!user) {
      return this.throw(new CustomError({
        type: 'AUTHORIZATION_ERROR',
        message: 'Please Login or register to continue'
      }));
    }

    debug(`Checking access control for ${user._id} - ${this.url}`);

    let userRole  = user.role;
    let userRealm = user.realm;
    let allowed   = false;

    for(let role of roles) {
      switch(role) {
        case '*':
        case userRole:
        case userRealm:
          allowed = true;
          break;
      }
    }

    if(!allowed) {
      return this.throw(new CustomError({
        type: 'AUTHORIZATION_ERROR',
        message: 'You are not Authorized to complete this action'
      }));

    }

    yield next;

  };
};

// Auth Token generator
function createToken() {
  debug('generate a token');

  let sha256 = crypto.createHash('sha256');
  let retry = 1;
  let randomBytes;

  try {
    randomBytes = crypto.randomBytes(config.TOKEN.RANDOM_BYTE_LENGTH).toString('hex');

    return sha256.update(randomBytes).digest('base64');

  } catch(ex) {
    if(retry <= 5) {
      createToken();
    }

    throw ex;
  }
}


