import {Client} from 'pg';

const client = new Client(process.env.PG_URL);

await client.connect();

export default client;