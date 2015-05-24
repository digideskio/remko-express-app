'use strict';

var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport');
var SQLiteStore = require('connect-sqlite3')(session);
var baseURI = require('base-uri');
var assign = require('object-assign');

function start(options) {
	// Initialize options
	if (!options.serverDir) {
		options.serverDir = path.join(options.topDir, 'server');
	}

	var app = express();

	// view engine setup
	app.set('views', path.join(options.serverDir, 'views'));
	app.set('view engine', 'jade');

	app.use(logger('dev'));
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: false }));
	app.use(cookieParser());

	app.use(session(assign({ 
		// secret: 'MySecret',
		store: new SQLiteStore({dir: options.sessionStoreDir }),
		cookie: { maxAge: 100 * 52 * 7 * 24 * 60 * 60 * 1000 },
		resave: false,
		saveUninitialized: false
	}, options.session)));
	app.use(passport.initialize());
	app.use(passport.session());

	app.use(baseURI, express.static(path.join(options.serverDir, 'public')));

	// Webpack
	var webpackConfig = require(path.join(options.topDir, 'webpack.config'));
	if (app.get('env') === 'development') {
		var webpackDevMiddleware = require('webpack-dev-middleware');
		var webpack = require('webpack');
		var compiler = webpack(webpackConfig);
		app.use(baseURI, webpackDevMiddleware(compiler));
	}
	else {
		// TODO: Get this from webpackConfig.output.path
		app.use(baseURI, express.static(path.join(options.topDir, 'build')));
	}

	// Own routes
	app.use(baseURI, options.routes);

	// catch 404 and forward to error handler
	app.use(function(req, res, next) {
		var err = new Error('Not Found');
		err.status = 404;
		next(err);
	});

	// error handlers

	// development error handler
	// will print stacktrace
	if (app.get('env') === 'development') {
		app.use(function(err, req, res) {
			res.status(err.status || 500);
			res.render('error', {
				message: err.message,
				error: err
			});
		});
	}

	// production error handler
	// no stacktraces leaked to user
	app.use(function(err, req, res) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: {}
		});
	});

	////////////////////////////////////////////////////////////////////////////////
	// Server
	////////////////////////////////////////////////////////////////////////////////

	var packageInfo = require(path.join(options.topDir, 'package.json'));
	var debug = require('debug')(packageInfo.name + ':server');
	var http = require('http');

	var port = 3000;
	app.set('port', port);

	var server = http.createServer(app);

	server.listen(port);
	server.on('error', function(error) {
		if (error.syscall !== 'listen') {
			throw error;
		}
		switch (error.code) {
			case 'EACCES':
				throw Error('Port requires elevated privileges');
			case 'EADDRINUSE':
				throw Error('Port is already in use');
			default:
				throw error;
		}
	});
	server.on('listening', function () {
		debug('Listening on port ' + server.address().port);
	});

	return app;
}

module.exports = {
	start: start
};
