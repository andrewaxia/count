// cors.js
/**
 *  need carefull ,tuning this scripts for security...
 */
module.exports = function() {
    return function(req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "X-Requested-With,origin, content-type, accept, authorization")
      res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD")
      res.header("Access-Control-Max-Age", "2000")
      next();
    };
  }