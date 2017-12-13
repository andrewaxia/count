var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var app = express();
app.use(cookieParser());
var secrets = require('./utils/secrets.js')
const Sequelize = require('sequelize');
const sequelize = new Sequelize('countdb', 'countuser', '*', {
    host: 'localhost',
    dialect: 'mysql',
    pool: {
        max:20,
        min: 0,
        idle: 10000
    }
});

sequelize.authenticate().then(() => {
    console.log('Connection has been established successfully.');
}).catch(err => {
    console.error('Unable to connect to the database:', err);
});


/* 
*   Models definition ...
*/
const User = sequelize.define('user', {
    userName: {
        type: Sequelize.DataTypes.STRING
    },
    eMail: { type: Sequelize.DataTypes.STRING },
    phone: { type: Sequelize.DataTypes.STRING },
    userPassword: {
        type: Sequelize.DataTypes.STRING
    },
    token: { type: Sequelize.DataTypes.STRING },
});
const Site = sequelize.define('site', {
    name: {
        type: Sequelize.DataTypes.STRING
    },
    desc: { type: Sequelize.DataTypes.STRING }
});
const Count = sequelize.define("count", {
    from: { type: Sequelize.STRING }, // document.referer ...last link before the current page
    to: { type: Sequelize.STRING },
    host: { type: Sequelize.DataTypes.STRING },
    hit: { type: Sequelize.DataTypes.INTEGER },
    hostName: { type: Sequelize.DataTypes.STRING },  //domain name 
    href: { type: Sequelize.DataTypes.STRING },     //full link
    protocol: { type: Sequelize.DataTypes.STRING }, //https / http
    pathName: { type: Sequelize.DataTypes.STRING },  //part of the page...
    ext: { type: Sequelize.DataTypes.STRING }
});

/**relation of models */
User.Sites = User.hasMany(Site);
//Site.belongsTo(User); 
Site.Counts = Site.hasMany(Count);
//Count.belongsTo(Site); 
sequelize.sync({ force: false }).then(() => {
    console.log('db synched up ');
});

//User.sync({force:true}).then(()=>{
//     return User.create({userName:'andrewxia'}); 
//});
// Site.sync({force:true}).then(()=>{
//     return Site.create({name:'aintx'}); 
// });
// Count.sync({force:true}).then(()=>{
//     return Count.create({from:'10.1.2.3',to:'index.x',hit:1});
// });

/* Dev mode*/
//sequelize.sync({force:true}); 


// User.create({userName:"andrewxia", sites:[{name:"aintx.com",desc:"anthing",counts:[{to:"google.com",from:"aintx.com"}]}]},{include:[{association:User.Sites,include:[Site.Counts]}]}).then(user=>{
//    user.save();   
// });
// Site.create({name:"aintx.com",desc:"a rich company",user:{
//     userName:"jiandong",
//     eMail:"xjd2026@163.com",
//     phone:"12345678"
// },include:[{association:Site.User}]}); 


