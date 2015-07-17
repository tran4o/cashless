var fs = require('fs');
var path = require('path');
var db = require("./db").db;
var qrcode = require('qrcode');

console.log("Loading basic configuration")
var data=fs.readFileSync(path.join(__dirname, "../cfg/customers.json"),{ encoding: 'utf8' });
var custcfg=JSON.parse(data);
var codeLen = parseInt(custcfg.codeLength);
//--------------------------------------
var m_w = custcfg.randomSeed;
var m_z = 987654321;
var mask = 0xffffffff;

// Returns number between 0 (inclusive) and 1.0 (exclusive),
// just like Math.random().
function random()
{
    m_z = (36969 * (m_z & 65535) + (m_z >> 16)) & mask;
    m_w = (18000 * (m_w & 65535) + (m_w >> 16)) & mask;
    var result = ((m_z << 16) + m_w) & mask;
    result /= 4294967296;
    return result + 0.5;
}

function makeCode()
{
    var text = "";
    var possible = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    for( var i=0; i < codeLen; i++ )
        text += possible.charAt(Math.floor(random() * possible.length));
    return text;
}

function reset(onDone) 
{
	db.class.get('Customer').then(function (Customer) {
		db.delete().from('Customer').scalar().then(function() {
			console.log("Truncated Customers records database");
			var nToGenerate = parseInt(custcfg.total);
			var t;
			for (var i=0;i<nToGenerate;i++) 
			{
				var code=makeCode();
				console.log(i+" | CREATE "+code);
				if (!t) 
				{
					t=Customer.create({
						 code: code,
						 discount : 0
					});
				} else {
					t = t.then(Customer.create({
						 code: code,
						 discount : 0
					}));
				}
			}			
		});
	});
}

exports.reset = reset;
