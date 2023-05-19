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
exports.sendMessagesToManyUsers = exports.getOrderNumber = exports.getItems = exports.getCities = void 0;
const config_1 = require("../config");
function getCities() {
    return Object.keys(config_1.items);
}
exports.getCities = getCities;
function getItems() {
}
exports.getItems = getItems;
function getOrderNumber() {
    global.orderNumber = global.orderNumber || 50081081;
    global.orderNumber += 3;
    return global.orderNumber;
}
exports.getOrderNumber = getOrderNumber;
function sendMessagesToManyUsers(ctx, ids, text, params) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const id of ids) {
            yield ctx.api.sendMessage(id, text, params).catch(e => console.error(e));
        }
    });
}
exports.sendMessagesToManyUsers = sendMessagesToManyUsers;
