"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FolderHasItemTestSuiteA = void 0;
const faunadb_1 = require("faunadb");
const shortid_1 = require("shortid");
const faunaDatabases_1 = require("./faunaDatabases");
const { Add, Create, Get } = faunadb_1.query;
const FolderHasItemTestSuiteA = () => {
    describe("Basic functionality", () => {
        test("Addition", () => __awaiter(void 0, void 0, void 0, function* () {
            const { client } = yield (0, faunaDatabases_1.FaunaTestDb)();
            const result = yield client.query(Add(2, 2));
            expect(result).toBe(4);
        }), 10000000);
        test("Write to collection", () => __awaiter(void 0, void 0, void 0, function* () {
            const { client } = yield (0, faunaDatabases_1.FaunaTestDb)();
            const collectionName = (0, shortid_1.generate)();
            const collection = yield client.query((0, faunadb_1.CreateCollection)({
                name: collectionName
            }));
            const document = yield client.query(Create(collectionName));
            const documentRetrieve = yield client.query(Get(document["ref"]));
            expect(document).toStrictEqual(documentRetrieve);
        }));
        afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, faunaDatabases_1.teardown)();
        }));
    });
};
exports.FolderHasItemTestSuiteA = FolderHasItemTestSuiteA;
(0, exports.FolderHasItemTestSuiteA)();
