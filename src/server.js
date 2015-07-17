var db = require('./db').db;
var express = require('express');
var compress = require('compression');
var extend = require('util')._extend;
var bodyParser = require('body-parser');
var inventory = require('./inventory');

//var qrcode = require('qrcode');
//var Barc = require('barcode-generator')
var qrcode=null;
var Barc=null;

var barc = new Barc();
var app = express();
app.use(compress());
app.use(bodyParser.json({ limit: '5mb' }));       
app.use(bodyParser.urlencoded({     
  extended: true
})); 
//----------------------------------------------
var qrcache={};
var barcache={};
function makeCode()
{
    var text = "";
    var possible = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    for( var i=0; i < 10; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}

function getBarCode(code) {
	if (barcache[code])
		return barcache[code];
	var buf = barc.code128(code, 600, 280);
	return (barcache[code]="data:image/png;base64,"+buf.toString('base64'));
}

// USER 
var qrdata={};
app.get("/isqr",function(req,resp) {
	var cstr = req.query.user;
	resp.header("Content-Type", "application/json; charset=utf-8");
	db.select().from('User').where({code: cstr}).all().then(function (users) 
	{
		if (users && users.length == 1) {
			var user = users[0];			
			if (qrdata[user.code] && !qrdata[user.code].done) {
				qrdata[user.code].done=true;
				resp.send(JSON.stringify({OK:"OK"},null,4));
			} else {
				resp.send(JSON.stringify({},null,4));
			}
		} else {
			resp.send("{\"error\":\"access denied!\"}");
			return;
		}
	});
	
});

app.get("/readqr",function(req,resp) {
	var cstr = req.query.user;
	var qrcode = req.query.code;		
	resp.header("Content-Type", "application/json; charset=utf-8");
	db.select().from('User').where({code: cstr}).all().then(function (users) 
	{
		if (users && users.length == 1) {
			var user = users[0];			
			if (qrdata[user.code])
				qrdata[user.code].qrcode=qrcode;
			resp.send(JSON.stringify({},null,4));
		} else {
			resp.send("{\"error\":\"access denied!\"}");
			return;
		}
	});
});

app.post("/getqr",function(req,resp) {
	db.record.get(req.body.user).then(function(user) {
		resp.header("Content-Type", "application/json; charset=utf-8");
		if (!user) {
			resp.send("{\"error\":\"access denied!\"}")
			return;
		}
		if (!qrdata[user.code] || !qrdata[user.code].qrcode) {
			resp.send(JSON.stringify({},null,4));
			return;
		} 
		resp.send(JSON.stringify({code:qrdata[user.code].qrcode},null,4));
		delete qrdata[user.code].qrcode;
	});	
});

app.post("/setupqr",function(req,resp) {
	db.record.get(req.body.user).then(function(user) {
		resp.header("Content-Type", "application/json; charset=utf-8");
		if (!user) {
			resp.send("{\"error\":\"access denied!\"}")
			return;
		}
		qrdata[user.code]={};
		delete qrdata[user.code].done;
		resp.send(JSON.stringify({},null,4));
		console.log("ADD");
	});	
});

app.post("/doneqr",function(req,resp) {
	db.record.get(req.body.user).then(function(user) {
		resp.header("Content-Type", "application/json; charset=utf-8");
		if (!user) {
			resp.send("{\"error\":\"access denied!\"}")
			return;
		}
		delete qrdata[user.code];
		resp.send(JSON.stringify({},null,4));
	});	
});


app.post("/charge",function(req,resp) {
	resp.header("Content-Type", "application/json; charset=utf-8");
	var user = db.record.get(req.body.user);
	if (user == null)
		return resp.send(JSON.stringify({'error':'access denied'},null,4));
	var cstr = req.body.customer;
	var amount = req.body.amount;
	var customer;
	db.select().from('Customer').where({code: cstr}).all().then(function (customers) 
	{
		if (customers && customers.length == 1) 
		{
			customer=customers[0];
			db.class.get('Charge').then(function (Charge) 
			{
				// COMMIT?
				function afterCmt() {
					db.select('sum(amount)').from('Charge').where({customer:customer["@rid"]}).scalar()
					.then(function (totalCharged) {
						if (!totalCharged)
							totalCharged=0;
						db.select('sum(total)').from('Order').where({customer:customer["@rid"]}).scalar()
						.then(function (totalSpent) {
							if (!totalSpent)
								totalSpent=0;
							resp.send(JSON.stringify({totalCharged:totalCharged,totalSpent:totalSpent},null,4));
						});
					});
				}
				if (amount > 0)
					Charge.create({amount:amount,customer:customer["@rid"],issueTime : new Date()}).then(afterCmt);
				else
					afterCmt();					
			});
		} else {
			resp.send(JSON.stringify({'error':'can not find customer '+cstr}, null, 4));
		}
	});
});

app.post("/pay",function(req,resp) {
	resp.header("Content-Type", "application/json; charset=utf-8");
	var user = db.record.get(req.body.user);
	if (user == null)
		return resp.send(JSON.stringify({'error':'access denied'},null,4));
	var positions = req.body.positions;
	var total = parseFloat(req.body.total);
	var cstr = req.body.customer;
	var customer=null;
	if (cstr && cstr.length) {
		db.select().from('Customer').where({code: cstr}).all().then(function (customers) 
		{
			if (customers && customers.length == 1) 
			{
				customer=customers[0];
				preWork();
			} else {
				resp.send(JSON.stringify({'error':'can not find customer '+cstr}, null, 4));
			}
		});
	} else 
		preWork();

	function preWork() {
		if (!customer) {
			doWork();
			return;
		}
		
		db.select('sum(amount)').from('Charge').where({customer:customer["@rid"]}).scalar()
		.then(function (totalCharged) {
			if (!totalCharged)
				totalCharged=0;
			db.select('sum(total)').from('Order').where({customer:customer["@rid"]}).scalar()
			.then(function (totalSpent) {
				if (!totalSpent)
					totalSpent=0;
				var left = totalCharged-totalSpent;
				if (total <= left) {
					doWork(left-total);
				} else {
					resp.send(JSON.stringify({error:"НЯМА ПАРА!",totalCharged:totalCharged,totalSpent:totalSpent},null,4));
				}
			});
		});
	}
	
	function doWork(balance) 
	{
		db.class.get('Order').then(function (Order) 
		{
			db.class.get('Position').then(function (Position) 
			{
				var poss=[];
				var tlen=positions.length;
				function done(pos) 
				{
					poss.push(pos["@rid"]);
					if (poss.length == tlen) 
					{
						// ALL DONE
						var ord = Order.create({
							issuteTime : new Date(),
							positions : poss,
							total : total,
							user : user["@rid"],
							customer : customer ? customer["@rid"] : null
						}).then(function(ord) {
							resp.header("Content-Type", "application/json; charset=utf-8");
							resp.send(JSON.stringify({balance:balance},null,4));
						});
					}
				}
				for (var pos of positions) 
				{
					var pp = Position.create({
						 code : pos.code,
						 count : parseInt(pos.count),
						 price : parseFloat(pos.price),
						 total : parseFloat(pos.total)
					}).then(done);
				}				
			});
		});
	}

	
	
});


app.post("/login",function(req,resp) {
	resp.header("Content-Type", "application/json; charset=utf-8");
	console.log(req.body);
	var code = req.body.login;
	var pass = req.body.password;
	console.log("CODE : "+code);
	db.select().from('User').where({code: code,password:pass}).all().then(function (users) 
	{
		if (!users || users.length != 1)
		{
			resp.send("{}");
		} else {
			//console.log("OK!!!"+users[0]["@rid"]);
			resp.send(JSON.stringify({'id':users[0]["@rid"]}, null, 4));
		}
	});	
});


app.get("/inventories",function(req,resp) {
	resp.header("Content-Type", "application/json; charset=utf-8");
	resp.send(JSON.stringify(inventory.items, null, 4));
});


db.class.get('Customer').then(function (Customer) 
{
	app.get("/customer",function(req,resp) 
	{
			db.traverse().from('Customer').all().then(function (records) 
			{
				var res={};
				var nmore=0;
				var rbyc={};
				for (var rec of records) { 
					res[rec.code]=null;
					rbyc[rec.code]=rec;
					nmore++;
				}
				if (nmore == 0) {
					resp.send(JSON.stringify([]));
					return;
				}
				function onImg(err,url) 
				{
					if (err)
						console.error("Error encoding qrcode : "+err);
					res[this.code]=url;
					qrcache[this.code]=url;
					nmore--;
					if (nmore == 0) {
						resp.header("Content-Type", "application/json; charset=utf-8");
						var r=[];
						for (i in res) 
							r.push({code:i,img:url,issueDate:rbyc[i].issueDate,discount:rbyc[i].discount,img : res[i],bimg : getBarCode(i)});
						resp.send(JSON.stringify(r, null, 4));
					}
				}
				for (var rec of records) 
				{
					var context = {code:rec.code};
					console.log(rec.code);
					var img=qrcache[rec.code];
					if (!img) 
					{
						qrcode.toDataURL(rec.code,onImg.bind(context));
					} else 
						onImg.call(context,null,img);
				}
			});
	});
	

});
//----------------------------------------------
app.use('/', express.static(__dirname + '/../www'));
//-------------------------------------------------------------
var server = app.listen(3000, function () 
{
	  var host = server.address().address;
	  var port = server.address().port;
	  console.log("\n---------------------------------------------");
	  console.log('Example app listening at http://%s:%s', host, port);
});

