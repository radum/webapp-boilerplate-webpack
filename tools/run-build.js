const clean = require('./tasks/clean');
const {
	copyStatic,
	copyServer,
	copySSL,
	copyExtra
} = require('./tasks/copy');
const stylesCSS = require('./tasks/styles-css');
const compiler = require('./tasks/compiler');
const imagemin = require('./tasks/imagemin');
const imageResize = require('./tasks/image-resize');
const compression = require('./tasks/compression');

/**
 * Run the build task, building a production ready app
 *
 * @param {*} options Task options object
 * @param {*} options.logger Task global logger
 * @param {*} flags	CLI flags passed
 */
async function startBuild(options, flags) {
	const taskOpts = { logger: options.logger };

	options.logger.log('starting build');

	await clean(taskOpts);

	await copyStatic(taskOpts);
	await copyServer(taskOpts);
	await copySSL(taskOpts);
	await copyExtra(taskOpts);

	await Promise.all([
		stylesCSS({
			...taskOpts,
			isDebug: !flags.release,
			sass: { sourceMapEmbed: !flags.release }
		}),
		compiler(taskOpts),
		imagemin(taskOpts)
	]);

	await compression(taskOpts);
	await imageResize(taskOpts);
}

module.exports = startBuild;
