/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/fabio-looker/look-at-me-sideways/blob/master/LICENSE.txt */
require('../lib/expect-to-contain-message');

const rule = require('../rules/e2.js');
const {parse} = require('lookml-parser');

describe('Rules', () => {
	describe('E2', () => {
		let failMessageE2 = {
			rule: 'E2',
			exempt: false,
			level: 'error',
		};

		it('should pass if an explore has no joins', () => {
			let result = rule(parse(`model: m {
				explore: orders {}
			}`));
			expect(result).not.toContainMessage(failMessageE2);
		});

		it('should pass if an explore has only many_to_many joins', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: users {
						relationship: many_to_many
					}
				}
			}`));
			expect(result).not.toContainMessage(failMessageE2);
		});

		it('should pass if a many_to_one join correctly uses a 1pk equality constraint', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: users {
						relationship: many_to_one
						sql_on: \${users.pk1_user_id} = \${orders.user_id} ;;
					}
				}
			}`));
			expect(result).not.toContainMessage(failMessageE2);
		});

		it('should pass if a many_to_one join correctly uses a 1pk equality constraint in reverse, or across lines', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: users {
						relationship: many_to_one
						sql_on: \${orders.user_id} 
						=
						\${users.pk1_user_id} ;;
					}
				}
			}`));
			expect(result).not.toContainMessage(failMessageE2);
		});

		it('should pass if a many_to_one join correctly uses a 2pk equality constraint', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: users {
						relationship: many_to_one
						sql_on: \${users.pk2_user_id} = \${orders.user_id}
							AND \${users.pk2_tenant_id} = \${orders.pk2_tenant_id};;
					}
				}
			}`));
			expect(result).not.toContainMessage(failMessageE2);
		});

		it('should error if a many_to_one join uses no PK dimensions', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: users {
						relationship: many_to_one
						sql_on: \${users.id} = \${orders.user_id} ;;
					}
				}
			}`));
			expect(result).toContainMessage(failMessageE2);
		});

		it('should error if a many_to_one join uses PK dimensions, but not on the "one" view', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: users {
						relationship: many_to_one
						sql_on: \${users.id} = \${orders.pk1_id} ;;
					}
				}
			}`));
			expect(result).toContainMessage(failMessageE2);
		});

		it('should error if a many_to_one join has mismatched column numbers on the "one" view', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: users {
						relationship: many_to_one
						sql_on: \${users.pk1_user_id} = \${orders.user_id}
							AND \${users.pk2_tenant_id} = \${orders.tenant_id};;
					}
				}
			}`));
			expect(result).toContainMessage(failMessageE2);
		});

		it('should error if a many_to_one join does not reference enough PK dimensions on the "one" view', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: users {
						relationship: many_to_one
						sql_on: \${users.pk2_user_id} = \${orders.user_id};;
					}
				}
			}`));
			expect(result).toContainMessage(failMessageE2);
		});

		it('should error if a many_to_one join does not reference all unique PK dimensions from the "one" view', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: users {
						relationship: many_to_one
						sql_on: \${users.pk2_user_id} = \${orders.user_id}
							AND \${users.pk2_user_id} = \${orders.user_id};;
					}
				}
			}`));
			expect(result).toContainMessage(failMessageE2);
		});

		it('should error if a many_to_one does not involve PK dimensions on the "one" view in an equality constraint', () => {
			let result = rule(parse(`model: m {
				explore: subscription {
					join: date {
						relationship: many_to_one
						sql_on: \${date.pk1_date} >= \${subscription.start_date}
							AND \${date.pk1_date} <= \${subscription.start_date};;
					}
				}
			}`));
			expect(result).toContainMessage(failMessageE2);
		});


		it('should error if a many_to_one join uses equality constraints with an OR', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: users {
						relationship: many_to_one
						sql_on: \${users.pk2_user_id} = \${orders.user_id}
							AND \${users.pk2_tenant_id} = \${orders.pk2_tenant_id}
							OR \${users.pk2_tenant_id} IS NULL;;
					}
				}
			}`));
			expect(result).toContainMessage(failMessageE2);
		});


		it('should pass if a one_to_one join correctly uses a 1pk equality constraint', () => {
			let result = rule(parse(`model: m {
				explore: user {
					join: user_summaries {
						relationship: one_to_one
						sql_on: \${user_summaries.pk1_user_id} = \${users.pk1_user_id} ;;
					}
				}
			}`));
			expect(result).not.toContainMessage(failMessageE2);
		});

		it('should pass if a one_to_one join correctly uses a 2pk equality constraint', () => {
			let result = rule(parse(`model: m {
				explore: invitations {
					join: memberships {
						relationship: one_to_one
						sql_on: \${memberships.pk2_user_id} = \${invitations.pk2_user_id}
							AND \${memberships.pk2_group_id} = \${invitations.pk2_group_id};;
					}
				}
			}`));
			expect(result).not.toContainMessage(failMessageE2);
		});


		it('should error if a one_to_one join uses no PK dimensions', () => {
			let result = rule(parse(`model: m {
				explore: users {
					join: user_summaries {
						relationship: one_to_one
						sql_on: \${user_summaries.user_id} = \${users.id} ;;
					}
				}
			}`));
			expect(result).toContainMessage(failMessageE2);
		});

		it('should error if a one_to_one join uses PK dimensions, but not on the "left"/"explore" side', () => {
			let result = rule(parse(`model: m {
				explore: users {
					join: user_summaries {
						relationship: one_to_one
						sql_on: \${user_summaries.user_id} = \${users.pk1_user_id} ;;
					}
				}
			}`));
			expect(result).toContainMessage(failMessageE2);
		});

		it('should error if a one_to_one join uses PK dimensions, but not on the "right"/"join" side', () => {
			let result = rule(parse(`model: m {
				explore: users {
					join: user_summaries {
						relationship: one_to_one
						sql_on: \${user_summaries.pk1_user_id} = \${users.user_id} ;;
					}
				}
			}`));
			expect(result).toContainMessage(failMessageE2);
		});

		it('should error if a one_to_one join has mismatched column numbers on the  "left"/"explore" side', () => {
			let result = rule(parse(`model: m {
				explore: users {
					join: user_summaries {
						relationship: one_to_one
						sql_on: \${user_summaries.pk1_user_id} = \${users.pk2_user_id} 
							AND \${user_summaries.pk2_tenant_id} = \${users.pk2_tenant_id} ;;
					}
				}
			}`));
			expect(result).toContainMessage(failMessageE2);
		});

		it('should error if a one_to_one join does not reference enough PK dimensions on the "left"/"explore" view', () => {
			let result = rule(parse(`model: m {
				explore: users {
					join: user_summaries {
						relationship: one_to_one
						sql_on: \${user_summaries.pk2_user_id} = \${users.pk2_user_id}
							AND \${user_summaries.pk2_user_id} = \${users.pk2_tenant_id};;
					}
				}
			}`));
			expect(result).toContainMessage(failMessageE2);
		});

		it('should error if a one_to_one join does not reference enough PK dimensions on the "right"/"join" view', () => {
			let result = rule(parse(`model: m {
				explore: users {
					join: user_summaries {
						relationship: one_to_one
						sql_on: \${user_summaries.pk2_user_id} = \${users.pk2_user_id}
							AND \${user_summaries.pk2_tenant_id} = \${users.pk2_user_id};;
					}
				}
			}`));
			expect(result).toContainMessage(failMessageE2);
		});
	});
});
