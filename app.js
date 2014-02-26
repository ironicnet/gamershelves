var express = require('express');
var app = express();
//var path = require('path');

app.use(express.static(__dirname)); // Current directory is root
//app.use(express.static(path.join(__dirname, 'public'))); //  "public" off of current is root
app.get("/api/search::term", function(req)
{
	console.log(req.params);
});
app.listen(3000);
console.log('Listening on port 3000');