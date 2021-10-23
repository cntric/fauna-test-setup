import {TestDatabase, removeAllFauna} from "./FaunaDevTests";
import {
    query,
    Client
} from "faunadb";

// const cmd = "docker run --rm --name faunadb -p 8443:8443 fauna/faunadb"
const client = new Client({
    secret : "fnAEWKteguACAOy2MHrdvRK_ZOlpK7eq_5ZrnsF7",
    port : 8443,
    domain: "localhost",
    scheme: "http"
})

const {
    Add
} = query;

export const FolderHasItemTestSuiteA = ()=>{

    describe("Basic functionality", ()=>{

            test("Addition", async ()=>{

               /* const result = await client.query(Add(2, 2));
                console.log(result);*/
               // TestDatabase();

            }, 10000000)

            afterAll(()=>{

                // removeAllFauna();

            })
        
    })

}; FolderHasItemTestSuiteA();