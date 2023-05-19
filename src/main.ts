// @ts-nocheck

import {Bot} from 'grammy'
import {
    addBot,
    itemsBuilder,
    mainCitiesBuilder,
    payOrCancel,
    problemWithPayment,
    regionsBuilder, topUpMethods
} from "./assets/keyboards";

import * as fs from 'fs/promises';
import * as path from 'path';
import * as https from 'https';
import * as config from "../config"
import {getCities, getOrderNumber, sendMessagesToManyUsers} from "./logic";
import {
    CARD_NUMBERS, items,
    ORDER_CANCEL_DELAY,
    PLUS_PERCENT,
    PRICE_PLUS_RANGE,
    RANDOM_CARD_CHOICE,
    ADMIN_IDS,
    BTC_WALLETS,
    MINIMUM_AMOUNT,
} from "../config";

const IDS_SEPARATOR = '\n';

const bot = new Bot<any>(config.TOKEN)
let users = new Set()
let cardIndex = 0
const banFilePath = path.resolve('/root/banIds.txt');

//@ts-ignore
bot.on('callback_query', (ctx, next) => {
    console.log(ctx.callbackQuery.data)
    next()
})
bot.use((ctx, next) => {
    // @ts-ignore
    users.add(ctx.from.id)
    global[ctx.from.id] = global[ctx.from.id] || {}
    next()
})
bot.use(async (ctx, next) => {
    if (ADMIN_IDS.includes(ctx.from.id)) {
        return next();
    }
    // @ts-ignore
    const BLACK_LIST_IDS = (await fs.readFile(banFilePath, {encoding: 'utf8'}).catch(() => '')).split(IDS_SEPARATOR);
    if (BLACK_LIST_IDS.includes(ctx.from.id.toString())) {
        console.log(`Доступ заблокирован для id: ${ctx.from.id} т.к. он в черном списке`);
        return;
    }
    next()
})
bot.on('message', async (ctx, next) => {
    if (global[ctx.from.id]?.lock_position === 'get-spam') {
        global[ctx.from.id]?.lock_position = ''
        ctx.reply('Рассылка запущена!')
        for (const user of users) {
            await ctx.copyMessage(user)
        }
        ctx.reply('Рассылка завершена!')
    } else next()
})
bot.command('ban', async ctx => {
    if (!ADMIN_IDS.includes(ctx.from.id)) {
        return;
    }
    const id = ctx.message.text.replace('/ban', '').trim();
    if (!id) {
        ctx.reply('Использование команды:\n/ban [ID пользователя]')
        return;
    }
    await fs.appendFile(banFilePath, id + IDS_SEPARATOR);
    await ctx.reply(`${id} добавлен в черный список`);
})
bot.command('unban', async ctx => {
    if (!ADMIN_IDS.includes(ctx.from.id)) {
        return;
    }
    const id = ctx.message.text.replace('/unban', '').trim();
    if (!id) {
        ctx.reply('Использование команды:\n/unban [ID пользователя]')
        return;
    }
    const text = await fs.readFile(banFilePath, {encoding: 'utf8'});
    const ids = text.split(IDS_SEPARATOR);
    const res = ids.filter(val => val !== id);
    fs.writeFile(banFilePath, res.join(IDS_SEPARATOR));
    await ctx.reply(`${id} удален из черного списка`);
})
bot.command('_spam', ctx => {
    global[ctx.from.id].lock_position = 'get-spam'
    ctx.reply('Отправьте сообщение для расслыки!')
})
bot.on('message:text', (ctx, next) => {
    const amount = Number(ctx.msg.text);
    if (global[ctx.from.id]?.lock_position === 'get-amount' && !!amount) {
        if (amount < MINIMUM_AMOUNT) {
            ctx.reply(``)
            return;
        }
        global[ctx.from.id].price = amount
        global[ctx.from.id].orderNumber = getOrderNumber()
        global[ctx.from.id]?.lock_position = ''
        ctx.reply('Ваш актуальный баланс 0 руб..\nЧем будете оплачивать?',
            {
                reply_markup: topUpMethods
            })
    } else next()

})
bot.callbackQuery('last-order', ctx => bot.api.answerCallbackQuery(ctx.callbackQuery.id, {
    text: 'У вас нет подтвержденных заказов!',
    show_alert: true
}))
bot.on('callback_query', (ctx, next) => {
    ctx.answerCallbackQuery()
    next()
})

