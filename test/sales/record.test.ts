import { Stream } from 'stream';
import { Record, RecordArrayTransformer, RecordTransformer } from '../../src/sales/record';

describe('Record', () => {

    test('get as construct with mandatory fields', () => {
        let r = new Record('username', 18, 188, 'f', 150, new Date('2021-09-21T17:09:00'));

        expect(r.username).toEqual('username');
        expect(r.age).toEqual(18);
        expect(r.height).toEqual(188);
        expect(r.gender).toEqual('f');
        expect(r.amount).toEqual(150);
        expect(r.lastPurchaseDate).toEqual(new Date('2021-09-21T17:09:00'));
        expect(r.id).toEqual(undefined);
        expect(r.createdAt).toEqual(undefined);
    });

    test('get as constructed with optional fields', () => {
        let r = new Record('username', 18, 188, 'f', 150, new Date('2021-09-21T17:09:00'),
            'id', new Date('2021-01-02T03:04:05'),
        );

        expect(r.username).toEqual('username');
        expect(r.age).toEqual(18);
        expect(r.height).toEqual(188);
        expect(r.gender).toEqual('f');
        expect(r.amount).toEqual(150);
        expect(r.lastPurchaseDate).toEqual(new Date('2021-09-21T17:09:00'));
        expect(r.id).toEqual('id');
        expect(r.createdAt).toEqual(new Date('2021-01-02T03:04:05'));
    });
});

