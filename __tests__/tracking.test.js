const tracking = require('../lib/tracking');
require('../lib/expect-to-contain-message');

describe('CLI', () => {
	it('should error if an invalid argument is passed and for privacy policy to be printed', () => {
		const process = {exit: ()=>{}};
		const exit = jest.spyOn(process, 'exit');
		const console = {log: () => {}};
		const log = jest.spyOn(console, 'log');
		const fs = require('fs');
		const path = require('path');

		let privacyPolicy = fs.readFileSync(path.resolve(__dirname, '../PRIVACY.md'), 'utf-8');
		tracking({
			cliArgs: {reporting: 'bla'},
			process,
			console,
		});
		expect(log).toHaveBeenCalledWith(privacyPolicy.replace(/\n/g, '\n  '));
		expect(exit).toHaveBeenCalledWith(1);
	});

	it('should return an object with enabled false if reporting is disabled', () => {
		const tracker = tracking({
			cliArgs: {reporting: 'no'},
		});

		expect(tracker).toMatchObject({
			enabled: false,
		});
	});

	it('should return a callable request function if tracking is enabled', () => {
		const https = {request: () => {}};
		const request = jest.spyOn(https, 'request');

		const tracker = tracking({
			cliArgs: {reporting: 'yes'},
			https,
		});

		expect(tracker).toMatchObject({
			valid: true,
			enabled: true,
		});
		tracker.track({});
		expect(request).toHaveBeenCalled();
	});

	it('should send a payload', () => {
		let write;
		const https = {request: ()=>{
			let req = {
				write: (body)=>{},
				end: () => {},
			};
			write = jest.spyOn(req, 'write');
			return req;
		}};
		const tracker = tracking({
			cliArgs: {'reporting': 'yes', 'report-user': 'foo@test.com'},
			gaPropertyId: 'test',
			https,
		});

		let errors = [];
		let messages = [{
			rule: 'foo',
			exempt: false,
			level: 'error',
		}, {
			rule: 'foo',
			exempt: false,
			level: 'error',
		}, {
			rule: 'baz',
			level: 'info',
		}, {
			rule: 'bat',
			exempt: true,
			level: 'warning',
		}];
		tracker.track({messages, errors});
		expect(write).toHaveBeenCalledWith(`v=1&av=0.0.0&tid=test&cid=834b0d78-07e7-4800-8493-db52fd650814&t=event&cd1=834b0d7807e798000493db52fd650814e534a8f742a1c5a58cbb7b42879696e0&cd2=&ec=Run&ea=End
			v=1&av=0.0.0&tid=test&cid=834b0d78-07e7-4800-8493-db52fd650814&t=event&ec=Rule%20Result&ea=error&ev=2&cd3=foo&cd4=false&ni=1
			v=1&av=0.0.0&tid=test&cid=834b0d78-07e7-4800-8493-db52fd650814&t=event&ec=Rule%20Result&ea=info&ev=1&cd3=baz&cd4=false&ni=1
			v=1&av=0.0.0&tid=test&cid=834b0d78-07e7-4800-8493-db52fd650814&t=event&ec=Rule%20Result&ea=warning&ev=1&cd3=bat&cd4=false&ni=1`.replace(/\t+/g, ''));
	});

	// TODO: test the arguments with which fs.writeFileSync is called.
	it('should save preferences when called with --reporting=save-yes', () => {
		const fs = {
			writeFileSync: () => {},
			readFileSync: (path) => {
				const fs = require('fs');
				return fs.readFileSync(path);
			},
		};
		const writeFileSync = jest.spyOn(fs, 'writeFileSync');
		tracking({
			cliArgs: {'reporting': 'save-yes'},
			fs,
		});

		expect(writeFileSync).toHaveBeenCalled();
	});


	// TODO: make this test more specific
	it('should not save preferences when called with --reporting=yes|no|save-no', () => {
		const fs = {
			writeFileSync: () => {},
			readFileSync: (path) => {
				const fs = require('fs');
				return fs.readFileSync(path);
			},
		};

		const writeFileSync = jest.spyOn(fs, 'writeFileSync');

		tracking({
			cliArgs: {'reporting': 'save-no'},
			fs,
		});
		expect(writeFileSync).toHaveBeenCalled();
	});
});
