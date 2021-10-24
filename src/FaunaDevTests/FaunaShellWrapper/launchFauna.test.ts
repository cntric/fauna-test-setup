import { FaunaContainer, FaunaDocker, tearDownFaunaContainer, tearDownFaunaContainers} from "./launchFauna";
import {
    query,
    Client
} from "faunadb";

const {
    Add
} = query;

export const FolderHasItemTestSuiteA = ()=>{

    describe("Basic functionality", ()=>{

            test("Creates container", async ()=>{

               const out = await FaunaContainer();
               
               expect(out.image).toBe(FaunaDocker);

               const containerFetch = await out.docker.listContainers({
                   filters : {
                       name : [out.name]
                   }
               })

               expect(containerFetch[0].Id).toBe(out.container.id);

            }, 100000)

            afterAll(async ()=>{

                await tearDownFaunaContainers();

            })
        
    })

}; FolderHasItemTestSuiteA();