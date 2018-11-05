/*
	Fabio WIP 2018-11-1
	TODO: implement guids for tracking protocol, save one guid per email (& one for null email)
	TODO: implement actual tracking calls
	TODO: save date for preference, save PRIVACY.md digest for preference, re-alert if PRIVACY.md changes, link to github history
	TODO: move fs interactions from index.js, into this module
	TODO: tests
	*/

const crypto = require('crypto');

exports = module.exports = async function({
	cliArgs,
	gaPropertyId,
	https = require('https'),
	fs = require('fs'),
	os = require('os'),
	process = process,
}) {
	const path = require('path');
	const crypto = require('crypto');
	let valid=false; let enabled=false; let save=false; let userHash; let licenseKey; let gaGuid;
	let privacyPolicy = fs.readFileSync(path.resolve(__dirname, 'PRIVACY.md'), 'utf-8');

	let privacyDigest = 'TODO';
	{/* Process prefs */
		let userEmailOrHash; let guids;
		const savedPrefs = (()=>{
			try {
				return JSON.parse(fs.readFileSync(
					path.resolve(os.homedir(), '.look-at-me-sideways/prefs.json')
				));
			} catch (e) {
				return {};
			}
		})();
		guids = (savedPrefs.guids||{});
		if (cliArgs.reporting) {
			let match = cliArgs.reporting.toLowerCase().match(/^(save-)?(yes|no)$/i)||[];
			valid = !!match[0];
			save = !!match[1];
			enabled = match[2]==='yes';
			userEmailOrHash = cliArgs['report-user'];
			if (!userEmailOrHash) {
				userHash = '';
			} else if (userEmailOrHash.match(/^[a-fA-F0-9]{64}$/)) {
				userHash = userEmailOrHash;
			} else if (userEmailOrHash.match(/^[^@\/]+@[^@\/]+$/)) {
				userHash = crypto.createHash('sha256').update(prefs['report-user'].trim().toLowerCase(), 'utf8').digest();
			} else {
				throw new Error('Invalid email or hash for \'report-user\' argument.');
			}
		} else {
			({valid, enabled, userHash} = savedPrefs);
		}
		let guid = guids[userHash]||newGuid();
		guids = {...guids, [userHash]: guid};
	}
	if (!valid) {
		console.log(privacyPolicy.replace(/\n/g, '\n  '));
		process.exit(1);
	}
	if (save) {
		console.warn('TODO: prefs.save');
	}

	licenseKey = (prefs['report-license-key']||'').trim().toUpperCase();
	return {
		valid,
		enabled,
		save,
		prefString: JSON.stringify(prefs),
		track: ({messages, errors})=>{
			if (!valid) {
				throw new Error('Invalid tracking state');
			}
			if (!enabled) {
				return;
			}
			// CONTINUE HERE..
			console.warn('TODO:track');
		},
	};

	/**
	 * GUID function per https://stackoverflow.com/a/2117523
	 * @return {Uint8Array}
	 */
	function newGuid() {
		return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, (c) =>
			(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
		);
	}
	/**
	 * Return a request function used for tracking
	 * @return {function}
	 */
	function request({
		method,
		hostname,
		port,
		path,
		query = {}, // TODO: confirm how to pass data in here
		headers,
		body, // TODO: confirm whether we need an empty body
	}) {
		let bodyString = JSON.stringify(body);
		return new Promise((res, rej)=>{
			let requestConfig = {
				method,
				hostname,
				...(port?{port}:{}),
				path: path
					+ (path.includes('?')?'&':'?')
					+ Object.entries(query).map(([k, v])=>encodeURIComponent(k)+'='+encodeURIComponent(v)).join('&'),
				headers: {
					...headers,
					'Content-Type': 'application/json',
					'Content-Length': Buffer.byteLength(bodyString),
				},
			};
			let req = https.request(requestConfig, (resp)=>{
				resp.on('error', (err) => {
					rej(err.message);
				});
				resp.on('end', () => res(resp));
			});
			// Note: Cloud Functions seems to smartly interpret various body content types & convert to a unified representation
			// But, we don't need to reproduce all those original bodies, since looker only cares about JSON bodies
			if (body !== undefined) {
				req.write(bodyString);
			}
			req.end();
		});
	}
};
