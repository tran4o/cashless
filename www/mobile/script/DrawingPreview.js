var drwPreviewWorking=null;
var drwPreviewLast=0;
setInterval(function() 
{
	if (drwPreviewWorking)
		return;
	var crr = (new Date()).getTime();
	// do not make request often than 2 sec.
	if (crr-drwPreviewLast < 2000)
		return;	
	drwPreviewWorking=[];
	var newBrowser = document.querySelectorAll;
	var imgs = newBrowser ? document.querySelectorAll('img[src^="/icons/custom/loading-drawing"]') : document.getElementsByTagName("img");
	var els=[];
	var dreq=[];
	for (var i=0;i<imgs.length;i++) 
	{
		var img = imgs[i];
		if (newBrowser || (img.src && img.src.indexOf("/icons/custom/loading-drawing") > 0)) 
		{
			var ip = img.src.indexOf("?");
			if (!ip)
				continue;
			var prms = img.src.substring(ip,img.src.length);
			drwPreviewWorking.push(img);
			dreq.push(prms);
		}		
	}
	if (drwPreviewWorking.length == 0) {
		drwPreviewLast=0;
		drwPreviewWorking=null;
		return;
	}	
	function microAjax(url, callbackFunction)
	{
		this.bindFunction = function (caller, object) {
			return function() {
				return caller.apply(object, [object]);
			};
		};
		this.stateChange = function (object) {
			if (this.request.readyState==4)
				this.callbackFunction(this.request.responseText);
		};
		this.getRequest = function() {
			if (window.ActiveXObject)
				return new ActiveXObject('Microsoft.XMLHTTP');
			else if (window.XMLHttpRequest)
				return new XMLHttpRequest();
			return false;
		};
		this.postBody = (arguments[2] || "");
		this.callbackFunction=callbackFunction;
		this.url=url;
		this.request = this.getRequest();
		if(this.request) 
		{
			var req = this.request;
			req.onreadystatechange = this.bindFunction(this.stateChange, this);

			if (this.postBody!=="") {
				req.open("POST", url, true);
				req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
				req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
			} else {
				req.open("GET", url, true);
			}
			req.send(this.postBody);
		}
	}	
	
	var url = "/modules/graphics/preview.vsp";
	function doIt(data) 
	{
		var rdata = data.split("@");
		for (var i=0;i<rdata.length;i++) 
		{
			var ind = rdata[i].indexOf(":");
			if (!ind || ind <= 0)
				continue;
			var pos = parseInt(rdata[i].substring(0,ind));
			var url = rdata[i].substring(ind+1,rdata[i].length);
			drwPreviewWorking[pos].src = url; 
			//alert("POS : "+pos+" | "+url);
		}
		drwPreviewLast=(new Date()).getTime();
		drwPreviewWorking=null;
	}	
	microAjax(url,doIt,"data="+encodeURIComponent(dreq.join("@")));
},500);	
//every 500 ms
	