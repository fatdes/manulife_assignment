import { Pool } from "pg";
import QueryStream from "pg-query-stream";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@127.0.01:5432/postgres'
});

export default {
    health() {
        return {
            'idleCount': pool.idleCount,
            'waitingCount': pool.waitingCount,
            'totalCount': pool.totalCount,
        };
    },
    async query(text: any, params?: any) {
        const start = Date.now();
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.debug('executed query', { text, duration, rows: res.rowCount });
        return res
    },
    async queryStream(qs: QueryStream) {
        const start = Date.now()
        const c = await pool.connect();
        const stream = c.query(qs);
        stream.on('end', () => {
            const duration = Date.now() - start
            console.debug('executed query stream', { qs, duration })
        });
        return stream
    },
}