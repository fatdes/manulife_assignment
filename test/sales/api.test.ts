
let repoQueryStream = jest.fn();
let repoBulkInsertRecordTransformer = jest.fn();
jest.mock('../../src/sales/repo', () => {
    return {
        repoBulkInsertRecordTransformer: repoBulkInsertRecordTransformer,
        repoQueryStream: repoQueryStream,
    };
});

import { createReadStream } from 'fs';
import Koa from 'koa';
import { PassThrough, Transform } from 'stream';
import request from 'supertest';
import salesApi from '../../src/sales/api';
import { Record } from '../../src/sales/record';

const app = new Koa();
app.use(salesApi.routes());
const server = app.listen(3000);

beforeAll(async () => {
});

afterAll(() => {
    server.close();
});

describe('API', () => {

    describe('post /sales/record', () => {
        it('small file', async () => {
            let r: Record[] = [];
            repoBulkInsertRecordTransformer.mockImplementation(() =>
                new Transform({
                    objectMode: true,
                    transform: (chunk: Record[], _, cb) => {
                        r.push(...chunk);
                        cb(null, chunk.length);
                    }
                }));

            const response = await request(server)
                .post('/sales/record')
                .set('x-checksum-md5', 'd2da375e9d6637979bee03f4cde14014')
                .attach('file', createReadStream(__dirname + '/../file1.csv'), { contentType: 'application/octet-stream' });

            expect(response.status).toEqual(200);
            expect(response.text).toEqual('{"count":2}');
            expect(r.length).toEqual(2);
            expect(r[0]).toEqual(new Record('John Doe', 29, 177, 'm', 21312, new Date('2020-11-05T13:15:30Z')));
            expect(r[1]).toEqual(new Record('Jane Doe', 32, 187, 'f', 5342, new Date('2019-12-05T13:15:30+08:00')));
        });

    });

    describe('get /sales/record', () => {

        describe('success cases', () => {

            beforeEach(() => {
                repoQueryStream.mockReset();
            });

            it('"dateFrom" no data', async () => {
                let mockStream = new PassThrough();
                repoQueryStream.mockImplementation(() => mockStream);
                setTimeout(() => {
                    mockStream.end();
                }, 500);

                const response = await request(server).get('/sales/record?dateFrom=2021');
                expect(response.status).toEqual(200);
                expect(`${response.body}`).toEqual('');
            });

            it('"dateFrom" return data', async () => {
                let mockStream = new PassThrough();
                repoQueryStream.mockImplementation(() => mockStream);
                setTimeout(() => {
                    mockStream.emit('data', { 'a': 1, 'b': 2 });
                    mockStream.emit('data', { 'a': 3, 'b': 4 });
                    mockStream.emit('data', { 'a': 5, 'b': 5 });
                    mockStream.end();
                }, 500);

                const response = await request(server).get('/sales/record?dateFrom=2021')
                expect(response.status).toEqual(200);
                expect(`${response.body}`).toEqual('{"a":1,"b":2}\n{"a":3,"b":4}\n{"a":5,"b":5}\n');
            });

            it.each`
            dateFrom                 | dateTo                   | expectedDateFrom                   | expectedDateTo
            ${'2021-01-02T03:04:05'} | ${undefined}             | ${new Date('2021-01-02T03:04:05')} | ${undefined} 
            ${undefined}             | ${'2021-01-02T03:04:05'} | ${undefined}                       | ${new Date('2021-01-02T03:04:05')}
            ${'2021-01-02T03:04:05'} | ${'2021-02-03T04:05:06'} | ${new Date('2021-01-02T03:04:05')} | ${new Date('2021-02-03T04:05:06')}
            ${'2021-02-03T04:05:06'} | ${'2021-01-02T03:04:05'} | ${new Date('2021-01-02T03:04:05')} | ${new Date('2021-02-03T04:05:06')}
        `('called with correct $dateFrom and $dateTo', async ({ dateFrom, dateTo, expectedDateFrom, expectedDateTo }) => {
                let mockStream = new PassThrough();
                repoQueryStream.mockImplementation(() => mockStream);
                setTimeout(() => {
                    mockStream.end();
                }, 500);

                let path = '/sales/record';
                let params = [];
                if (dateFrom !== undefined) {
                    params.push(`dateFrom=${dateFrom}`);
                }
                if (dateTo !== undefined) {
                    params.push(`dateTo=${dateTo}`);
                }
                if (params.length > 0) {
                    path += '?' + params.join('&');
                }

                const response = await request(server).get(path);
                expect(response.status).toEqual(200);
                expect(`${response.body}`).toEqual('');
                expect(repoQueryStream).toHaveBeenCalledWith(expectedDateFrom, expectedDateTo);
            });

        });

        describe('fail cases', () => {

            it('error when get sales record none of "dateFrom" and "dateTo" is provided', async () => {
                const response = await request(server).get('/sales/record')
                expect(response.status).toEqual(400);
                expect(response.text).toEqual('{"error":"provide at least one of \\"dateFrom\\" and \\"dateTo\\""}');
            });

            it('error when get sales record "dateFrom" is invalid date', async () => {
                const response = await request(server).get('/sales/record?dateFrom=xyz')
                expect(response.status).toEqual(400);
                expect(response.text).toEqual('{"error":"invalid \\"dateFrom\\""}');
            });

            it('error when get sales record "dateTo" is invalid date', async () => {
                const response = await request(server).get('/sales/record?dateTo=xyz')
                expect(response.status).toEqual(400);
                expect(response.text).toEqual('{"error":"invalid \\"dateTo\\""}');
            });

        });

    });

});