bot.callbackQuery(/itm*/, ctx => {
    const id = ctx.callbackQuery.data.slice(4)

    //city, itemName
    ctx.reply('Отличный выбор, выбирай район и приятного отдыха, увидимся )))\n\n\nПо вопросам работы и трудоустройства писать:\n<a href="https://t.me/be_alphabe">💸@smoki_mo2💸</a>',{parse_mode: "HTML", reply_markup: regionsBuilder(global[ctx.from.id]?.city, id)})
})
bot.callbackQuery(/order*/, (ctx: any) => {
    const data = ctx.callbackQuery.data
    const id = data.split('|')[1]
    console.log(id)
    let name
    let price
    console.log(items)
    for (const city of Object.keys(items)) {
        console.log(city, 'djkdfghgklh')
        for (const regionName of Object.keys(items[city])) {
            const region = items[city][regionName]
            for (const item of region) {
                if (item.id === id) {
                    name = item.title
                    price = item.price
                }
            }
        }
    }
    console.log(name, price)
    global[ctx.from.id].buyName = name
    global[ctx.from.id].price = Number(price)
    global[ctx.from.id].orderNumber = getOrderNumber()
    ctx.reply(`Номер покупки № ${global[ctx.from.id].orderNumber}
Товар и объем <b>${name}</b>
Для проведения оплаты нажмите на кнопку ОПЛАТИТЬ
После того, как Вы нажмете кнопку оплаты, у вас есть 30 минут на оплату`, {
        parse_mode: "HTML",
        reply_markup: payOrCancel
    })
})
bot.callbackQuery('chose_pay_method', async (ctx: any) => {
    await ctx.reply('Ваш актуальный баланс 0 руб..\nЧем будете оплачивать?', {reply_markup: topUpMethods})
})
bot.callbackQuery('balance', async (ctx: any) => {
    const userID = ctx.from.id
    await ctx.reply(`Введите сумму на которую вы хотите пополнить баланс`)
    global[ctx.from.id].lock_position = 'get-amount'
})
bot.callbackQuery(/pay$|btc$/, async (ctx: any) => {
    if (global[ctx.from.id].activeOrder) {
        return ctx.reply('У вас уже создана заявка на пополнение, оплатите или ожидайте отмены!!!')
    }
    await ctx.reply(`✅ ВЫДАННЫЕ РЕКВИЗИТЫ ДЕЙСТВУЮТ 30 МИНУТ
✅ ВЫ ПОТЕРЯЕТЕ ДЕНЬГИ, ЕСЛИ ОПЛАТИТЕ ПОЗЖЕ
✅ ПЕРЕВОДИТЕ ТОЧНУЮ СУММУ. НЕВЕРНАЯ СУММА НЕ БУДЕТ ЗАЧИСЛЕНА.
✅ ОПЛАТА ДОЛЖНА ПРОХОДИТЬ ОДНИМ ПЛАТЕЖОМ.
✅ ПРОБЛЕМЫ С ОПЛАТОЙ? ПЕРЕЙДИТЕ ПО ССЫЛКЕ : <a href="https://t.me/xm_doctor">doctor</a>
Предоставить чек об оплате и
ID:  ${ctx.from.id}
✅ С ПРОБЛЕМНОЙ ЗАЯВКОЙ ОБРАЩАЙТЕСЬ НЕ ПОЗДНЕЕ 24 ЧАСОВ С МОМЕНТА ОПЛАТЫ.`, {parse_mode: "HTML"})

    const isBtc = ctx.callbackQuery.data === 'btc';

    const wallets = isBtc ? BTC_WALLETS : CARD_NUMBERS;
    let cardNumberOrBtcWallet: string
    if (RANDOM_CARD_CHOICE) {
        cardNumberOrBtcWallet = wallets[Math.floor(Math.random() * wallets.length)]
    } else {
        if (cardIndex === wallets.length) cardIndex = 0
        cardNumberOrBtcWallet = wallets[cardIndex++]
    }
    let price = Math.round(global[ctx.from.id].price * (1 + PLUS_PERCENT / 100) + Math.floor(Math.random() * PRICE_PLUS_RANGE));
    if (isBtc) {
        price = await new Promise((resolve, reject) => {
            https.get(`https://www.blockchain.com/tobtc?currency=RUB&value=${price}`, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => resolve(data));
                res.on('error', reject);
            })
        });
    }

    await ctx.reply(`✅Заявка № <b>${global[ctx.from.id].orderNumber}</b>
     Переведите на ${isBtc ? 'кошелёк' : 'банковскую  карту'} ${price} ${isBtc ? 'BTC' : 'рублей удобным для вас способом'}.  Важно пополнить ровную сумму.
<b>${cardNumberOrBtcWallet}</b>
‼️ у вас есть 30 мин на оплату, после чего платёж не будет зачислен
‼️ перевёл неточную сумму - оплатил чужой заказ`, {parse_mode: "HTML"})
    await ctx.reply('Если в течении часа средства не выдались автоматически то нажмите на кнопку - "Проблема с оплатой"', {reply_markup: problemWithPayment})
    global[ctx.from.id].activeOrder = true
    setTimeout(() => {
        global[ctx.from.id].activeOrder = false
        ctx.reply(`Ваша заявка ${global[ctx.from.id].orderNumber} отменена`)
    }, ORDER_CANCEL_DELAY * 1000)

    const textToAdmin = `Заявка № <b>${global[ctx.from.id].orderNumber}</b>
Пользователь id: <a href="tg://user?id=${ctx.from.id}">${ctx.from.id}</a>${ctx.from.username ? ` @${ctx.from.username}` : ''}
Способ оплаты: *${cardNumberOrBtcWallet.slice(-4)} 
Сумма: ${price} ${isBtc ? 'btc' : 'руб.'}`;
    await sendMessagesToManyUsers(ctx, ADMIN_IDS, textToAdmin, {parse_mode: "HTML"});
})
bot.callbackQuery('my-bots', ctx => {
    ctx.reply('Ваши боты:\n' +
        'У вас нету ботов!', {
        reply_markup: addBot
    })
})

