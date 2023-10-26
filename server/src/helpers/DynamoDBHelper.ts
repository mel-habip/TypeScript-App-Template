import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient, GetCommand, DeleteCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

const region = "us-east-2";
const client = new DynamoDBClient({
    region,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY as string,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
    }
});

const docClient = DynamoDBDocumentClient.from(client);

type CacheTables = 'Table1' | 'Table2' | 'User';

const { ENVIRONMENT_TYPE } = process.env;

const TableNamesMap: Record<CacheTables, string> = {
    User: `user-cache-${ENVIRONMENT_TYPE}`,
    Table1: `table1-cache-${ENVIRONMENT_TYPE}`,
    Table2: `table2-cache-${ENVIRONMENT_TYPE}`,
};

let connectionTested = false; // used to test the connection once upon start

const CACHING_ENABLED = true; // use this to disable caching in case of an emergency

export default class DynamoDBHelper {
    constructor() {
        if (!connectionTested) {
            connectionTested = true;
            this.testConnection().then(() => {
                //nothing
            }).catch(() => {
                //nothing
            })
        }
    }

    private ExpirationCalculator = () => Math.floor(Date.now() / 1000) + (3600 * 1) // Expiration time: current time + 1 hour
    // we keep our TTL (expiration) low because we have a lot of relationships in our DB which don't exist in cache. This means some very deep/complex changes are hard to propogate up in cache  

    // Create or Update item in table
    createOrUpdate = async (table: CacheTables, data = {}) => {
        const command = new PutCommand({
            TableName: TableNamesMap[table],
            Item: {
                ...JSON.parse(JSON.stringify(data)),
                ttl: this.ExpirationCalculator()
            },
        });

        try {
            const result = await docClient.send(command);
            return { success: true, result }
        } catch (error) {
            console.log(error?.name);
            console.log('Failed to write, reason above ^^ ');
            return { success: false }
        }
    };

    // Read item by ID
    getById = async (table: CacheTables, value: string | number, key = 'id') => {

        const bad = { success: false, data: null };

        if (!CACHING_ENABLED) return bad;

        const command = new GetCommand({
            TableName: TableNamesMap[table],
            Key: {
                [key]: typeof value === 'string' ? parseInt(value) : value
            }
        });

        try {
            const response = await docClient.send(command);
            if (!response.Item) throw Error(`Not Found`); //to go to Catch instead
            return { success: true, data: response.Item }
        } catch (error) {
            console.log(error?.name);
            return bad;
        }
    };

    // Delete item by ID
    deleteById = async (table: CacheTables, value: string | number, key = 'id') => {
        const command = new DeleteCommand({
            TableName: TableNamesMap[table],
            Key: {
                [key]: (typeof value === 'string' && key !== 'slug') ? parseInt(value) : value
            },
        });

        try {
            await docClient.send(command);
            return { success: true }
        } catch (error) {
            console.log(error?.name);
            return { success: false, data: null }
        }
    };

    scan = async (table: CacheTables, criteria: { FilterExpression: string, ExpressionAttributeValues: Record<string, any> } | { Limit: number }) => {
        const scanCommandInput = {
            TableName: TableNamesMap[table],
            ...criteria
            // FilterExpression: "status = :status",
            // ExpressionAttributeValues: { ":status": statusToDelete },
        };
        try {
            const queryResult = await docClient.send(new ScanCommand(scanCommandInput));

            if (!queryResult.Items) throw Error(`No Items in result`);

            return queryResult.Items;
        } catch (error) {
            console.error("Error querying items:", error);
        }
    };

    private testConnection = async () => {
        try {
            let res = await this.scan('User', { Limit: 1 });
            if (!res) throw Error(`no result when testing connection`);
            console.log("DynamoDB connection test successful");
            return true;
        } catch (error) {
            console.error("Error testing DynamoDB connection:", error?.name || error);
            return false;
        }
    }
}