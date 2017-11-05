var express = require('express');
var bodyParser = require('body-parser');
var app = express();
const Sequelize = require('sequelize');
const sequelize = new Sequelize('thedb', 'artista', 'artista', {
  host: '192.168.3.104',
  dialect: 'mysql',
  pool: {
    max: 5,
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
    userName:{
        type:Sequelize.DataTypes.STRING
    },
    eMail:{type:Sequelize.DataTypes.STRING},
    phone:{type:Sequelize.DataTypes.STRING},
    userPassword:{
        type:Sequelize.DataTypes.STRING
    }
  });
const Site=sequelize.define('site',{
      name:{
        type:Sequelize.DataTypes.STRING
      },
      desc:{type:Sequelize.DataTypes.STRING}
  }); 
const Count=sequelize.define("count",{
      from:{ type:Sequelize.STRING}, // document.referer ...last link before the current page
      to:{type:Sequelize.STRING},
      host:{type:Sequelize.DataTypes.STRING},
      hit:{type:Sequelize.DataTypes.INTEGER},
      hostName:{type:Sequelize.DataTypes.STRING},  //domain name 
      href:{type:Sequelize.DataTypes.STRING},     //full link
      protocol:{type:Sequelize.DataTypes.STRING}, //https / http
      pathName:{type:Sequelize.DataTypes.STRING},  //part of the page...
      ext:{type:Sequelize.DataTypes.STRING}
  });

/**relation of models */
User.Sites=User.hasMany(Site); 
//Site.belongsTo(User); 
Site.Counts=Site.hasMany(Count); 
//Count.belongsTo(Site); 
sequelize.sync({force:false}).then(()=>{
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
cors=require('./cors'); 
app.use(cors());
/*
*  Constants definition...
*/
const  SERVICEPREFIX='/api/v1'; 


/**
 *   services....User...
 */
app.get(SERVICEPREFIX+'/user', function (req, res) {
   console.log('send the message out..'); 
   User.findAll().then(users=>{
       console.log(users); 
        return res.json(users); 
    });   
}); 
app.get(SERVICEPREFIX+'/user/:id', function (req, res) {
    console.log('send the message out..'); 
    User.findOne({where:{id:req.param("id")}}).then(user=>{
        console.log(user); 
         return res.json(user); 
     });   
 }); 
 app.post(SERVICEPREFIX+'/user',function(req,res){
    var fromClientUser=req.body; 
    User.create(fromClientUser).then(createdUser=>{
        return res.json(createdUser); 
    });    
 });
 app.delete(SERVICEPREFIX+'/user/:id',function(req,res){
    User.destroy({where:{id:req.params.id}}).then(deletedUser=>{
        if(deletedUser===1){res.status(200).json({info:"deleted the user"})}
        else{
         res.status(400).json({info:"something wrong"});
        }
    });  
 });
 app.put(SERVICEPREFIX+'/user/:id',function(req,res,next){
     var bodyEntity=req.body; 
     User.update(bodyEntity,
        { where:{id:req.params.id}}).then(function(rowsUpdated){
          User.find({where:{id:req.params.id}}).then(updatedUser=>{
              return res.json(updatedUser); 
          }); 
        }).catch(next); 
 }); 
 /** Service --user's site */
app.get(SERVICEPREFIX+'/user/:userId/site',function(req,res){
    Site.findAll({where:{userId:req.params.userId}}).then(sites=>{
        res.json(sites); 
    })
}); 
app.get(SERVICEPREFIX+'/user/:userId/site/:siteId',function(req,res){
    Site.findAll({where:{userId:req.params.userId,id:req.params.siteId}}).then(site=>{
        res.json(site); 
    })
    });
app.post(SERVICEPREFIX+'/user/:userId/site',function(req,res,next){
    var siteDef=req.body; 
    siteDef.userId=req.params.userId; 
    Site.create(siteDef).then(savedSite=>{
      res.json(savedSite); 
    }).done(next); 

});
app.put(SERVICEPREFIX+'/user/:userId/site/:id',function(req,res,next){
    var bodyEntity=req.body; 
    Site.update(bodyEntity,
       { where:{id:req.params.id,userId:req.params.userId}}).then(function(rowsUpdated){
         Site.find({where:{id:req.params.id}}).then(updatedSite=>{
             return res.json(updatedSite); 
         }); 
       }).catch(next);
});
app.delete(SERVICEPREFIX+'/user/:userId/site/:siteId',function(req,res,next){
    Site.destroy({where:{id:req.params.siteId,userId:req.params.userId}}).then(deletedSite=>{
        if(deletedSite===1){res.status(200).json({info:"deleted the site"})}
        else{
         res.status(400).json({info:"something wrong"});
        }
    })
}); 
/*
*   services-site's hit info
*/


app.get(SERVICEPREFIX+'/user/:userId/site/:siteId/count',function(req,res,next){
    var uid=req.params.userId; 
    var sid=req.params.siteId; 
    User.findById(uid).then(function(foundUser){
        if(foundUser!=null){
          Count.findAll({where:{siteId:sid}}).then(all=>{
              res.json(all); 
          }); 
        }else{
            res.status(404).json({info:"user not exist"}); 
        }
    }).catch(errr=>{
        res.json({info:"something wrong"});
    }); 
}); 

app.get(SERVICEPREFIX+'/user/:userId/site/:siteId/count/:countId',function(req,res,next){
    var uid=req.params.userId; 
    var sid=req.params.siteId; 
    var cid=req.params.countId; 
    User.findById(uid).then(function(foundUser){
        if(foundUser!=null){
           Count.findOne({where:{id:cid,siteId:sid}}).then(foundCount=>{
               if(foundCount!=null){
                   res.json(foundCount); 
               }else{
                   res.status(404).json({info:"Count not found"}); 
               }
           }); 
        }else{
            res.status(400).json({info:"something wrong"}); 
        }
    }).catch(next); 
});
app.post(SERVICEPREFIX+'/user/:userId/site/:siteId/count',function(req,res,next){
    var uid=req.params.userId; 
    var sid=req.params.siteId;
    var countTobeCreated=req.body; 
    countTobeCreated.siteId=req.params.siteId; 
    User.findById(uid).then(function(foundUser){
        if(foundUser!=null){
            Count.create(countTobeCreated).then(createdCount=>{
                res.json(createdCount); 
            }).done(next); 
        }else{
            res.status(400).json({info:"something wrong"})
        }
    }); 
});
app.put(SERVICEPREFIX+'/user/:userId/site/:siteId/count/:countId',function(req,res,next){
    var uid=req.params.userId; 
    var sid=req.params.siteId;
    var cid=req.params.countId; 
    var countTobeUpdated=req.body; 
    User.findById(uid).then(foundUser=>{
        if(foundUser!=null){
            Count.update(countTobeUpdated,{where:{id:cid,siteId:sid}}).then(
                function(rowsUpdated){
                    Count.findById(cid).then(foundCount=>{
                        res.json(foundCount); 
                    }); 
                }
            ).catch(next); 
        }else{
            res.status(400).json({info:"something wrong"})
        }
    });   
});
app.delete(SERVICEPREFIX+'/user/:userId/site/:siteId/count/:countId',function(req,res,next){
    var uid=req.params.userId; 
    var sid=req.params.siteId;
    var cid=req.params.countId; 
    User.findById(uid).then(foundUser=>{
        if(foundUser!=null){
          Count.destroy({where:{siteId:sid,id:cid}}).then(deletedCount=>{
              if(deletedCount==1){
                  res.json({info:"the count deleted"})
              }else{
                  res.status(400).json({info:"something wrong"});
              }
          }).catch(next); 
        }else{
            res.status(400).json({info:"something wrong"})
        }
    });

});

/**
 * Statistics Services....
 */
app.get(SERVICEPREFIX+'/stats/user/:userId/bysite',function(req,res,next){
    var uid=req.params.userId; 
    var statistics={}; 
        sequelize.query("select u.id as userId,s.id as siteId,s.name as siteName,c.id as countId,sum(c.hit) as hits from users u join sites s on u.id=s.userId join counts c on s.id=c.siteId where c.hit<>'null' and u.id=:userId group by u.id,s.id  ",
            {replacements:{userId:parseInt(uid)},type: sequelize.QueryTypes.SELECT}).then(results=>{
                res.json(results); 
              }) ;     
});
app.get(SERVICEPREFIX+'/stats/user/:userId/byday',function(req,res,next){
    var uid=req.params.userId; 
    var statistics={}; 
        sequelize.query("select s.name as siteName,pathName,date(c.updatedAt) as day, sum(hit) from counts c join sites s on c.siteId=s.id where s.userId=:userId group by siteid,day,hostName ",
            {replacements:{userId:parseInt(uid)},type: sequelize.QueryTypes.SELECT}).then(results=>{
                res.json(results); 
              }) ;     
});  

/**
 * the Main entry point.....
 */
var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port
  console.log("the app listening at http://%s:%s", host, port)
})
