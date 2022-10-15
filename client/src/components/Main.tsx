import { FormEvent, useEffect, useState } from 'react';

interface Fibonacci {
    index: number;
    value: number;
}

const Main: React.FC = () => {
    const [inputVal, setInputVal] = useState<string>('');
    const [results, setResults] = useState<Fibonacci[]>([]);
    const [queues, setQueues] = useState<number[]>([]);
    const [message, setMessage] = useState<string>('');

    useEffect(() => {
        const events = new EventSource('/api/fibo');

        const eventHandler = (message: MessageEvent<string>) => {
            const { data, before }: { data: Fibonacci[]; before?: number } =
                JSON.parse(message.data);

            setResults(data);
            setMessage('');

            if (!before) return;

            const newQueue = queues.filter(index => index !== before);
            if (queues.join() === newQueue.join()) return;

            setQueues(newQueue);
        };

        events.addEventListener('message', eventHandler);

        return () => {
            events.removeEventListener('message', eventHandler);
            events.close();
        };
    }, [queues]);

    const submitHandler = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const response = await fetch('/api/fibo', {
            method: 'POST',
            body: JSON.stringify({ index: inputVal }),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (data.message) {
            setMessage(data.message);

            if (data.message === 'Working')
                setQueues([...new Set([...queues, +inputVal])]);

            setInputVal('');
        }
    };

    return (
        <div className="container">
            <form onSubmit={submitHandler}>
                <label>Enter your index:</label>
                <br />
                <input
                    value={inputVal}
                    onChange={event => setInputVal(event.target.value)}
                    required
                    type={'number'}
                    min="0"
                    max="80"
                />
                <button>Submit</button>
            </form>
            {message && <p>{message}</p>}

            <h3>Queue:</h3>
            <div>{queues.map(index => `${index}, `)}</div>

            <h3>Calculated Values:</h3>
            <ul>
                {results.map(result => (
                    <li key={result.index}>
                        Index: {result.index} - Value: {result.value}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Main;
