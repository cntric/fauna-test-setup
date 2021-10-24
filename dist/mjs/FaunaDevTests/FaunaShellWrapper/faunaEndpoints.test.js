import { query } from "faunadb";
import { getEndpoints } from "./faunaEndpoints";
const { Add } = query;
export const FolderHasItemTestSuiteA = () => {
    describe("Basic functionality", () => {
        test("Loads endpoints", async () => {
            await getEndpoints();
        });
    });
};
FolderHasItemTestSuiteA();
