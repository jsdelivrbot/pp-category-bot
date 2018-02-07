// require('dotenv').config();
var express = require('express');

// Get around heroku time-out
var https = require('https');
setInterval(function() {
    https.get("https://pp-category-bot.herokuapp.com/");
}, 600000); // every 5 minutes (300000) every 10 minutes (600000)
var request = require('request');
const Agent = require('node-agent-sdk').Agent;
var botAgent = new Agent({
    accountId: process.env.LP_ACCOUNT_ID,
    username: process.env.LP_ACCOUNT_USER,
    appKey: process.env.LP_ACCOUNT_APP_KEY,
    secret: process.env.LP_ACCOUNT_SECRET,
    accessToken: process.env.LP_ACCOUNT_ACCESS_TOKEN,
    accessTokenSecret: process.env.LP_ACCOUNT_ACCESS_TOKEN_SECRET
});


// API oauth1 credentials
var oauth = {
    consumer_key: process.env.LP_API_CONSUMER_KEY,
    consumer_secret: process.env.LP_API_CONSUMER_SECRET,
    token: process.env.LP_API_TOKEN,
    token_secret: process.env.LP_API_TOKEN_SECRET
};
var allSkills = [];
var Level1 = "";
var Level2 = "";
var Level3 = "";
var yesno = "";
var comments = "";
var convID = "";
var skill = "";

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

// If the user provides the URL "..../add"
app.get('/add', function(req, res, next) {

    Level1 = req.query.Level1;
    Level2 = req.query.Level2;
    Level3 = req.query.Level3;
    yesno = req.query.yesno;
    comments = req.query.comments;
    convID = req.query.convID;
    skill = req.query.skill; //come in as text name of the skill
    console.log("***" + Level1 + "***" + Level2 + "***" + Level3 + "***" + yesno + "***" + comments + "***" + convID + "***" + skill + "***");
    skill = convertSkill(); // converts skill name to skill id
    markConv();

    // Output result in a JSON object
    res.send({
        'result': convID
    });
});

function retrieveSkill() {

    // Get a list of all the skills
    var url = 'https://z2.acr.liveperson.net/api/account/58735619/configuration/le-users/skills';
    request.get({
        url: url,
        oauth: oauth,
        json: true,
        headers: {
            'Content-Type': 'application/json'
        }
    }, function(e, r, b) {
        console.log(JSON.stringify(b));
        allSkills = b;

        for (var i = 0; i < b.length; i++) {
            console.log(b[i].id + " " + b[i].name);
        }
    });

}

function convertSkill() {

    var found = 0;
    for (var i = 0; i < allSkills.length; i++) {
        if (allSkills[i].name === skill) {
            found = 1;
            console.log("found");
            console.log(allSkills[i].name + " <--> " + allSkills[i].id);
            return allSkills[i].id;
        }
    }
    if (!found) {
        console.log("not found");
        return -1;
    }

}

function markConv() {

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
            }
        ]
    }];

    botAgent.updateConversationField({
        conversationId: convID,
        conversationField: [{
            field: "ParticipantsChange",
            type: "ADD",
            role: "MANAGER"
        }]
    }, function(err) {
        if (err) {
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
        if (err) {
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
        if (err) {
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
