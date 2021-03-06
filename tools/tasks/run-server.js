const cp = require('child_process');
const timestamp = require('time-stamp');
const chalk = require('chalk');
const reporter = require('../lib/reporter');
const { config } = require('../config');

let server;
let pending = true;

// Should match the text string used in `src/server.js/app.listen(...`
// If the string doesn't match, gulp will not know to resume the stream
// and the entire process will be stuck at this server run.

// const RUNNING_REGEXP = /Server is running at (http|https):\/\/(.*?)/;
const RUNNING_REGEXP = /Server is running at https:\/\/(.*?)/;

function runServer(options = { inspect: false }) {
	const taskName = options.label || 'express-server';
	const taskColor = options.taskColor || '#9c89b8;'
	const logger = reporter(taskName, { color: taskColor });

	logger.emit('start', 'starting node server (via expressjs)')

	return new Promise((resolve) => {
		function onStdOut(data) {
			const match = data.toString('utf8').match(RUNNING_REGEXP);

			process.stdout.write('[' + chalk.magenta(timestamp('HH:mm:ss')) + '] [' + chalk.magenta('server') + '] ' + data);

			if (match) {
				server.host = match[1];
				server.stdout.removeListener('data', onStdOut);
				server.stdout.on('data', x => process.stdout.write(x));
				pending = false;

				logger.emit('done', 'local node server started');

				resolve(server);
			}
		}

		if (server) {
			// More info here:
			// https://blog.risingstack.com/mastering-the-node-js-core-modules-the-process-module/
			server.kill('SIGTERM');
		}

		const appParams = [
			...(options.inspect ? ['--inspect-brk'] : []),
			config.paths.serverEntryPoint
		];

		server = cp.spawn('node', appParams, {
			env: Object.assign({ FORCE_COLOR: true }, process.env),
			silent: false
		});

		if (pending) {
			server.once('exit', (code, signal) => {
				if (pending) {
					throw new Error(`Server terminated unexpectedly with code: ${code} signal: ${signal}`);
				}
			});
		}

		server.stdout.on('data', onStdOut);
		server.stderr.on('data', x => process.stderr.write(x));

		return server;
	});
}

process.on('exit', () => {
	if (server) {
		server.kill('SIGTERM');
	}
});

module.exports = runServer;
