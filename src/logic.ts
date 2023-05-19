//@ts-nocheck
import { Context } from "grammy";
import {items} from "../config";

export function getCities(){
    return Object.keys(items)
}

export function getItems(){

}

export function getOrderNumber(){
    global.orderNumber = global.orderNumber || 50081081
    global.orderNumber += 3
    return global.orderNumber
}

export async function sendMessagesToManyUsers(ctx: Context, ids: number[], text: string, params?: Other<RawApi, "sendMessage", "chat_id" | "text">) {
    for (const id of ids) {
        await ctx.api.sendMessage(id, text, params).catch(e => console.error(e));
    }
}