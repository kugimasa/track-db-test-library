const chai = require('chai');
const runner = require('../lib/runner');
runner.use(chai);

runner.run('runner module', {
	installations: [`
		create table hotels (
			id integer primary key autoincrement,
			name varchar not null,
			prefecture varchar not null,
			city varchar not null
		)
	`,
	"insert into hotels (name, prefecture, city) values ('ホテル ウエスト横浜', '神奈川県', '横浜市')"
	],
	tests: [{
		title: 'Test1',
		arrange: [
			"insert into hotels (name, prefecture, city) values ('格安ホテル ロイヤル温泉', '栃木県', '那須塩原市')"
		],
		act: ["select * from hotels"],
		assert: [ { equalTo: [
			{
				id: 1,
				name: 'ホテル ウエスト横浜',
				prefecture: '神奈川県',
				city: '横浜市'
			}, {
				id: 2,
				name: '格安ホテル ロイヤル温泉',
				prefecture: '栃木県',
				city: '那須塩原市'
			}
		] } ]
	}]
});
