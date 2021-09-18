import format from "pg-format";
import QueryStream from "pg-query-stream";
import { Transform, TransformCallback } from "stream";
import db from "../db";
import { Record } from './record';

class RepoBulkInsertRecordTransformer extends Transform {
    constructor() {
        super({ objectMode: true });
    }

    _transform(chunk: Record[], enc: any, cb: TransformCallback) {
        let sql = format('INSERT INTO record(username, age, height, gender, amount, last_purchase_date, created_at) VALUES %L',
            chunk.map((r) => [
                r.username, r.age, r.height, r.gender, r.amount, r.lastPurchaseDate, new Date(),
            ]),
        );
        db.query(sql).then((result) => {
            cb(null, result.rowCount);
        }).catch((err) => {
            cb(err);
        });
    }
}

function repoBulkInsertRecordTransformer() {
    return new RepoBulkInsertRecordTransformer();
}

function repoQueryStream(dateFrom?: Date, dateTo?: Date) {
    if (dateFrom && dateTo) {
        return db.queryStream(new QueryStream(format('SELECT * FROM record WHERE last_purchase_date BETWEEN %L AND %L', dateFrom, dateTo)));
    } else if (dateFrom) {
        return db.queryStream(new QueryStream(format('SELECT * FROM record WHERE last_purchase_date >= %L', dateFrom)));
    } else {
        return db.queryStream(new QueryStream(format('SELECT * FROM record WHERE last_purchase_date <= %L', dateTo)));
    }
}

export { repoBulkInsertRecordTransformer, repoQueryStream };

