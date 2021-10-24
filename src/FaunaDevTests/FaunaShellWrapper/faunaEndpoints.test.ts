import { FaunaContainer, FaunaDocker, tearDownFaunaContainer, tearDownFaunaContainers} from "./launchFauna";
import {
    query,
    Client
} from "faunadb";
import { getEndpoints, loadEndpoints } from "./faunaEndpoints";

const {
    Add
} = query;

export const FolderHasItemTestSuiteA = ()=>{

    describe("Basic functionality", ()=>{

            test("Loads endpoints", async ()=>{

                await getEndpoints();

            })
        
    })

}; FolderHasItemTestSuiteA();