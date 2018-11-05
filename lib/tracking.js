/*
	Fabio WIP 2018-11-1
	TODO: implement actual tracking calls
	TODO: tests
	*/

const defaultProcess = process;
const defaultConsole = console;

exports = module.exports = async function({
	cliArgs = {},
	gaPropertyId,
	https = require('https'),
	fs = require('fs'),
	os = require('os'),
	process = defaultProcess,
	console = defaultConsole,
} = {}) {
	const path = require('path');
	const crypto = require('crypto');
	let valid=false;
	let enabled=false;
	let userHash;
	let licenseKey;
	let guid;
	let prefTimestamp;
	let privacyPolicy = fs.readFileSync(path.resolve(__dirname, 'PRIVACY.md'), 'utf-8');
	let privacyDigest = crypto.createHash('sha256').update(privacyPolicy, 'utf8').digest();
	let digestMismatch;
	{/* Process prefs */
		let userEmailOrHash; let saveReporting;
		const settingsPath = path.resolve(os.homedir(), '.look-at-me-sideways/settings.json');
		const settings = (()=>{
			try {
				let str = fs.readFileSync(settingsPath);
				return ( str.trim()[0]==='{' ? JSON.parse(str) : {} );
			} catch (e) {
				return {};
			}
		})();
		if (cliArgs.reporting) {
			let match = cliArgs.reporting.toLowerCase().match(/^(save-)?(yes|no)$/i)||[];
			valid = !!match[0];
			saveReporting = !!match[1];
			enabled = match[2]==='yes';
			licenseKey = cliArgs['report-license-key'];
			userEmailOrHash = cliArgs['report-user'];
			userHash =
				!userEmailOrHash
					? ''
					: userEmailOrHash.match(/^[a-fA-F0-9]{64}$/)
						? userEmailOrHash
						: userEmailOrHash.match(/^[^@/]+@[^@/]+$/)
							? crypto.createHash('sha256').update(userEmailOrHash.trim().toLowerCase(), 'utf8').digest()
							: new Error('Invalid email or hash for \'report-user\' argument.');
			if (userHash instanceof Error) {
				throw userHash;
			}
			guid = userEmailOrHash
				? newGuid(userEmailOrHash)
				: settings.defaultGuid || newGuid();
			prefTimestamp = Date.now();
		} else {
			let reporting = (settings.reporting||{});
			valid = reporting.enabled === 'boolean' && reporting.privacyDigest === privacyDigest;
			digestMismatch = reporting.privacyDigest !== privacyDigest;
			saveReporting = false;
			guid = settings.guid;
			({enabled, licenseKey, userHash} = settings.reporting);
		}
		try {
			let updatedSettings = {
				defaultGuid: settings.defaultGuid || (userEmailOrHash?undefined:guid),
				reporting: saveReporting
					? {enabled, userHash, licenseKey, privacyDigest, timestamp: prefTimestamp}
					: settings.reporting,
			};
			fs.writeFileSync(settingsPath, JSON.stringify(updatedSettings));
		} catch (e) {
			// Do nothing
		}
	}
	if (!valid) {
		if (digestMismatch) {
			console.warn(
				'\x1b[33mThe privacy policy has been updated since you last opted-in. You may review the changes here:\x1b[0m'
				+'\n https://github.com/fabio-looker/look-at-me-sideways/commits/master/PRIVACY.md'
			);
		}
		console.log(privacyPolicy.replace(/\n/g, '\n  '));
		process.exit(1);
	}

	return {
		valid,
		enabled,
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
	 * @param {string} [hex]
	 * @return {string}
	 */
	function newGuid(hex) {
		let rnds;
		if (hex) {
			rnds = Buffer.from(hex.slice(0, 32), 'hex');
		} else {
			rnds = crypto.randomBytes(16);
		}
		rnds[6] = (rnds[6] & 0x0f) | 0x40;
		rnds[8] = (rnds[8] & 0x3f) | 0x80;
		rnds = rnds.toString('hex');
		rnds = rnds.slice(0, 8)+'-'+rnds.slice(8, 12)+'-'+rnds.slice(12, 16)+'-'+rnds.slice(16, 20)+'-'+rnds.slice(20);
		return rnds;
	}
	/**
	 * Function that submits tracking event
	 * @param {*} param0
	 * @return {Promise}
	 */
	function request({
		method,
		hostname = 'google-analytics.com',
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
