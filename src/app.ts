import Koa from 'koa';
import logger from 'koa-logger';
import Router from 'koa-router';
import { default as db } from './db/index';
import salesApi from './sales/api';

(async () => {
    const app = new Koa();
    const router = new Router();

    // attempt to connect database before we starts
    await db.query('SELECT 1');

    // common middlewares
    router.use(logger());

    // routes
    router.use(salesApi.routes());

    router.get('/health', (ctx) => {
        ctx.status = 200;
        ctx.body = JSON.stringify(
            {
                'db': db.health(),
            }
        );
    });

    app
        .use(router.routes())
        .use(router.allowedMethods());

    // let's go
    const port = process.env.PORT && Number.parseInt(process.env.PORT) || 8088;
    app.listen(port, () => {
        console.log(`koa at ${port}`);
    });
})().catch((err) => {
    console.error(`fail to startup: ${err}`);
});