bot.callbackQuery('referral-bots', ctx => {
    ctx.reply('Делитесь своими ботами с друзьями и получайте 200руб. с каждого его оплаченного заказа.\n' +
        'Ваши боты:\n' +
        'У вас нету ботов!', {
        reply_markup: addBot
    })
})
bot.callbackQuery('add-bot', ctx => {
    ctx.reply('Добавление бота доступно от 10-ти покупок')
})
bot.callbackQuery(getCities(), ctx => {
    const data = ctx.callbackQuery.data
    global[ctx.from.id].city = data
    if (!itemsBuilder(data)) {
        return ctx.reply('Товар закончился, зайдите позже')
    }
    ctx.reply('Отлично, там точно есть все что тебе нужно, что желаешь ?)\n\n\nПо вопросам работы и трудоустройства писать:\n<a href="https://t.me/be_alphabe">💸@smoki_mo2💸</a>', {parse_mode: "HTML", reply_markup: itemsBuilder(data)})
})

const database = {};  // Объявляем пустой объект базы данных

// Функция для начисления пользователю баланса и отправки сообщения с уведомлением
function addBalanceWithNotification(chatId, amount) {
  let balance = database[chatId];  // Получаем текущий баланс пользователя
  if (!balance) {  // Если баланс не найден, инициализируем его начальным значением 0
    database[chatId] = 0;
    balance = 0;
  }
  database[chatId] += amount;  // Увеличиваем баланс пользователя на указанную сумму
  const message = `Баланс пополнен на ${amount} р. Текущий баланс: ${database[chatId]} р.`;
  bot.telegram.sendMessage(chatId, message);  // Отправляем сообщение пользователю
}

// Обработчик команды "/add_balance"
bot.command('add_balance', (ctx) => {
  const chatId = ctx.chat.id;  // Получаем айди чата пользователя
  const amount = 100;  // Указываем сумму пополнения баланса
  addBalanceWithNotification(chatId, amount);  // Вызываем функцию добавления баланса
});


bot.on('message:text', ctx => {
    ctx.reply('Бро где будешь брать ?)\n\n\nПо вопросам работы и трудоустройства писать:\n<a href="https://t.me/be_alphabe">💸@smoki_mo2💸</a>', {parse_mode: "HTML",
        reply_markup: mainCitiesBuilder()
    })
})
bot.start()



process.on('uncaughtException', console.error)
process.on('unhandledRejection', console.error)