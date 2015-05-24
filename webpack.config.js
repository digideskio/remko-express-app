var webpack = require('webpack');

module.exports = function (options) {
	var config = {
		entry: './client/app.js',
		output: { 
			path: options.buildDir,
			filename: 'app.js'
		},
		module: {
			loaders: [ 
				{ test: /\.jsx?$/, exclude: /node_modules/, loader: 'babel' },
				{ test: /\.less$/, loaders: ['style', 'css', 'less'] },
				{ test: /\.css$/, loaders: ['style', 'css'] },
				{ test: /\.(png|woff|woff2|eot|ttf|svg)(\?.*)?$/, loader: 'url?limit=100000' }
			]
		}
	};

	if (process.env.NODE_ENV === 'production') {
		config.plugins = [
			new webpack.optimize.DedupePlugin(),
			new webpack.optimize.OccurenceOrderPlugin(true),
			new webpack.optimize.UglifyJsPlugin({
				compress: {
					warnings: false
				},
				output: {
					comments: false
				},
				sourceMap: false
			})
		];
	}
	else {
		// config.devtool = 'eval';
		config.devtool = 'cheap-source-map';
		config.plugins = [
			// new webpack.HotModuleReplacementPlugin()
			new webpack.NoErrorsPlugin()
		];
	}
	return config;
};
