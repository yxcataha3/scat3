"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addBot = exports.topUpMethods = exports.problemWithPayment = exports.payOrCancel = exports.regionsBuilder = exports.itemsBuilder = exports.mainCitiesBuilder = exports.mainBuilder = void 0;
//@ts-nocheck
const grammy_1 = require("grammy");
const config_1 = require("../../config");
const config = __importStar(require("../../config"));
function mainBuilder(items) {
    const keyboard = new grammy_1.InlineKeyboard();
    for (const key of Object.keys(items)) {
        const item = items[key];
        keyboard.text(item.title, `${key}/${item.title}`);
    }
    return keyboard;
}
exports.mainBuilder = mainBuilder;
function mainCitiesBuilder() {
    const keyboard = new grammy_1.InlineKeyboard();
    for (let i = 0; i < Object.keys(config.items).length; i++) {
        const city = Object.keys(config.items)[i];
        if (!(i % 2)) {
            keyboard.row();
        }
        keyboard.text(city, city);
        if (i === Object.keys(config.items).length - 1) {
            keyboard.row();
        }
    }
    keyboard.text('Баланс (0 руб.)', 'balance').row();
    keyboard.text('Мои боты', 'my-bots').row();
    if (config_1.REFERRAL_PROGRAM) {
        keyboard.text('Реферальная пргорамма', 'referral-bots').row();
    }
    keyboard.text('Последний заказ', 'last-order').row();
    // Раздел для настройки ссылок
    for (const key of config_1.URL_KEYBOARD) {
        keyboard.url.apply(keyboard, key).row();
    }
    return keyboard;
}
exports.mainCitiesBuilder = mainCitiesBuilder;
function itemsBuilder(city) {
    // написать отрисовку товаров, есть значение города, отрендерить доступные товары из районов
    const keyboard = new grammy_1.InlineKeyboard();
    const regions = config_1.items[city];
    let activeItems = new Set();
    let _tmp = {};
    for (const region of Object.keys(regions)) {
        let regionItems = regions[region];
        for (const item of regionItems) {
            activeItems.add(item.title);
            _tmp[item.title] = item;
        }
    }
    if (activeItems.size === 0) {
        return null;
    }
    for (const itemTitle of activeItems) {
        // @ts-ignore
        const item = _tmp[itemTitle];
        keyboard.text(`${item.title} (${item.price} руб.)`, `itm|${item.id}`).row();
    }
    return keyboard;
}
exports.itemsBuilder = itemsBuilder;
function regionsBuilder(city, itemID) {
    const keyboard = new grammy_1.InlineKeyboard();
    let titleFix;
    let result = [];
    const regions = config_1.items[city];
    console.log(Object.values(regions));
    for (let regionName of Object.keys(regions)) {
        const region = regions[regionName];
        console.log(region, 'shjkfgsjhkdfgkhjd');
        for (let item of region) {
            console.log(item);
            if (titleFix) {
                if (item.title === titleFix) {
                    result.push({ regionName, item });
                }
            }
            else {
                if (item.id === itemID) {
                    titleFix = item.title;
                    result.push({ regionName, item });
                }
            }
        }
    }
    result = [];
    for (let regionName of Object.keys(regions)) {
        const region = regions[regionName];
        console.log(region, 'shjkfgsjhkdfgkhjd');
        for (let item of region) {
            console.log(item);
            if (titleFix) {
                if (item.title === titleFix) {
                    result.push({ regionName, item });
                }
            }
            else {
                if (item.id === itemID) {
                    titleFix = item.title;
                    result.push({ regionName, item });
                }
            }
        }
    }
    console.log(result, 'result');
    for (const { regionName, item } of result) {
        keyboard.text(regionName, `order|${item.id}`).row();
    }
    return keyboard;
}
exports.regionsBuilder = regionsBuilder;
exports.payOrCancel = new grammy_1.InlineKeyboard()
    .text('Оплатить', 'chose_pay_method').row()
    .text('Отменить', 'cancel').row();
exports.problemWithPayment = new grammy_1.InlineKeyboard()
    .url('Проблема с оплатой', config_1.PROBLEM_WITH_PAYMENT_BUTTON_URL);
exports.topUpMethods = new grammy_1.InlineKeyboard()
    .text('Оплата на карту💳', 'pay').row();
// .text('Bitcoin', 'btc').row()
exports.addBot = new grammy_1.InlineKeyboard()
    .text('Добавить бота', 'add-bot');
