'use strict';

const co        = require('co');

const PlanDal = require('../dal/plan');


const plansData    = require('./data').plans;

module.exports = function migratePlans() {
  return co(function* () {

    for(let plan of plansData) {
      
      let _plan = yield PlanDal.get({ name: plan.name });
      
      if(!_plan || !_plan._id) {
        yield PlanDal.create(plan);
      }
      
    }
    
    return { message: 'done' };

  }).then((admin) => {
    console.log('>>>DONE MIGRATING PLANS DATA<<<');
    
  }).catch((err) => {
    return Promise.reject(err);
  });
};

