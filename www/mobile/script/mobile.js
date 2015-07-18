var LOGIN = "test";

var input = document.createElement("input");
input.type = "text";
input.style.position="absolute";
input.style.fontWeight="bold";
input.style.fontSize="20px";
input.style.top="10px";
input.style.left="10px";
input.style.border="2px solid black";
input.style.padding="0.5em";
document.body.appendChild(input); // put it into the DOM
if (localStorage.getItem("LOGIN")) {
	input.value=localStorage.getItem("LOGIN");
	LOGIN=input.value
}
input.onchange=function() {
	val = input.value;
	localStorage.setItem("LOGIN",val)
	LOGIN=val;
};
clearTimeout(inter1);
document.getElementById("bar").parentNode.parentNode.removeChild(document.getElementById("bar").parentNode);
//-------------------------------------------------------------------------
var active=false;
function doWork() 
{
	active=true;
	cordova.plugins.barcodeScanner.scan
	(
		      function (result) 
		      {
		    	  var code = result.text;
		    	  var req = new XMLHttpRequest();
		    	  req.open('GET', "../readqr?user="+encodeURIComponent(LOGIN)+"&code="+encodeURIComponent(code)+"&nc="+(new Date()).getTime(), true); 
		  	      req.send();
		  	      active=false;
		      }, 
		      function (error) {
		  	      active=false;
		      }
	);
}
function tick() 
{
	if (!LOGIN || !LOGIN.length)
		return;
	var areq = new XMLHttpRequest();
	areq.open('GET', "../isqr?user="+encodeURIComponent(LOGIN)+"&nc="+(new Date()).getTime(), true); 
	areq.onreadystatechange = function(event) 
	{		
		if (areq.readyState == 4) 
		{
			if (areq.status == 200) {
				var xhr = event.target;
				if (xhr.responseText && xhr.responseText.indexOf("OK") >= 0)
					doWork();
			}
		} 
	};
	areq.send();
}
setInterval(tick,800);



