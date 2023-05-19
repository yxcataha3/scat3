//@ts-nocheck
import {InlineKeyboard} from "grammy";
import {items, OPERATOR_URL, PRICE_URL, PROBLEM_WITH_PAYMENT_BUTTON_URL, REFERRAL_PROGRAM, URL_KEYBOARD} from "../../config";
import * as config from "../../config"
import exp from "constants";


export function mainBuilder(items: any) {
    const keyboard = new InlineKeyboard()
    for (const key of Object.keys(items)) {
        const item = items[key]
        keyboard.text(item.title, `${key}/${item.title}`)
    }
    return keyboard
}

export function mainCitiesBuilder() {
    const keyboard = new InlineKeyboard()
    for (let i = 0; i < Object.keys(config.items).length; i++) {
        const city = Object.keys(config.items)[i]
        if (!(i % 2)) {
            keyboard.row()
        }
        keyboard.text(city, city)
        if (i === Object.keys(config.items).length - 1) {
            keyboard.row()
        }
    }
    keyboard.text('Баланс (0 руб.)', 'balance').row()
    keyboard.text('Мои боты', 'my-bots').row()
    if (REFERRAL_PROGRAM) {
        keyboard.text('Реферальная пргорамма', 'referral-bots').row()
    }
    keyboard.text('Последний заказ', 'last-order').row()

    // Раздел для настройки ссылок
    for (const key of URL_KEYBOARD) {
        keyboard.url.apply(keyboard, key).row();
    }
    
    return keyboard
}

export function itemsBuilder(city: string) {
    // написать отрисовку товаров, есть значение города, отрендерить доступные товары из районов
    const keyboard = new InlineKeyboard()
    const regions = items[city]

    let activeItems = new Set()
    let _tmp = {}
    for (const region of Object.keys(regions)) {
        let regionItems = regions[region]
        for (const item of regionItems) {
            activeItems.add(item.title)
            _tmp[item.title] = item
        }
    }
    if (activeItems.size === 0){
        return null
    }
    for (const itemTitle of activeItems) {
        // @ts-ignore
        const item = _tmp[itemTitle]
        keyboard.text(`${item.title} (${item.price} руб.)`, `itm|${item.id}`).row()
    }
    return keyboard
}

export function regionsBuilder(city: string, itemID: string) {
    const keyboard = new InlineKeyboard()
    let titleFix
    let result = []
    const regions = items[city]
    console.log(Object.values(regions))
    for (let regionName of Object.keys(regions)) {
        const region = regions[regionName]
        console.log(region, 'shjkfgsjhkdfgkhjd')
        for (let item of region) {
            console.log(item)
            if (titleFix){
                if (item.title === titleFix) {
                    result.push({regionName, item})
                }
            } else {
                if (item.id === itemID) {
                    titleFix = item.title
                    result.push({regionName, item})
                }
            }
        }
    }
    result = []
    for (let regionName of Object.keys(regions)) {
        const region = regions[regionName]
        console.log(region, 'shjkfgsjhkdfgkhjd')
        for (let item of region) {
            console.log(item)
            if (titleFix){
                if (item.title === titleFix) {
                    result.push({regionName, item})
                }
            } else {
                if (item.id === itemID) {
                    titleFix = item.title
                    result.push({regionName, item})
                }
            }
        }
    }


    console.log(result, 'result')
    for (const {regionName, item} of result) {
        keyboard.text(regionName, `order|${item.id}`).row()
    }
    return keyboard
}

export const payOrCancel = new InlineKeyboard()
    .text('Оплатить', 'chose_pay_method').row()
    .text('Отменить', 'cancel').row()

export const problemWithPayment = new InlineKeyboard()
    .url('Проблема с оплатой', PROBLEM_WITH_PAYMENT_BUTTON_URL)

export const topUpMethods = new InlineKeyboard()
    .text('Оплата на карту💳', 'pay').row()
   // .text('Bitcoin', 'btc').row()

export const addBot = new InlineKeyboard()
    .text('Добавить бота', 'add-bot')