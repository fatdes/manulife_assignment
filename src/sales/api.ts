import csv from "csv-parser";
import { isBefore, isValid, parseISO } from "date-fns";
import formidable from "formidable";
import fs from "fs";
import koaBody, { IKoaBodyFormidableOptions } from "koa-body";
import Router from "koa-router";
import path from "path";
import { Transform } from "stream";
import { RecordArrayTransformer, RecordTransformer } from "./record";
import { repoBulkInsertRecordTransformer, repoQueryStream } from "./repo";

const salesApi = new Router({ prefix: '/sales' });

salesApi.post('/record',
    async (ctx, next) => {
        let md5checksum = ctx.headers['x-checksum-md5'];
        if (!md5checksum) {
            ctx.throw(400, JSON.stringify({ 'error': 'missing x-checksum-md5' }));
            return;
        }
        ctx.state.md5checksum = md5checksum;
        await next();
    },
    koaBody({
        multipart: true,
        formidable: {
            multiple: false,
            keepExtensions: true,
            hash: 'md5',
        } as IKoaBodyFormidableOptions,
    }),
    async (ctx) => {
        let fields = ctx.request.files!['file'] as formidable.File;
        //        console.debug(`fields = ${JSON.stringify(fields)}`);
        if (fields.hash != ctx.state.md5checksum) {
            ctx.throw(400, JSON.stringify({ 'error': `incorrect checksum, expected "${ctx.state.md5checksum}", actual "${fields.hash}"` }));
        }
        if (fields.type !== 'application/octet-stream') {
            ctx.throw(400, JSON.stringify({ 'error': `incorrect file type, expected "application/octet-stream", actual "${fields.type}"` }));
        }
        if (path.extname(fields.path) !== '.csv') {
            ctx.throw(400, JSON.stringify({ 'error': `incorrect file type, expected ".csv", actual "${path.extname(fields.path)}"` }));
        }

        try {
            let count = 0;
            await new Promise<void>(async (resolve, reject) => {

                fs.createReadStream(fields.path)
                    .pipe(csv({
                        strict: true,
                    }))
                    .pipe(new RecordTransformer())
                    .pipe(new RecordArrayTransformer())
                    .pipe(repoBulkInsertRecordTransformer())
                    .on('data', (data: number) => {
                        count += data;
                    })
                    .on('end', () => {
                        resolve();
                    })
                    .on('error', (err: any) => {
                        console.error(`err = ${err}`);
                        reject(err);
                    });
            });

            ctx.status = 200;
            ctx.body = JSON.stringify({ 'count': count });
        } catch (err) {
            ctx.status = 400;
            ctx.body = JSON.stringify({ 'error': `${err}` });
        }
    }
);

salesApi.get('/record', async (ctx) => {
    let from = ctx.query.dateFrom || null;
    let to = ctx.query.dateTo || null;

    if (from === null && to === null) {
        ctx.status = 400;
        ctx.body = JSON.stringify({ 'error': 'provide at least one of "dateFrom" and "dateTo"' });
        return;
    }

    let dateFrom: Date | undefined;
    if (from !== null && typeof (from) === 'string') {
        dateFrom = parseISO(from);
        if (!isValid(dateFrom)) {
            ctx.status = 400;
            ctx.body = JSON.stringify({ 'error': 'invalid "dateFrom"' });
            return;
        }
    }

    let dateTo: Date | undefined;
    if (to !== null && typeof (to) === 'string') {
        dateTo = parseISO(to);
        if (!isValid(dateTo)) {
            ctx.status = 400;
            ctx.body = JSON.stringify({ 'error': 'invalid "dateTo"' });
            return;
        }
    }

    if (dateFrom && dateTo) {
        if (isBefore(dateTo, dateFrom)) {
            let tmp = dateTo;
            dateTo = dateFrom;
            dateFrom = tmp;
        }
    }

    const qs = await repoQueryStream(dateFrom, dateTo);

    ctx.status = 200;
    ctx.body = qs.pipe(new Transform({
        objectMode: true,
        transform: (chunk, _, cb) => {
            cb(null, JSON.stringify(chunk) + '\n');
        },
    }));
});

export default salesApi;