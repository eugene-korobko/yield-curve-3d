const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
//const loader = require('mini-css-extract-plugin/types/loader');

module.exports = {
	mode: 'development', // or 'production'
	entry: './src/index.tsx',
	output: {
	path: path.resolve(__dirname, 'dist'),
	filename: 'bundle.js',
	},
	resolve: {
	extensions: ['.ts', '.tsx', '.js', '.jsx'],
	},
	module: {
		rules: [
			{
				test: /\.(ts|tsx)$/,
				exclude: /node_modules/,
				use: 'ts-loader',
			},
			{
				test: /\.(js|jsx)$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
					},
				}
			},
			{
				test: /\.css$/,
				use: [
					MiniCssExtractPlugin.loader,
					{
						loader: "css-loader",
						options: {
							modules: {
								namedExport: true,
								exportLocalsConvention: 'as-is',
							},
						},
					}
				]
			},
		],
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: './public/index.html',
		}),
		new MiniCssExtractPlugin({
          filename: '[name].css', // Output filename for your CSS
        }),
	],
	devServer: {
	static: './dist',
	port: 3000,
	},
};