require('../lib/expect-to-contain-message');

const rule = require('../rules/e1.js');
const {parse} = require('lookml-parser');

describe('Rules', () => {
	describe('E0', () => {
		let warnMessageE0 = {
			rule: 'E0',
			exempt: false,
			level: 'warning',
		};

		let passMessageE0 = {
			rule: 'E0',
			level: 'info',
		};

		it('should pass if all fields in a join use the subsitution operator', () => {
			let result = rule(parse(`file: f {
				model: foo {
					connection: "myconnection"
					explore: orders {
						join: users {
							relationship: one_to_many
							sql_on: \${orders.1pk_user_id} = \${users.id};;
						}
					}
				}
			}`));
			expect(result).toContainMessage(passMessageE0);
		});

		it('should not warn if liquid syntax is detected and the subsitution operator is not found', () => {
			let result = rule(parse(`file: f {
				model: foo {
					connection: "myconnection"
					explore: orders {
						join: users {
							relationship: many_to_one
							sql_on: {% if users.created_week._in_query %}
										users.created_week=orders_smry_week.week
									{% else %}
										users.id=orders.user_id
									{% endif %} ;;
						}
					}
				}
			}`));
			expect(result).toContainMessage(passMessageE0);
		});

		it('should warn if not all join fields use the substitution operator', () => {
			let result = rule(parse(`file: f {
				model: foo {
					connection: "myconnection"
					explore: orders {
						join: users {
							relationship: one_to_many
							sql_on: \${orders.1pk_user_id} = \${users.id} AND orders.country_id = \${users.country_id};;
						}
					}
				}
			}`));
			expect(result).toContainMessage(warnMessageE0);
		});

		it('should warn if no join fields use the substitution operator', () => {
			let result = rule(parse(`file: f {
				model: foo {
					connection: "myconnection"
					explore: orders {
						join: users {
							relationship: one_to_many
							sql_on: orders.1pk_user_id = users.id ;;
						}
					}
				}
			}`));
			expect(result).toContainMessage(warnMessageE0);
		});

		// TODO confirm exemption levels for E rules.
	});
});
