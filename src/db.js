var OrientDB = require('orientjs');
var fs = require('fs');
var path = require('path');
//--------------------------------------
console.log("Loading db configuration")
var data = fs.readFileSync(path.join(__dirname, "../cfg/db.json"),{ encoding: 'utf8' });
var cfg=JSON.parse(data);
var server = OrientDB({
  host: cfg.host,
  port: cfg.port,
  username: cfg.username,
  password: cfg.password
});
//--------------------------------------
var OrientDB = require('orientjs');
var db = server.use('cashless');
//--------------------------------------
/*
db.query('insert into Customer (code,name,issueTime,discount) values (:code, :name, sysdate(),:discount)',{
		    params: {
		      code: '1000000000',
		      name: 'Test Person',
		      discount: 0
		    }
		  }
).then(function (response){
  console.log(response); //an Array of records inserted
});*/

/*
db.class.get('Customer').then(function (Customer) 
{
	Customer.create({
	      code: '1000000000',
	      name: 'Test Person',
	      discount: 0,
	      issueTime : new Date()
		})
		.then(function (record) {
		  console.log('Created record: ', record);
		});
});*/

exports.class = db.class;
exports.db=db;