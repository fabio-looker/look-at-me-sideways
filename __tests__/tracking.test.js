const tracking = require('../lib/tracking');
require('../lib/expect-to-contain-message');

// 1. test command line arguments valid, enabled and saved that comes out of it
describe('CLI', () => {
	it('should error if an invalid argument is passed and for privacy policy to be printed', () => {
		const process = {exit: ()=>{}}
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

		expect(tracker).toContainMessage({
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

		expect(tracker).toContainMessage({
			valid: true,
			enabled: true,
		});
		tracker.track(/* what do we want to test with? */);
		expect(request).toHaveBeenCalled();
	});
});

// 2. test fs preferences saved preferences by passing that fs mock

// 3. test http calls
