import { query, CreateCollection } from "faunadb";
import { generate } from "shortid";
import { FaunaTestDb, teardown } from "./faunaDatabases";
const { Add, Create, Get } = query;
export const FolderHasItemTestSuiteA = () => {
    describe("Basic functionality", () => {
        test("Addition", async () => {
            const { client } = await FaunaTestDb();
            const result = await client.query(Add(2, 2));
            expect(result).toBe(4);
        }, 10000000);
        test("Write to collection", async () => {
            const { client } = await FaunaTestDb();
            const collectionName = generate();
            const collection = await client.query(CreateCollection({
                name: collectionName
            }));
            const document = await client.query(Create(collectionName));
            const documentRetrieve = await client.query(Get(document["ref"]));
            expect(document).toStrictEqual(documentRetrieve);
        });
        afterAll(async () => {
            await teardown();
        });
    });
};
FolderHasItemTestSuiteA();
