import 'dotenv/config';
import express from 'express';
import { createClient } from 'redis';
import { Pool } from 'pg';
import cors from 'cors';
import events from 'events';

const pool = new Pool();

pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error acquiring client', err.stack);
    }

    console.log('Connect postgresql successfully');

    client.query(
        'CREATE TABLE IF NOT EXISTS fibonaccies (index int, value bigint, created_at TIMESTAMP DEFAULT NOW())',
        (err, result) => {
            release();
            if (err) {
                return console.error('Error executing query', err.stack);
            }
        }
    );
});

const client = createClient({
    url: 'redis://default:default@redis:6379',
});
const subscriber = client.duplicate();

const eventEmitter = new events.EventEmitter();

const app = express();

interface Fibonacci {
    index: number;
    value: number;
}

const boostrap = async () => {
    await client.connect();
    console.log('Connect redis successfully');

    await subscriber.connect();
    console.log('Connect redis subscriber successfully');

    app.enable('trust proxy');

    app.use(cors());
    app.use(express.json());

    await subscriber.subscribe('RESULT_FIB', async message => {
        const { index, value }: Fibonacci = JSON.parse(message);

        const { rows } = await pool.query(
            `select * from fibonaccies where index = ${index}`
        );

        if (rows.length > 0) return;

        await pool.query('insert into fibonaccies values ($1, $2)', [
            index,
            value,
        ]);

        eventEmitter.emit('response_sse', { index, value });
    });

    app.get('/fibo', async (req, res) => {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            Connection: 'keep-alive',
            'Cache-Control': 'no-cache',
        });

        const list: Fibonacci[] = (
            await pool.query(
                'select * from fibonaccies order by created_at desc'
            )
        ).rows;

        const handler = (data: Fibonacci) => {
            list.unshift(data);

            res.write(
                `data: ${JSON.stringify({
                    data: list,
                    before: data.index,
                })}\n\n`
            );
        };

        eventEmitter.addListener('response_sse', handler);

        res.write(`data: ${JSON.stringify({ data: list })}\n\n`);

        req.on('close', () =>
            eventEmitter.removeListener('response_sse', handler)
        );
    });

    app.post('/fibo', async (req, res) => {
        const index = +req.body.index;
        if (index > 80) return res.json({ message: 'Index too high' });

        const { rows } = await pool.query(
            `select * from fibonaccies where index = ${index}`
        );

        if (rows.length > 0) return res.json({ message: 'Index existed' });

        await client.publish('CALCULATE_FIB', index.toString());

        res.json({ message: 'Working' });
    });

    app.listen(process.env.PORT, () =>
        console.log(`Listening server on port ${process.env.PORT}`)
    );
};

boostrap();
