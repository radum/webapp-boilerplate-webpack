/* eslint import/no-extraneous-dependencies: ["error", {"peerDependencies": true, "devDependencies": true}] */

const path = require('path');
const sass = require('node-sass');
const fs = require('../lib/fs');
const Logger = require('../lib/logger');
const minifyCss = require('./minify-css');
const config = require('../config');

const defaultOpts = {
	isVerbose: false,
	isDebug: true
};

async function compileSass(options) {
	const opts = {...defaultOpts, ...options };

	const logger = new Logger({
		name: 'compile-sass',
		isVerbose: opts.isVerbose
	});

	let cssOutput;

	logger.start('compiling sass files');

	return new Promise((resolve, reject) => {
		sass.render({
			file: config.paths.stylesEntryPoint,
			outputStyle: 'expanded',
			precision: 10,
			includePaths: ['.'],
			sourceMapContents: true,
			sourceMapEmbed: opts.sourceMapEmbed || false
		}, async (err, result) => {
			if (err) {
				reject(err);
			} else {
				try {
					await fs.makeDir(path.resolve(config.paths.stylesOutputDest));

					if (opts.isDebug) {
						// TODO: This exports more cool info that could be logged as verbose.
						cssOutput = result.css;
					} else {
						const minifyResponse = await minifyCss(result.css, { verbose: true });

						cssOutput = minifyResponse.css;
						logger.log(minifyResponse.log);
					}

					await fs.writeFile(path.resolve(config.paths.stylesOutputDest + '/main.css'), cssOutput);

					resolve(cssOutput);

					logger.done('styles compiled');
				} catch (error) {
					reject(error);
				}

				resolve(result);
			}
		});
	});
}

module.exports = compileSass;
