var express = require('express');
var _ = require('underscore');
var _s = require('underscore.string');

var app = express();
var http = require('http');
var eyes = require('eyes');
var parseString = require('xml2js').parseString;
var path = require('path');


var port = 3000;

var api = { 
	gameinfo: {
		search:{
			options: {
			  host: "thegamesdb.net",
			  port: 80,
			  path: '/api/GetGamesList.php?name=<%= name %>',
			  method: 'POST'
			  },
			getOptions: function (params) 
			{
				var formattedOptions = _.clone(this.options);
				formattedOptions.path = _.template(formattedOptions.path)(params);
				return formattedOptions;
			},
			wrap: function (data) 
			{
				var result = { games: [] };
				if (data && data.Data && data.Data.Game)
					result.games= data.Data.Game;
				return result;
			}
		},
		get : {
			options: {
			  host: "thegamesdb.net",
			  port: 80,
			  path: '/api/GetGame.php?id=<%= id %>',
			  method: 'POST'
			  },
			getOptions: function (params) 
			{
				var formattedOptions = _.clone(this.options);
				formattedOptions.path = _.template(formattedOptions.path)(params);
				return formattedOptions;
			},
			wrap: function (data) 
			{
				var result = { game: null, baseImgUrl:"" };
				if (data && data.Data && data.Data.Game)
				{
					result.game= data.Data.Game;
					result.baseImgUrl = data.Data.baseImgUrl;
				}
				return result;
			}
		}
	}
};
//A helper for the api :P
var useApi = function (apiConfig, args, callback)
{
	http.request(apiConfig.getOptions(args), function(apiRes) {
		apiRes.setEncoding('utf8');
		apiRes.on('data', function(resXml) {
			try
			{
			parseString(_s.trim(resXml), function(err, data){ 
				if (!err)
				{
					callback(apiConfig.wrap(data));
				}
				else
				{
					callback(null, err);
				}
			});
			} catch(ex)
			{
				callback(null, ex);
			}
		});
	}).end();
}
//Static
app.use(express.static(path.join(__dirname, 'public'))); //  "public" off of current is root
app.get("/api/search::term", function(req, res){	useApi(api.gameinfo.search, { name: req.params.term}, function (data, err) { 
	console.log("Searching started for '", req.params.term,"'");
	var completed = [];
	//This is used to see if we completed the full array
	var checkCompletion= function ()
	{
		
		if (data && completed.length==data.games.length)
		{
			res.send(data);
		}
		else if (!data)
		{
			console.log('DATA NULL', data);
		}
	}
	//we mark this id as completed
	var markCompleted = function(id, err)
	{
		if(completed.indexOf(id)==-1)
		{
			completed.push(id);
			if (err)
				console.log('Id', id, 'COMPLETED: ',completed.length,'/', data.games.length, (err) ? 'ERROR': 'OK', ' ', err);
		}
		checkCompletion();
	};
	if (data && data.games.length>0)
	{
		//For each game we should fill the info
		_.each(data.games, function(game) {
			//This is horrible, but for each game in the list i would look for the game info
			//This should be cached
			try
			{
			useApi(api.gameinfo.get, { id: game.id}, function (gameInfo, infoErr) {  game.info = gameInfo; if (infoErr) game.error = infoErr; markCompleted(game.id, infoErr);});
			} catch(ex)
			{
				console.log('Error while retrieving info for id ', game.id, ex);
			}
		});
	}
	else
	{
		//I send the empty data...
		res.send(data);
	}
});});

app.get("/api/get::id", function(req, res) { 	useApi(api.gameinfo.get, { id: req.params.id}, function (data, err) { res.send(data)});});

app.listen(port);
console.log('Listening on port ' + port.toString());