describe('RecordTransformer', () => {

    describe('success', () => {

        it('succeed', async () => {
            let w = new Stream();
            let t = new RecordTransformer();

            let p = new Promise((resolve, reject) => {
                w.pipe(t)
                    .on('data', (data) => {
                        resolve(data);
                    })
                    .on('error', (error) => {
                        reject(error);
                    });

                w.emit('data', { 'USER_NAME': 'username', 'AGE': 18, 'HEIGHT': 188, 'GENDER': 'F', 'SALE_AMOUNT': 150, 'LAST_PURCHASE_DATE': '2021-09-21T17:09:00' });
            })

            await expect(p).resolves.toEqual(new Record('username', 18, 188, 'f', 150, new Date('2021-09-21T17:09:00')));
        });

        it.each`
            username | expected
            ${123}   | ${'123'}
            ${123.4}   | ${'123.4'}
        `('username "$username" is parsed as "$expected"', async ({ username, expected }) => {
            let w = new Stream();
            let t = new RecordTransformer();

            let p = new Promise((resolve, reject) => {
                w.pipe(t)
                    .on('data', (data) => {
                        resolve(data);
                    })
                    .on('error', (error) => {
                        reject(error);
                    });

                w.emit('data', { 'USER_NAME': username, 'AGE': 18, 'HEIGHT': 188, 'GENDER': 'F', 'SALE_AMOUNT': 150, 'LAST_PURCHASE_DATE': '2021-09-21T17:09:00' });
            })

            await expect(p).resolves.toEqual(new Record(expected, 18, 188, 'f', 150, new Date('2021-09-21T17:09:00')));
        });

        it.each`
            gender | expected
            ${'M'} | ${'m'}
            ${'m'} | ${'m'}
            ${'F'} | ${'f'}
            ${'f'} | ${'f'}
        `('gender "gender" is parsed as "$expect"', async ({ gender, expected }) => {
            let w = new Stream();
            let t = new RecordTransformer();

            let p = new Promise((resolve, reject) => {
                w.pipe(t)
                    .on('data', (data) => {
                        resolve(data);
                    })
                    .on('error', (error) => {
                        reject(error);
                    });

                w.emit('data', { 'USER_NAME': 'username', 'AGE': 18, 'HEIGHT': 188, 'GENDER': gender, 'SALE_AMOUNT': 150, 'LAST_PURCHASE_DATE': '2021-09-21T17:09:00' });
            })

            await expect(p).resolves.toEqual(new Record('username', 18, 188, expected, 150, new Date('2021-09-21T17:09:00')));
        });

        it.each`
            date                  | expected
            ${'2021'}             | ${new Date('2020-12-31T16:00:00.000Z')}
            ${'2021-01'}          | ${new Date('2020-12-31T16:00:00.000Z')}
            ${'2021-01-01'}       | ${new Date('2020-12-31T16:00:00.000Z')}
            ${'2021-01-01T00'}    | ${new Date('2020-12-31T16:00:00.000Z')}
            ${'2021-01-01T00:00'} | ${new Date('2020-12-31T16:00:00.000Z')}
            ${new Date('2021-01-01T00:00:00Z')} | ${new Date('2021-01-01T00:00:00.000Z')}
        `('last purchase date "$date" is parsed as "$expect"', async ({ date, expected }) => {
            let w = new Stream();
            let t = new RecordTransformer();

            let p = new Promise((resolve, reject) => {
                w.pipe(t)
                    .on('data', (data) => {
                        resolve(data);
                    })
                    .on('error', (error) => {
                        reject(error);
                    });

                w.emit('data', { 'USER_NAME': 'username', 'AGE': 18, 'HEIGHT': 188, 'GENDER': 'F', 'SALE_AMOUNT': 150, 'LAST_PURCHASE_DATE': date });
            })

            await expect(p).resolves.toEqual(new Record('username', 18, 188, 'f', 150, expected));
        });
    });

    describe('fail cases', () => {

        it.each(
            [
                {
                    field: 'USER_NAME',
                    error: new Error('#0: Error: "USER_NAME" must be non empty'),
                },
                {
                    field: 'AGE',
                    error: new Error('#0: Error: "AGE" must be > 0'),
                },
                {
                    field: 'HEIGHT',
                    error: new Error('#0: Error: "HEIGHT" must be > 0'),
                },
                {
                    field: 'GENDER',
                    error: new Error('#0: Error: "GENDER" must be one of "M" or "F" case insensitive'),
                },
                {
                    field: 'SALE_AMOUNT',
                    error: new Error('#0: Error: "SALE_AMOUNT" must be > 0'),
                },
                {
                    field: 'LAST_PURCHASE_DATE',
                    error: new Error('#0: Error: "LAST_PURCHASE_DATE" must be non null'),
                }
            ]
        )('missing $field should return $error', async ({ field, error }) => {
            let data: any = { 'USER_NAME': 'username', 'AGE': 18, 'HEIGHT': 188, 'GENDER': 'f', 'SALE_AMOUNT': 150, 'LAST_PURCHASE_DATE': '2021-09-21T17:09:00' };
            delete data[field];

            let w = new Stream();
            let t = new RecordTransformer();

            let p = new Promise((resolve, reject) => {
                w.pipe(t)
                    .on('data', (_) => {
                        reject();
                    })
                    .on('error', (error) => {
                        resolve(error);
                    });

                w.emit('data', data);
            })

            await expect(p).resolves.toEqual(error);
        });

        it.each(
            [
                {
                    field: 'AGE',
                    value: 18.1,
                    error: new Error('#0: Error: expect "AGE" is "integer", actual "number", value = "18.1"'),
                },
                {
                    field: 'AGE',
                    value: '18.1',
                    error: new Error('#0: Error: expect "AGE" is "integer", actual "string", value = "18.1"'),
                },
                {
                    field: 'HEIGHT',
                    value: 188.2,
                    error: new Error('#0: Error: expect "HEIGHT" is "integer", actual "number", value = "188.2"'),
                },
                {
                    field: 'HEIGHT',
                    value: '188.2',
                    error: new Error('#0: Error: expect "HEIGHT" is "integer", actual "string", value = "188.2"'),
                },
                {
                    field: 'GENDER',
                    value: 1,
                    error: new Error('#0: Error: expect "GENDER" is "string", actual "number"'),
                },
                {
                    field: 'SALE_AMOUNT',
                    value: 888.88,
                    error: new Error('#0: Error: expect "SALE_AMOUNT" is "integer", actual "number", value = "888.88"'),
                },
                {
                    field: 'SALE_AMOUNT',
                    value: '888.88',
                    error: new Error('#0: Error: expect "SALE_AMOUNT" is "integer", actual "string", value = "888.88"'),
                },
                {
                    field: 'LAST_PURCHASE_DATE',
                    value: '2021-02-30T01:02:03',
                    error: new Error('#0: Error: expect "LAST_PURCHASE_DATE" is valid date string, actual = "2021-02-30T01:02:03"'),
                },
                {
                    field: 'LAST_PURCHASE_DATE',
                    value: 'xyz',
                    error: new Error('#0: Error: expect "LAST_PURCHASE_DATE" is valid date string, actual = "xyz"'),
                },
                {
                    field: 'LAST_PURCHASE_DATE',
                    value: 12345678,
                    error: new Error('#0: Error: expect "LAST_PURCHASE_DATE" is "string" or "date", actual "number", value = "12345678"'),
                },
            ]
        )('incorrect $field type should return $error', async ({ field, value, error }) => {
            let data: any = { 'USER_NAME': 'username', 'AGE': 18, 'HEIGHT': 188, 'GENDER': 'f', 'SALE_AMOUNT': 150, 'LAST_PURCHASE_DATE': '2021-09-21T17:09:00' };
            data[field] = value;

            let w = new Stream();
            let t = new RecordTransformer();

            let p = new Promise((resolve, reject) => {
                w.pipe(t)
                    .on('data', (data) => {
                        reject(data);
                    })
                    .on('error', (error) => {
                        resolve(error);
                    });

                w.emit('data', data);
            })

            await expect(p).resolves.toEqual(error);
        });

        it('unknown field', async () => {
            let data: any = { 'USER_NAME': 'username', 'AGE': 18, 'HEIGHT': 188, 'GENDER': 'F', 'SALE_AMOUNT': 150, 'LAST_PURCHASE_DATE': '2021-09-21T17:09:00' };
            data.FIELD = 'value';

            let w = new Stream();
            let t = new RecordTransformer();

            let p = new Promise((resolve, reject) => {
                w.pipe(t)
                    .on('data', (data) => {
                        reject(data);
                    })
                    .on('error', (error) => {
                        resolve(error);
                    });

                w.emit('data', data);
            })

            await expect(p).resolves.toEqual(new Error('#0: Error: unknown field "FIELD"'));
        });

    });

});

describe('RecordArrayTransformer', () => {

    it('push on batch count and last batch at the end', async () => {
        let w = new Stream();
        let t = new RecordArrayTransformer(2);

        let p = new Promise((resolve, reject) => {
            let rs: Record[][] = [];
            w.pipe(t)
                .on('data', (data) => {
                    rs.push(data);
                })
                .on('error', (error) => {
                    reject(error);
                })
                .on('end', () => {
                    resolve(rs);
                });

            // total 5, every 2 batch, last batch size = 1
            for (var i = 0; i < 5; i++) {
                w.emit('data', new Record(`username#${i}`, 18, 188, 'f', 150, new Date('2021-09-21T17:09:00')));
            }
            w.emit('flush');
            w.emit('end');
        });

        let batches = await p;
        expect(batches).toBeInstanceOf(Array);

        let result = (batches as Record[][]).map((b) => b.map((r) => r.username));
        expect(result.length).toEqual(3);
        expect(result[0]).toEqual(['username#0', 'username#1']);
        expect(result[1]).toEqual(['username#2', 'username#3']);
        expect(result[2]).toEqual(['username#4']);
    });

});
