const rules = require('../rules/k1-2-3-4');

/* Custom matcher for:
expect(rules(project)).toEqual(
	expectObjectContaining({
		messages: expect.arrayContaining([expect.objectContaining(argument)])
	})
);
*/
expect.extend({
	toContainObject(received, argument) {
		const pass = this.equals(received,
			expect.objectContaining({
				messages: expect.arrayContaining([expect.objectContaining(argument)]),
			})
		);
		if (pass) {
			return {
				message: () => (`expected ${this.utils.printReceived(received)} not to contain object ${this.utils.printExpected(argument)}`),
				pass: true,
			};
		} else {
			return {
				message: () => (`expected ${this.utils.printReceived(received)} to contain object ${this.utils.printExpected(argument)}`),
				pass: false,
			};
		}
	},
});


describe('Rules', () => {
	let project;
	// example project returned by lookml parser, could potentially be replaced with an actual call to the parser
	beforeEach(() => {
		project = {
			files: [{
				'view': [{}],
				'views': [{
					'sql_table_name': 'tbl',
					'dimensions': [{
						primary_key: true,
						hidden: true,
						type: 'string',
						sql: '${TABLE}.foo ',
						_dimension: 'pk2_foo',
						_type: 'dimension',
						_n: 0,
						_view: 'foo',
					}, {
						primary_key: true,
						hidden: true,
						type: 'string',
						sql: '${TABLE}.baz ',
						_dimension: 'pk2_baz',
						_type: 'dimension',
						_n: 1,
						_view: 'foo',
					}, {
						type: 'string',
						sql: '${TABLE}.waldo ',
						_dimension: 'waldo',
						_type: 'dimension',
						_n: 2,
						_view: 'foo',
					}],
					'_view': 'foo',
				}],
				'_file_path': 'foo.view.lkml',
				'_file_rel': 'foo.view.lkml',
				'_file_name': 'foo',
				'_file_type': 'view',
			}],
			file: {model: {}, view: {foo: [{}]}, explore: {}},
			models: [],
			model: {},
			name: 'lams',
		};
	});

	describe('K1', () => {
		let failMessageK1;
		beforeEach(() => {
			failMessageK1 = {
				rule: 'K1',
				exempt: false,
				level: 'error',
			};
		});
		it('should pass if any pk is defined using [0-9]pk_.* or pk[0-9]_.*', () => {
			project.files[0].views[0].dimensions[0]._dimension = 'pk2_foo';
			expect(rules(project)).not.toContainObject(failMessageK1);

			project.files[0].views[0].dimensions[0]._dimension = '2pk_foo';
			expect(rules(project)).not.toContainObject(failMessageK1);
		});
		it('should error if any pk is defined incorrectly using [0-9]pk[0-9]_.*', () => {
			project.files[0].views[0].dimensions[0]._dimension = '1pk1_foo';
			project.files[0].views[0].dimensions[1]._dimension = '1pk1_bar';
			expect(rules(project)).toContainObject(failMessageK1);
		});
		it('should not error if no pk is found and file is exempt from rule', () => {
			project.files[0].views[0].dimensions[0]._dimension = 'foobar';
			project.files[0].views[0].dimensions[1]._dimension = 'foobaz';
			project.files[0]['rule_exemptions'] = {K1: 'Who cares about primary keys.'};
			failMessageK1.exempt = expect.any(String);
			expect(rules(project)).toContainObject(failMessageK1);
		});
		it('should not error if there is no sql_table_name', () => {
			project.files[0].views[0].sql_table_name = undefined;
			expect(rules(project)).not.toContainObject(failMessageK1);
		});
	});

	describe('K2', () => {
		let failMessageK2;
		beforeEach(() => {
			failMessageK2 = {
				rule: 'K2',
				exempt: false,
				level: 'error',
			};
		});

		it('should pass if all pks are prefixed with the same {n}pk|pk{n} in a given view', () => {
			expect(rules(project)).not.toContainObject(failMessageK2);
		});
		it('should pass if number of pks matches {n} in {n}pk', () => {
			expect(rules(project)).not.toContainObject(failMessageK2);
		});
		it('should error if pks are defined using different prefixes in a given view', () => {
			project.files[0].views[0].dimensions[1]._dimension = 'pk1_baz';
			expect(rules(project)).toContainObject(failMessageK2);
		});
		it('should error if number of pks does not match {n} in {n}pk', () => {
			project.files[0].views[0].dimensions[0]._dimension = '3pk_foo';
			project.files[0].views[0].dimensions[1]._dimension = '3pk_baz';
			expect(rules(project)).toContainObject(failMessageK2);
		});
	});

	describe('K3', () => {
		let failMessageK3;
		beforeEach(() => {
			failMessageK3 = {
				rule: 'K3',
				exempt: false,
				level: 'warning',
			};
		});
		it('should pass if pks are defined first in view file', () => {
			expect(rules(project)).not.toContainObject(failMessageK3);
		});
		it('should warn if pks are not defined first in view file', () => {
			project.files[0].views[0].dimensions[0]._n = 2;
			project.files[0].views[0].dimensions[1]._n = 3;
			expect(rules(project)).toContainObject(failMessageK3);
		});
	});

	describe('K4', () => {
		let failMessageK4;
		beforeEach(() => {
			failMessageK4 = {
				rule: 'K4',
				exempt: false,
				level: 'warning',
			};
		});
		it('should pass if all pks are hidden', () => {
			expect(rules(project)).not.toContainObject(failMessageK4);
		});
		it('should warn if any pk is not hidden', () => {
			project.files[0].views[0].dimensions[0].hidden = false;
			expect(rules(project)).toContainObject(failMessageK4);
		});
	});
});
