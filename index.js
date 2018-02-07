
var express = require('express');
var https = require('https');
var request = require('request');
const Agent = require('node-agent-sdk').Agent;
var botAgent = new Agent({
    accountId: '58735619',
    username: 'categorybot',
    password: 'Password123!!!'
  });



var oauth = {
        consumer_key: 'bc2a7e11efe741fa90d996af48cbc980',
        consumer_secret: '3f7dc20c83cbd4e0',
        token: '90141da2e07c4491a93ee6aa256cade4',
        token_secret: '337be936f00409c7'
    };
var allSkills = [];
var Level1 = "";
var Level2 = "";
var Level3 = "";
var yesno = "";
var comments = "";
var convID = "682e0bbe-f7af-477b-97ba-461a6bd91780";
var skill = "321803613";



var app = express();
app.listen(process.env.PORT);
app.set('port', (process.env.PORT || 5000));

// Required to allow access to the service across different domains
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Content-Type', 'text/plain');
  next();
});


// app.set('views', __dirname + '/views');
// app.set('view engine', 'ejs');


// If the user provides the URL "..../add"
app.get('/add', function(req, res, next) {

	Level1 = req.query.Level1;
	Level2 = req.query.Level2;
	Level3 = req.query.Level3;
	yesno = req.query.yesno;
	comments = req.query.comments;
	convID = req.query.convID;
	skill = req.query.skill;
	console.log("***" + Level1 + "***" + Level2 + "***" + Level3 + "***" + yesno + "***" + comments + "***" + convID + "***" + skill + "***");
	skill = convertSkill();
	markConv();


	// Output result in a JSON object
	res.send({'result': convID});
});



setInterval(function() {
    https.get("https://pp-category-bot.herokuapp.com/");
}, 600000); // every 5 minutes (300000) every 10 minutes (600000)



function retrieveSkill(){

// Get a list of all the skills
var url = 'https://z2.acr.liveperson.net/api/account/58735619/configuration/le-users/skills';
request.get({
    url: url,
    oauth: oauth,
    json: true,
    headers: {
        'Content-Type': 'application/json'
    }
}, function (e, r, b) {
	console.log(JSON.stringify(b));
	allSkills = b;

for (var i = 0; i < b.length; i++) {
	console.log(b[i].id + " " + b[i].name);
}
});

}



function convertSkill(){

	var found = 0;
	for (var i = 0; i < allSkills.length; i++) {
		if(allSkills[i].name === skill){
			found = 1;
console.log("found");
			console.log(allSkills[i].name + " <--> " + allSkills[i].id);
			return allSkills[i].id;
		}
	}
	if(!found){
console.log("not found");
		return -1;
	}


}


function markConv(){




	const metadata = [{
		type: 'BotResponse', // Bot context information about the last consumer message
		externalConversationId: convID,
		businessCases: [
			'RightNow_Categorization' // identified capability
		],
		intents: [ // Last consumer message identified intents
		{
			id: 'Level1',
			name: Level1,
			confidenceScore: 1
		},
		{
			id: 'Level2',
			name: Level2,
			confidenceScore: 1
		},
		{
			id: 'Level3',
			name: Level3,
			confidenceScore: 1
		},
		{
			id: 'yesno',
			name: yesno,
			confidenceScore: 1
		},
		{
			id: 'comments',
			name: comments,
			confidenceScore: 1
		}]
	}];




	botAgent.updateConversationField({
		conversationId: convID,
		conversationField: [{
			field: "ParticipantsChange",
			type: "ADD",
			role: "MANAGER"
		}]
		}, function(err) {
			if(err) {
				console.log(err);
			} else {
				console.log("joining completed");
			}
	});





	botAgent.updateConversationField({
		conversationId: convID,
		conversationField: [{
			field: "Skill",
			type: "UPDATE",
			skill: skill
		}]
		}, null, metadata, function(err) {
			if(err) {
				console.log(err);
			} else {
				console.log("transfered completed");
			}
	});




	botAgent.updateConversationField({
		conversationId: convID,
		conversationField: [{
			field: "ParticipantsChange",
			type: "REMOVE",
			role: "MANAGER"
		}]
		}, function(err) {
			if(err) {
				console.log(err);
			} else {
				console.log("leave completed");
			}
	});




}




botAgent.on('closed', data => {
	console.log('socket closed', data);
	botAgent.reconnect();
});

botAgent.on('connected', data => {
	console.log('we are live');
	retrieveSkill();
});
