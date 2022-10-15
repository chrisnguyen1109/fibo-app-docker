import { createClient } from 'redis';

const client = createClient({
    url: 'redis://default:default@redis:6379',
});
const subscriber = client.duplicate();

const fibonacci = async (index: number): Promise<number> => {
    if (index < 2) return 1;

    const value = +(await client.get(index.toString()));
    if (value) return value;

    const res = (await fibonacci(index - 1)) + (await fibonacci(index - 2));
    await client.set(index.toString(), res);

    return res;
};

const boostrap = async () => {
    await client.connect();
    console.log('Connect redis successfully');

    await subscriber.connect();
    console.log('Connect redis subscriber successfully');

    await subscriber.subscribe('CALCULATE_FIB', async message => {
        const index = parseInt(message, 10);

        const value = await fibonacci(index);

        // sleep 2s
        // const now = Date.now();

        // while (Date.now() - now < 2000) {}

        await client.publish('RESULT_FIB', JSON.stringify({ index, value }));
    });
};

boostrap();
