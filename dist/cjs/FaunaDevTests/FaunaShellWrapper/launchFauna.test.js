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
const launchFauna_1 = require("./launchFauna");
const faunadb_1 = require("faunadb");
const { Add } = faunadb_1.query;
const FolderHasItemTestSuiteA = () => {
    describe("Basic functionality", () => {
        test("Creates container", () => __awaiter(void 0, void 0, void 0, function* () {
            const out = yield (0, launchFauna_1.FaunaContainer)();
            expect(out.image).toBe(launchFauna_1.FaunaDocker);
            const containerFetch = yield out.docker.listContainers({
                filters: {
                    name: [out.name]
                }
            });
            expect(containerFetch[0].Id).toBe(out.container.id);
        }), 100000);
        afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, launchFauna_1.tearDownFaunaContainers)();
        }));
    });
};
exports.FolderHasItemTestSuiteA = FolderHasItemTestSuiteA;
(0, exports.FolderHasItemTestSuiteA)();
