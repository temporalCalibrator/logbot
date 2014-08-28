// IRC API docs at https://node-irc.readthedocs.org/en/latest/API.html
// Kaiseki docs at https://github.com/shiki/kaiseki
// Parse REST api docs at https://www.parse.com/docs/rest

// get airbrake monitoring
var airbrake = require('airbrake').createClient(process.env.AIRBRAKE_KEY, "production");

// configure airbrake monitoring
airbrake.handleExceptions();

var config = {
	channels: process.env.IRC_CHANNELS,
	server: process.env.IRC_SERVER,
	botName: process.env.IRC_BOTNAME,
	username: process.env.IRC_USERNAME,
	password: process.env.IRC_PASSWORD
};

// Get the irc lib
var irc = require("irc");

// set up parse
var Kaiseki = require('kaiseki');

var APP_ID = process.env.PARSE_APPID;
var REST_API_KEY = process.env.PARSE_RESTKEY;
var MASTER_KEY = process.env.PARSE_MASTERKEY;

var app = new Kaiseki(APP_ID, REST_API_KEY);

app.masterKey = MASTER_KEY;

// create the bot object
var bot = new irc.Client(config.server, config.botName, {
	channels: config.channels,
	userName: config.username,
	nick: config.botName,
	password: config.password,
	autoRejoin: true
});

// record an AppOpened event
app.sendAnalyticsEvent('AppOpened', function(err, res, body, success) {
	if (err) {
		airbrake.notify(response);
	};
});

// main logger
bot.addListener("message", function(nick, to, text, message) {
	// create a message object
	app.createObject('Messages', {
		nick: nick,
		text: text,
		channel: to
	}, function(err, res, body, success) {
		if (err) {
			airbrake.notify(res);
		};
	});
	// create a message analytics event
	app.sendAnalyticsEvent('Message', {
		'nick': nick,
		'text': text,
		'channel': to
	}, function(err, res, body, success) {
		if (err) {
			airbrake.notify(res);
		};
	});
});

// log user joins
bot.addListener("join", function(channel, who) {
	// don't log when the bot joins, as that would be redundant with recording AppOpened
	if (who != config.botname) {
		// create a message analytics event
		app.sendAnalyticsEvent('UserJoin', {
			'nick': who,
			'channel': channel,
		}, function(err, res, body, success) {
			if (err) {
				airbrake.notify(res);
			};
		});
	}
});