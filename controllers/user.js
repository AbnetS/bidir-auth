'use strict';
/**
 * Load Module Dependencies.
 */
const crypto  = require('crypto');
const path    = require('path');
const url     = require('url');

const debug      = require('debug')('api:user-controller');
const moment     = require('moment');
const jsonStream = require('streaming-json-stringify');
const _          = require('lodash');
const co         = require('co');
const del        = require('del');
const validator  = require('validator');

const config             = require('../config');
const CustomError        = require('../lib/custom-error');

const TokenDal           = require('../dal/token');
const UserDal            = require('../dal/user');
const LogDal             = require('../dal/log');
const AdminDal           = require('../dal/admin');



/**
 * Get a single user.
 *
 * @desc Fetch a user with the given id from the database.
 *
 * @param {Function} next Middleware dispatcher
 */
exports.fetchOne = function* fetchOneUser(next) {
  debug(`fetch user: ${this.params.id}`);

  let query = {
    _id: this.params.id
  };

  try {
    let user = yield UserDal.get(query);

    yield LogDal.track({
      event: 'view_user',
      user: this.state._user._id ,
      message: `View user - ${user.username}`
    });

    this.body = user;
  } catch(ex) {
    return this.throw(new CustomError({
      type: 'USER_RETRIEVAL_ERROR',
      message: ex.message
    }));
  }

};

/**
 * Update User Status
 *
 * @desc Fetch a user with the given ID and update their respective status.
 *
 * @param {Function} next Middleware dispatcher
 */
exports.updateStatus = function* updateUser(next) {
  debug(`updating status user: ${this.params.id}`);

  this.checkBody('is_active')
      .notEmpty('is_active should not be empty');

  let query = {
    _id: this.params.id
  };
  let body = this.request.body;

  try {
    let user = yield UserDal.update(query, body);

    yield LogDal.track({
      event: 'user_status_update',
      user: this.state._user._id ,
      message: `Update Status for ${user.username}`,
      diff: body
    });

    this.body = user;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'USER_STATUS_UPDATE_ERROR',
      message: ex.message
    }));

  }

};

/**
 * Update a single user.
 *
 * @desc Fetch a user with the given id from the database
 *       and update their data
 *
 * @param {Function} next Middleware dispatcher
 */
exports.update = function* updateUser(next) {
  debug(`updating user: ${this.params.id}`);

  let query = {
    _id: this.params.id
  };
  let body = this.request.body;

  try {
    let user = yield UserDal.update(query, body);

    yield LogDal.track({
      event: 'user_update',
      user: this.state._user._id ,
      message: `Update Info for ${user.username}`,
      diff: body
    });

    this.body = user;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'UPDATE_USER_ERROR',
      message: ex.message
    }));

  }

};

/**
 * Delete a single user/ The Holy grail
 *
 *
 * @desc Fetch a user with the given id from the database
 *       and delete their data
 *
 * @param {Function} next Middleware dispatcher
 */
exports.delete = function* deleteUser(next) {
  debug(`deleting user: ${this.params.id}`);

  let query = {
    _id: this.params.id
  };

  try {
    let user = yield UserDal.delete(query);

    this.body = user;
  } catch(ex) {
    return this.throw(new CustomError({
      type: 'REMOVE_USER_ERROR',
      message: ex.message
    }));
  }

};

/**
 * Get a collection of users by Pagination
 *
 * @desc Fetch a collection of users
 *
 * @param {Function} next Middleware dispatcher
 */
exports.fetchAllByPagination = function* fetchAllUsers(next) {
  debug('get a collection of users by pagination');

  // retrieve pagination query params
  let page   = this.query.page || 1;
  let limit  = this.query.per_page || 10;
  let query = {};

  let sortType = this.query.sort_by;
  let sort = {};
  sortType ? (sort[sortType] = 1) : null;

  let opts = {
    page: +page,
    limit: +limit,
    sort: sort
  };

  try {
    let users = yield UserDal.getCollectionByPagination(query, opts);

    this.body = users;
  } catch(ex) {
    return this.throw(new CustomError({
      type: 'FETCH_PAGINATED_USERS_COLLECTION_ERROR',
      message: ex.message
    }));
  }
};