app.use("/statics", express.static(__dirname + "/statics"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
cors = require('./cors');
app.use(cors());
/*
*  Constants definition...
*/
const SERVICEPREFIX = '/api/v1';
//**********************************unprotected.............. */
//  ******************************************** /

/*
req
{
    "userName":"jiandong",
    "password":"password"
}
res:
{
    "token":"xxxxxx"
}
*/
const AUTHCOOKIENAME='authcookie'; 
app.post(SERVICEPREFIX + '/login', function (req, res, next) {
    var userAuh = req.body;
    var userName = userAuh.userName;
    var userPass = userAuh.password;
    User.findOne({ where: { 'userName': userName } }).then(user => {
        if (user == null) {
            res.status(400).json({ info: "user not found" });
        } else {
            var hashCode = require('crypto').createHash('sha256', secrets.secret).update(userPass).digest('hex')
            if (hashCode == user.userPassword) {
                var jwt = require('jsonwebtoken');
                var token = jwt.sign({ userName: userPass, 'userId': user.id }, secrets.anohterSecret, { expiresIn: 60 * 60 })
                res.cookie(AUTHCOOKIENAME,token); 
                res.json({ 'status': 'success', 'token': token });
            } else {
                res.status(400).json({ 'status': 'failed...', 'info': 'authentication failed...' });
            }
        }

    });
});
/*
req
{ 
    "userName":"jiandong",
    "password":"xxxx"
}
status:200
res{
  info:"success..."  
}
*/
app.post(SERVICEPREFIX + '/register', function (req, res, next) {
    var userName = req.body.userName;
    var userPasswod = req.body.password;
    User.findOne({ where: { 'userName': userName } }).then(user => {
        if (user == null) {
            let hashCode = require('crypto').createHash('sha256', secrets.secret).update(userPasswod).digest('hex');
            console.log(hashCode);
            User.create({ 'userName': userName, 'userPassword': hashCode }).then(createdUser => {
                res.json(createdUser);
            }).done(next);
        } else {
            return res.status(400).json({ 'info': 'duplicated user name' });
        }
    })

});
/**
 * for the payload like this:
 * {
 * 'siteToken':'*****',
 * 'data':{
 * }
 * }
 {
    from: { type: Sequelize.STRING }, // document.referer ...last link before the current page
    to: { type: Sequelize.STRING },
    host: { type: Sequelize.DataTypes.STRING },
    hit: { type: Sequelize.DataTypes.INTEGER },
    hostName: { type: Sequelize.DataTypes.STRING },  //domain name 
    href: { type: Sequelize.DataTypes.STRING },     //full link
    protocol: { type: Sequelize.DataTypes.STRING }, //https / http
    pathName: { type: Sequelize.DataTypes.STRING },  //part of the page...
    ext: { type: Sequelize.DataTypes.STRING }
}
 */
app.post(SERVICEPREFIX + '/datain', function (req, res, next) {
    var siteToken = req.body.siteToken;
    var jwt = require('jsonwebtoken');
    jwt.verify(siteToken, secrets.sitesecret, function (error, siteInfo) {
        if (error) {
            return res.status(401).json({ status: 'failed', info: 'permissions denied', errorMsg: error });
        } else {
            var userid = siteInfo.userId;
            var siteId = siteInfo.siteId;
            var dataIn = req.body.data; //extend this in future
            var countTobeCreated = dataIn;
            countTobeCreated.siteId = siteId;
            Count.create(countTobeCreated).then(createdCount => {
                res.json(createdCount);
            }).done(next);
        }
    })

});
/**
 * http code :200
 */
app.post(SERVICEPREFIX + '/logout', function () {

})

/**
 * Statistics Services....
 */
app.get(SERVICEPREFIX + '/stats/user/:userId/bysite', function (req, res, next) {
    var uid = req.params.userId;
    var statistics = {};
    sequelize.query("select u.id as userId,s.id as siteId,s.name as siteName,c.id as countId,sum(c.hit) as hits from users u join sites s on u.id=s.userId join counts c on s.id=c.siteId where c.hit<>'null' and u.id=:userId group by u.id,s.id  ",
        { replacements: { userId: parseInt(uid) }, type: sequelize.QueryTypes.SELECT }).then(results => {
            res.json(results);
        });
});
app.get(SERVICEPREFIX + '/stats/user/:userId/byday', function (req, res, next) {
    var uid = req.params.userId;
    var statistics = {};
    sequelize.query("select s.name as siteName,date(c.updatedAt) as day, sum(hit) as hits from counts c join sites s on c.siteId=s.id where s.userId=:userId group by siteid,day,hostName ",
        { replacements: { userId: parseInt(uid) }, type: sequelize.QueryTypes.SELECT }).then(results => {
            res.json(results);
        });
});


//-------------------------------------------------------
var apiRoutes = express.Router();
apiRoutes.use(function (req, res, next) {
    var token = req.body.token || req.query.token || req.headers['x-access-token'] ||req.cookies.authcookie; 
    if (token) {
        var jwt = require('jsonwebtoken');
        jwt.verify(token, secrets.anohterSecret, function (erro, decoded) {
            if (erro) {
                res.status(401).json({ status: 'failed', info: 'permissions denied', error: erro });
            }
            else {
                req.decoded = decoded;
                next();
            }
        })
    } else {
        // if there is no token
        // return an error
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });
    }
});
app.use(SERVICEPREFIX, apiRoutes);
//--------------------------below are protected ----------------------
/**
 *   services....User...
 */
app.get(SERVICEPREFIX + '/user', function (req, res) {
    console.log('send the message out..');
    User.findAll().then(users => {
        console.log(users);
        return res.json(users);
    });
});
app.get(SERVICEPREFIX + '/user/:id', function (req, res) {
    console.log('send the message out..');
    User.findOne({ where: { id: req.params.id } }).then(user => {
        console.log(user);
        return res.json(user);
    });
});
app.post(SERVICEPREFIX + '/user', function (req, res) {
    var fromClientUser = req.body;
    User.create(fromClientUser).then(createdUser => {
        return res.json(createdUser);
    });
});
app.delete(SERVICEPREFIX + '/user/:id', function (req, res) {
    User.destroy({ where: { id: req.params.id } }).then(deletedUser => {
        if (deletedUser === 1) { res.status(200).json({ info: "deleted the user" }) }
        else {
            res.status(400).json({ info: "something wrong" });
        }
    });
});
app.put(SERVICEPREFIX + '/user/:id', function (req, res, next) {
    var bodyEntity = req.body;
    User.update(bodyEntity,
        { where: { id: req.params.id } }).then(function (rowsUpdated) {
            User.find({ where: { id: req.params.id } }).then(updatedUser => {
                return res.json(updatedUser);
            });
        }).catch(next);
});
/** Service --user's site */
app.get(SERVICEPREFIX + '/user/:userId/site', function (req, res) {
    Site.findAll({ where: { userId: req.params.userId } }).then(sites => {
        res.json(sites);
    })
});
app.get(SERVICEPREFIX + '/user/:userId/site/:siteId', function (req, res) {
    Site.findAll({ where: { userId: req.params.userId, id: req.params.siteId } }).then(site => {
        res.json(site);
    })
});
/**
 * {
 * userId,
 * siteId,
 * }
 */
