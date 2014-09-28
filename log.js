// IRC API docs at https://node-irc.readthedocs.org/en/latest/API.html
// Kaiseki docs at https://github.com/shiki/kaiseki
// Parse REST api docs at https://www.parse.com/docs/rest

// get airbrake monitoring
var airbrake = require('airbrake').createClient(process.env.AIRBRAKE_KEY, "production");

// configure airbrake monitoring
airbrake.handleExceptions();

var config = {
	channels: process.env.IRC_CHANNELS.split(","), // environment variable should be of the form #chan1,#chan2
	server: process.env.IRC_SERVER,
	botName: process.env.IRC_BOTNAME,
	username: process.env.IRC_USERNAME,
	password: process.env.IRC_PASSWORD
};

// Get the irc lib
var irc = require("irc");

// get irc colors
require('irc-colors').global()

// Get the UUID lib
var uuid = require('node-uuid');

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
	realName: 'i don\'t talk. i just log. need some logs? contact temporalCalibrator.',
	autoRejoin: true
});

// record an AppOpened event
app.sendAnalyticsEvent('AppOpened', function(err, res, body, success) {
	if (err) {
  	  try
  	    {
  	    airbrake.notify(response);
  	    }
  	  catch(err)
  	    {
  	    console.log(err)
  	    }
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
	  	  try
	  	    {
	  	    airbrake.notify(res);
	  	    }
	  	  catch(err)
	  	    {
	  	    console.log(err)
	  	    }
		};
	});
	// create a message analytics event
	app.sendAnalyticsEvent('Message', {
		'nick': nick,
		'text': text,
		'channel': to
	}, function(err, res, body, success) {
		if (err) {
  	  	  try
  	  	    {
  	  	    airbrake.notify(res);
  	  	    }
  	  	  catch(err)
  	  	    {
  	  	    console.log(err)
  	  	    }
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
	  	  	  try
	  	  	    {
	  	  	    airbrake.notify(res);
	  	  	    }
	  	  	  catch(err)
	  	  	    {
	  	  	    console.log(err)
	  	  	    }
			};
		});
		// this one is insanely messed up, but eh
		/*app.getUsers(function(err, res, body1, success) {
			// got all users
			var allusers = body1;
			if (allusers.indexOf(who) != -1) {
				// query with parameters
				var params = {
					where: {
						username: who
					}
				};
				app.getUsers(params, function(err, res, body2, success) {
					app.loginUser(who, body2[1].uuidpw, function(err, res, body3, success) {
						// user logged in
					});
				});
			} else {
				var userInfo = {
					// required
					username: who,
					password: uuid.v1()
				};

				app.createUser(userInfo, function(err, res, body4, success) {
					// created user
					app.loginUser(who, userInfo.password, function(err, res, body5, success) {
						// user logged in
					});
				});
			}
		});*/
	}
});

// log user parts
bot.addListener("part", function(channel, who, reason, message) {
	// don't log when the bot joins, as that would be redundant with recording AppOpened
	if (who != config.botname) {
		// create a message analytics event
		app.sendAnalyticsEvent('UserPart', {
			'nick': who,
			'channel': channel,
			'reason': reason
		}, function(err, res, body, success) {
			if (err) {
	  	  	  try
	  	  	    {
	  	  	    airbrake.notify(res);
	  	  	    }
	  	  	  catch(err)
	  	  	    {
	  	  	    console.log(err)
	  	  	    }
			};
		});
	}
});

// log count
bot.addListener("message", function(nick, to, text, message) {
	if (text == "{logcount}") {
		// count all objects (no parameters)
		app.countObjects('Messages', function(err, res, body, success) {
			var logcount = body.count;
			bot.say(to, ("There are " + logcount + " logs in my database.").irc.green());
		});
	}
});
