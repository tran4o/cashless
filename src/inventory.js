var fs = require('fs');
var path = require('path');

console.log("Loading inventory configuration from cfg/inventory.json")
var data = fs.readFileSync(path.join(__dirname, "../cfg/inventory.json"),{ encoding: 'utf8' });
console.log("Inventory data length "+data.length+" bytes");
var items=JSON.parse(data);
exports.items=items;