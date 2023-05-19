"use strict";
// @ts-nocheck
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
const grammy_1 = require("grammy");
const keyboards_1 = require("./assets/keyboards");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const https = __importStar(require("https"));
const config = __importStar(require("../config"));
const logic_1 = require("./logic");
const config_1 = require("../config");
const IDS_SEPARATOR = '\n';
const bot = new grammy_1.Bot(config.TOKEN);
let users = new Set();
let cardIndex = 0;
const banFilePath = path.resolve('/root/banIds.txt');
//@ts-ignore
bot.on('callback_query', (ctx, next) => {
    console.log(ctx.callbackQuery.data);
    next();
});
bot.use((ctx, next) => {
    // @ts-ignore
    users.add(ctx.from.id);
    global[ctx.from.id] = global[ctx.from.id] || {};
    next();
});
bot.use((ctx, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (config_1.ADMIN_IDS.includes(ctx.from.id)) {
        return next();
    }
    // @ts-ignore
    const BLACK_LIST_IDS = (yield fs.readFile(banFilePath, { encoding: 'utf8' }).catch(() => '')).split(IDS_SEPARATOR);
    if (BLACK_LIST_IDS.includes(ctx.from.id.toString())) {
        console.log(`Доступ заблокирован для id: ${ctx.from.id} т.к. он в черном списке`);
        return;
    }
    next();
}));
bot.on('message', (ctx, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (((_a = global[ctx.from.id]) === null || _a === void 0 ? void 0 : _a.lock_position) === 'get-spam') {
        (_b = global[ctx.from.id]) === null || _b === void 0 ? void 0 : _b.lock_position = '';
        ctx.reply('Рассылка запущена!');
        for (const user of users) {
            yield ctx.copyMessage(user);
        }
        ctx.reply('Рассылка завершена!');
    }
    else
        next();
}));
bot.command('ban', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    if (!config_1.ADMIN_IDS.includes(ctx.from.id)) {
        return;
    }
    const id = ctx.message.text.replace('/ban', '').trim();
    if (!id) {
        ctx.reply('Использование команды:\n/ban [ID пользователя]');
        return;
    }
    yield fs.appendFile(banFilePath, id + IDS_SEPARATOR);
    yield ctx.reply(`${id} добавлен в черный список`);
}));
bot.command('unban', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    if (!config_1.ADMIN_IDS.includes(ctx.from.id)) {
        return;
    }
    const id = ctx.message.text.replace('/unban', '').trim();
    if (!id) {
        ctx.reply('Использование команды:\n/unban [ID пользователя]');
        return;
    }
    const text = yield fs.readFile(banFilePath, { encoding: 'utf8' });
    const ids = text.split(IDS_SEPARATOR);
    const res = ids.filter(val => val !== id);
    fs.writeFile(banFilePath, res.join(IDS_SEPARATOR));
    yield ctx.reply(`${id} удален из черного списка`);
}));
bot.command('_spam', ctx => {
    global[ctx.from.id].lock_position = 'get-spam';
    ctx.reply('Отправьте сообщение для расслыки!');
});
bot.on('message:text', (ctx, next) => {
    var _a, _b;
    const amount = Number(ctx.msg.text);
    if (((_a = global[ctx.from.id]) === null || _a === void 0 ? void 0 : _a.lock_position) === 'get-amount' && !!amount) {
        if (amount < config_1.MINIMUM_AMOUNT) {
            ctx.reply(``);
            return;
        }
        global[ctx.from.id].price = amount;
        global[ctx.from.id].orderNumber = (0, logic_1.getOrderNumber)();
        (_b = global[ctx.from.id]) === null || _b === void 0 ? void 0 : _b.lock_position = '';
        ctx.reply('Ваш актуальный баланс 0 руб..\nЧем будете оплачивать?', {
            reply_markup: keyboards_1.topUpMethods
        });
    }
    else
        next();
});
bot.callbackQuery('last-order', ctx => bot.api.answerCallbackQuery(ctx.callbackQuery.id, {
    text: 'У вас нет подтвержденных заказов!',
    show_alert: true
}));
bot.on('callback_query', (ctx, next) => {
    ctx.answerCallbackQuery();
    next();
});
bot.callbackQuery(/itm*/, ctx => {
    var _a;
    const id = ctx.callbackQuery.data.slice(4);
    //city, itemName
    ctx.reply('Отличный выбор, выбирай район и приятного отдыха, увидимся )))\n\n\nПо вопросам работы и трудоустройства писать:\n<a href="https://t.me/be_alphabe">💸@smoki_mo2💸</a>', { parse_mode: "HTML", reply_markup: (0, keyboards_1.regionsBuilder)((_a = global[ctx.from.id]) === null || _a === void 0 ? void 0 : _a.city, id) });
});
bot.callbackQuery(/order*/, (ctx) => {
    const data = ctx.callbackQuery.data;
    const id = data.split('|')[1];
    console.log(id);
    let name;
    let price;
    console.log(config_1.items);
    for (const city of Object.keys(config_1.items)) {
        console.log(city, 'djkdfghgklh');
        for (const regionName of Object.keys(config_1.items[city])) {
            const region = config_1.items[city][regionName];
            for (const item of region) {
                if (item.id === id) {
                    name = item.title;
                    price = item.price;
                }
            }
        }
    }
    console.log(name, price);
    global[ctx.from.id].buyName = name;
    global[ctx.from.id].price = Number(price);
    global[ctx.from.id].orderNumber = (0, logic_1.getOrderNumber)();
    ctx.reply(`Номер покупки № ${global[ctx.from.id].orderNumber}
Товар и объем <b>${name}</b>
Для проведения оплаты нажмите на кнопку ОПЛАТИТЬ
После того, как Вы нажмете кнопку оплаты, у вас есть 30 минут на оплату`, {
        parse_mode: "HTML",
        reply_markup: keyboards_1.payOrCancel
    });
});
bot.callbackQuery('chose_pay_method', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield ctx.reply('Ваш актуальный баланс 0 руб..\nЧем будете оплачивать?', { reply_markup: keyboards_1.topUpMethods });
}));
bot.callbackQuery('balance', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const userID = ctx.from.id;
    yield ctx.reply(`Введите сумму на которую вы хотите пополнить баланс`);
    global[ctx.from.id].lock_position = 'get-amount';
}));
bot.callbackQuery(/pay$|btc$/, (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    if (global[ctx.from.id].activeOrder) {
        return ctx.reply('У вас уже создана заявка на пополнение, оплатите или ожидайте отмены!!!');
    }
    yield ctx.reply(`✅ ВЫДАННЫЕ РЕКВИЗИТЫ ДЕЙСТВУЮТ 30 МИНУТ
✅ ВЫ ПОТЕРЯЕТЕ ДЕНЬГИ, ЕСЛИ ОПЛАТИТЕ ПОЗЖЕ
✅ ПЕРЕВОДИТЕ ТОЧНУЮ СУММУ. НЕВЕРНАЯ СУММА НЕ БУДЕТ ЗАЧИСЛЕНА.
✅ ОПЛАТА ДОЛЖНА ПРОХОДИТЬ ОДНИМ ПЛАТЕЖОМ.
✅ ПРОБЛЕМЫ С ОПЛАТОЙ? ПЕРЕЙДИТЕ ПО ССЫЛКЕ : <a href="https://t.me/xm_doctor">doctor</a>
Предоставить чек об оплате и
ID:  ${ctx.from.id}
✅ С ПРОБЛЕМНОЙ ЗАЯВКОЙ ОБРАЩАЙТЕСЬ НЕ ПОЗДНЕЕ 24 ЧАСОВ С МОМЕНТА ОПЛАТЫ.`, { parse_mode: "HTML" });
    const isBtc = ctx.callbackQuery.data === 'btc';
    const wallets = isBtc ? config_1.BTC_WALLETS : config_1.CARD_NUMBERS;
    let cardNumberOrBtcWallet;
    if (config_1.RANDOM_CARD_CHOICE) {
        cardNumberOrBtcWallet = wallets[Math.floor(Math.random() * wallets.length)];
    }
    else {
        if (cardIndex === wallets.length)
            cardIndex = 0;
        cardNumberOrBtcWallet = wallets[cardIndex++];
    }
    let price = Math.round(global[ctx.from.id].price * (1 + config_1.PLUS_PERCENT / 100) + Math.floor(Math.random() * config_1.PRICE_PLUS_RANGE));
    if (isBtc) {
        price = yield new Promise((resolve, reject) => {
            https.get(`https://www.blockchain.com/tobtc?currency=RUB&value=${price}`, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => resolve(data));
                res.on('error', reject);
            });
        });
    }
    yield ctx.reply(`✅Заявка № <b>${global[ctx.from.id].orderNumber}</b>
     Переведите на ${isBtc ? 'кошелёк' : 'банковскую  карту'} ${price} ${isBtc ? 'BTC' : 'рублей удобным для вас способом'}.  Важно пополнить ровную сумму.
<b>${cardNumberOrBtcWallet}</b>
‼️ у вас есть 30 мин на оплату, после чего платёж не будет зачислен
‼️ перевёл неточную сумму - оплатил чужой заказ`, { parse_mode: "HTML" });
    yield ctx.reply('Если в течении часа средства не выдались автоматически то нажмите на кнопку - "Проблема с оплатой"', { reply_markup: keyboards_1.problemWithPayment });
    global[ctx.from.id].activeOrder = true;
    setTimeout(() => {
        global[ctx.from.id].activeOrder = false;
        ctx.reply(`Ваша заявка ${global[ctx.from.id].orderNumber} отменена`);
    }, config_1.ORDER_CANCEL_DELAY * 1000);
    const textToAdmin = `Заявка № <b>${global[ctx.from.id].orderNumber}</b>
Пользователь id: <a href="tg://user?id=${ctx.from.id}">${ctx.from.id}</a>${ctx.from.username ? ` @${ctx.from.username}` : ''}
Способ оплаты: *${cardNumberOrBtcWallet.slice(-4)} 
Сумма: ${price} ${isBtc ? 'btc' : 'руб.'}`;
    yield (0, logic_1.sendMessagesToManyUsers)(ctx, config_1.ADMIN_IDS, textToAdmin, { parse_mode: "HTML" });
}));
bot.callbackQuery('my-bots', ctx => {
    ctx.reply('Ваши боты:\n' +
        'У вас нету ботов!', {
        reply_markup: keyboards_1.addBot
    });
});
bot.callbackQuery('referral-bots', ctx => {
    ctx.reply('Делитесь своими ботами с друзьями и получайте 200руб. с каждого его оплаченного заказа.\n' +
        'Ваши боты:\n' +
        'У вас нету ботов!', {
        reply_markup: keyboards_1.addBot
    });
});
bot.callbackQuery('add-bot', ctx => {
    ctx.reply('Добавление бота доступно от 10-ти покупок');
});
bot.callbackQuery((0, logic_1.getCities)(), ctx => {
    const data = ctx.callbackQuery.data;
    global[ctx.from.id].city = data;
    if (!(0, keyboards_1.itemsBuilder)(data)) {
        return ctx.reply('Товар закончился, зайдите позже');
    }
    ctx.reply('Отлично, там точно есть все что тебе нужно, что желаешь ?)\n\n\nПо вопросам работы и трудоустройства писать:\n<a href="https://t.me/be_alphabe">💸@smoki_mo2💸</a>', { parse_mode: "HTML", reply_markup: (0, keyboards_1.itemsBuilder)(data) });
});
const database = {}; // Объявляем пустой объект базы данных
// Функция для начисления пользователю баланса и отправки сообщения с уведомлением
function addBalanceWithNotification(chatId, amount) {
    let balance = database[chatId]; // Получаем текущий баланс пользователя
    if (!balance) { // Если баланс не найден, инициализируем его начальным значением 0
        database[chatId] = 0;
        balance = 0;
    }
    database[chatId] += amount; // Увеличиваем баланс пользователя на указанную сумму
    const message = `Баланс пополнен на ${amount} р. Текущий баланс: ${database[chatId]} р.`;
    bot.telegram.sendMessage(chatId, message); // Отправляем сообщение пользователю
}
// Обработчик команды "/add_balance"
bot.command('add_balance', (ctx) => {
    const chatId = ctx.chat.id; // Получаем айди чата пользователя
    const amount = 100; // Указываем сумму пополнения баланса
    addBalanceWithNotification(chatId, amount); // Вызываем функцию добавления баланса
});
bot.on('message:text', ctx => {
    ctx.reply('Бро где будешь брать ?)\n\n\nПо вопросам работы и трудоустройства писать:\n<a href="https://t.me/be_alphabe">💸@smoki_mo2💸</a>', { parse_mode: "HTML",
        reply_markup: (0, keyboards_1.mainCitiesBuilder)()
    });
});
bot.start();
process.on('uncaughtException', console.error);
process.on('unhandledRejection', console.error);