app.get(SERVICEPREFIX + '/user/:userId/site/:siteId/sitetoken', function (req, res) {
    var userid = req.params.userId;
    var siteid = req.params.siteId;
    var userInfo = req.decoded;
    var jwt = require('jsonwebtoken');
    if (userid == userInfo.userId) {
        var siteToken = jwt.sign({ userId: userid, siteId: siteid }, secrets.sitesecret, { expiresIn: 60 * 60 * 60 * 60 * 10 }); //10 years 
        var signInfo = { 'siteToken': siteToken };
        return res.json(signInfo);
    } else {
        return res.status(401).json({ 'info': 'permission denied ' });
    }

});
app.post(SERVICEPREFIX + '/user/:userId/site', function (req, res, next) {
    var siteDef = req.body;
    siteDef.userId = req.params.userId;
    Site.create(siteDef).then(savedSite => {
        res.json(savedSite);
    }).done(next);

});
app.put(SERVICEPREFIX + '/user/:userId/site/:id', function (req, res, next) {
    var bodyEntity = req.body;
    Site.update(bodyEntity,
        { where: { id: req.params.id, userId: req.params.userId } }).then(function (rowsUpdated) {
            Site.find({ where: { id: req.params.id } }).then(updatedSite => {
                return res.json(updatedSite);
            });
        }).catch(next);
});
app.delete(SERVICEPREFIX + '/user/:userId/site/:siteId', function (req, res, next) {
    Site.destroy({ where: { id: req.params.siteId, userId: req.params.userId } }).then(deletedSite => {
        if (deletedSite === 1) { res.status(200).json({ info: "deleted the site" }) }
        else {
            res.status(400).json({ info: "something wrong" });
        }
    })
});
/*
*   services-site's hit info
*/
app.get(SERVICEPREFIX + '/user/:userId/site/:siteId/count', function (req, res, next) {
    var uid = req.params.userId;
    var sid = req.params.siteId;
    User.findById(uid).then(function (foundUser) {
        if (foundUser != null) {
            Count.findAll({ where: { siteId: sid } }).then(all => {
                res.json(all);
            });
        } else {
            res.status(404).json({ info: "user not exist" });
        }
    }).catch(errr => {
        res.json({ info: "something wrong" });
    });
});

app.get(SERVICEPREFIX + '/user/:userId/site/:siteId/count/:countId', function (req, res, next) {
    var uid = req.params.userId;
    var sid = req.params.siteId;
    var cid = req.params.countId;
    User.findById(uid).then(function (foundUser) {
        if (foundUser != null) {
            Count.findOne({ where: { id: cid, siteId: sid } }).then(foundCount => {
                if (foundCount != null) {
                    res.json(foundCount);
                } else {
                    res.status(404).json({ info: "Count not found" });
                }
            });
        } else {
            res.status(400).json({ info: "something wrong" });
        }
    }).catch(next);
});
app.post(SERVICEPREFIX + '/user/:userId/site/:siteId/count', function (req, res, next) {
    var uid = req.params.userId;
    var sid = req.params.siteId;
    var countTobeCreated = req.body;
    countTobeCreated.siteId = req.params.siteId;
    User.findById(uid).then(function (foundUser) {
        if (foundUser != null) {
            Count.create(countTobeCreated).then(createdCount => {
                res.json(createdCount);
            }).done(next);
        } else {
            res.status(400).json({ info: "something wrong" })
        }
    });
});

app.put(SERVICEPREFIX + '/user/:userId/site/:siteId/count/:countId', function (req, res, next) {
    var uid = req.params.userId;
    var sid = req.params.siteId;
    var cid = req.params.countId;
    var countTobeUpdated = req.body;
    User.findById(uid).then(foundUser => {
        if (foundUser != null) {
            Count.update(countTobeUpdated, { where: { id: cid, siteId: sid } }).then(
                function (rowsUpdated) {
                    Count.findById(cid).then(foundCount => {
                        res.json(foundCount);
                    });
                }
            ).catch(next);
        } else {
            res.status(400).json({ info: "something wrong" })
        }
    });
});
app.delete(SERVICEPREFIX + '/user/:userId/site/:siteId/count/:countId', function (req, res, next) {
    var uid = req.params.userId;
    var sid = req.params.siteId;
    var cid = req.params.countId;
    User.findById(uid).then(foundUser => {
        if (foundUser != null) {
            Count.destroy({ where: { siteId: sid, id: cid } }).then(deletedCount => {
                if (deletedCount == 1) {
                    res.json({ info: "the count deleted" })
                } else {
                    res.status(400).json({ info: "something wrong" });
                }
            }).catch(next);
        } else {
            res.status(400).json({ info: "something wrong" })
        }
    });

});

/**
 * the Main entry point.....
 */
var server = app.listen(8081, function () {
    var host = server.address().address
    var port = server.address().port
    console.log("the app listening at http://%s:%s", host, port)

})
