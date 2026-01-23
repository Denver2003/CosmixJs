Инап-покупки
Вы можете получать доход, предоставив пользователям возможность совершать покупки в игре. Например, дополнительное время на прохождение уровня или аксессуары для игрового персонажа. Для этого:

Подключите инап-покупки в Консоли разработчика Яндекс Игр.
Настройте в SDK возможность работы с покупками.
Добавьте проверку необработанных покупок.
Протестируйте покупки.
Внимание

Тестировать покупки можно только после подключения их консумирования. Иначе могут появиться необработанные платежи, которые сделают прохождение модерации невозможным.

Условия подключения
После добавления покупок и публикации черновика игры отправьте письмо с запросом о подключении покупок на почту games-partners@yandex-team.ru. В письме обязательно укажите название и идентификатор (ID) игры.

После получения ответного письма от games-partners@yandex-team.ru с подтверждением, что покупки разрешены, их можно будет настраивать и тестировать.

Инициализация
Чтобы игроки могли совершать инап-покупки, используйте объект payments. Вы можете:

Обратиться напрямую к ysdk.payments. Покупки инициализируются при первом вызове любого из методов объекта, из-за чего первый вызов может быть чуть медленнее.

Инициализировать объект с помощью метода ysdk.getPayments(). Он предзагружает данные, необходимые для методов payments. Так их первый вызов не будет замедлен.

Внимание

В YaGames.init() и ysdk.getPayments() можно передать опциональный параметр signed: boolean, который предназначен для защиты от накруток. Выбор значения зависит от того, где обрабатываются платежи:

Если на стороне клиента — вызовите методы без параметра или передайте signed: false. Методы покупок будут возвращать данные в открытом виде.

Если на стороне сервера — передайте signed: true. В таком случае в ответах методов payments.getPurchases() и payments.purchase() все данные возвращаются только в зашифрованном виде в параметре signature.

Инициализация с параметром по умолчанию (signed: false).

Способ 1: Упрощенный

YaGames.init() // Или YaGames.init({ signed: false }).
    .then(ysdk => {
        // Методы покупок доступны в ysdk.payments.
        console.log(ysdk.payments);
    }).catch(err => {
        // Покупки недоступны.
    });

Способ 2: Предзагрузка через getPayments()

var payments = null;
YaGames.init()
    .then(ysdk => {
        ysdk.getPayments()
            .then(_payments => {
                // Методы покупок доступны в payments.
                payments = _payments;
                console.log(payments);
            }).catch(err => {
                // Покупки недоступны.
            });
    });




 

Активация процесса покупки
Чтобы активировать инап-покупку, используйте метод payments.purchase({ id, developerPayload }).

id: string — идентификатор товара, который задан в Консоли разработчика.
developerPayload: string — опциональный параметр. Дополнительная информация о покупке, которую вы хотите передавать на свой сервер (будет передана в параметре signature).
Метод открывает фрейм с платежным шлюзом.

Инициализация с параметром по умолчанию (signed: false).

Возвращает Promise<Purchase>.

Purchase: object — информация о покупке. Содержит свойства:

productID: string — идентификатор товара.
purchaseToken: string — токен для использования покупки.
developerPayload: string — дополнительные данные о покупке.



После того как игрок успешно совершил покупку, Promise переходит в состояние «resolved». Если игрок не совершил покупку и закрыл окно, Promise переходит в состояние «rejected».

Внимание

Нестабильная работа интернета может привести к ситуации, когда игрок совершил покупку, но она не учлась в игре. Чтобы избежать этого, для обработки покупок применяйте методы, описанные в разделах Проверка необработанных покупок и payments.consumePurchase().

Отказ от следования этим инструкциям может привести к отключению инап-покупок в приложении или снятию его с публикации.

Пользователь может совершить покупку без авторизации, но мы рекомендуем предлагать ему войти в аккаунт заранее или при совершении покупки.

Пример
В общем случае:

payments.purchase({ id: 'gold500' })
    .then(purchase => {
        // Покупка успешно совершена!
    }).catch(err => {
        // Покупка не удалась: в Консоли разработчика не добавлен товар с таким id,
        // пользователь не авторизовался, передумал и закрыл окно оплаты,
        // истекло отведенное на покупку время, не хватило денег и т. д.
    });

С использованием опционального параметра developerPayload:

payments.purchase({ id: 'gold500', developerPayload: '{serverId:42}' })
    .then(purchase => {
        // purchase.developerPayload === '{serverId:42}'
    });

Получение списка купленных товаров
Используйте метод payments.getPurchases(), чтобы:

узнать, какие покупки игрок уже совершил;

проверить наличие необработанных покупок;

обработать постоянные покупки.

Инициализация с параметром по умолчанию (signed: false).

Возвращает Promise<Purchase[]>.

Purchase[]: array — список покупок, совершенных игроком. Каждая покупка Purchase содержит свойства:

productID: string — идентификатор товара.
purchaseToken: string — токен для использования покупки.
developerPayload: string — дополнительные данные о покупке.
Пример

var SHOW_ADS = true;
payments.getPurchases()
    .then(purchases => {
        if (purchases.some(purchase => purchase.productID === 'disable_ads')) {
          SHOW_ADS = false;
        }
    }).catch(err => {
        // Ошибка получения списка покупок. Выбрасывает исключение PAYMENT_FAILURE.
    });





 

Получение каталога всех товаров
Чтобы получить список доступных покупок и их стоимость, используйте метод payments.getCatalog().

Метод возвращает Promise<Product[]>.

Product[]: array — список доступных для пользователя товаров. Формируется из таблицы на вкладке Инап-покупки Консоли разработчика. Каждый Product содержит свойства:

id: string — идентификатор товара.
title: string — название.
description: string — описание.
imageURI: string — URL изображения.
price: string — стоимость товара в формате <цена> <код валюты>.
priceValue: string — стоимость товара в формате <цена>.
priceCurrencyCode: string — код валюты.
Product.getPriceCurrencyImage(size) — метод получения адреса иконки валюты.

size: string — опциональный параметр. Возможные значения:

small (по умолчанию) — получение маленькой иконки.

medium — получение иконки среднего размера.

svg — получение иконки в векторе.

Метод возвращает string — адрес иконки, например //yastatic.net/s3/games-static/static-data/images/payments/sdk/currency-icon-s@2x.png.

Пример
var gameShop = []
payments.getCatalog()
    .then(products => {
        gameShop = products;
    });

Обозначение портальной валюты
Чтобы отобразить название и иконку портальной валюты в игре, используйте возможности SDK:

Product.price: string — цена с кодом валюты.
Product.priceCurrencyCode: string — код валюты.
Product.getPriceCurrencyImage() возвращает string — адрес иконки валюты.
Подробнее об объекте Product см. в разделе Получение каталога всех товаров.

Обработка покупки и начисление внутриигровой валюты
Существуют два типа покупок — постоянные (например, отключение рекламы) и используемые (например, внутриигровая валюта).

Для обработки постоянных покупок применяйте метод payments.getPurchases().

Для обработки используемых покупок применяйте метод payments.consumePurchase().

payments.consumePurchase()
Метод возвращает Promise в состоянии «resolved», если обработка прошла успешно, или «rejected» если возникли ошибки.

Внимание

После вызова метода payments.consumePurchase() обработанная покупка удаляется без возможности восстановления. Поэтому сначала модифицируйте данные игрока методами player.setStats() или player.incrementStats(), а затем обрабатывайте покупку.

Пример
payments.purchase({ id: 'gold500' })
    .then(purchase => {
        // Покупка успешно совершена!
        // Начисляем на баланс 500 золотых и используем покупку.
        addGold(500).then(() => payments.consumePurchase(purchase.purchaseToken));
    });

function addGold(value) {
    return player.incrementStats({ gold: value });
    // Подробнее см. в разделе Данные игрока.
}

purchaseToken: string — токен, возвращаемый методами payments.purchase() и payments.getPurchases().

Проверка необработанных покупок
Если во время совершения инап-покупки у пользователя отключился интернет или ваш сервер был недоступен, покупка может остаться необработанной. Чтобы избежать такой ситуации, проверяйте наличие необработанных покупок с помощью метода payments.getPurchases(), например, при каждом запуске игры.

Внимание

Перед тем как добавить покупки, настройте проверку необработанных платежей.

Эта проверка обязательна для прохождения модерации, поэтому важно настроить ее даже для тестовых покупок. Если добавить в игру покупки и протестировать их до настройки консумирования, то после тестов могут остаться необработанные платежи, которые сделают прохождение модерации невозможным.

Инициализация с параметром по умолчанию (signed: false).

Пример

payments.getPurchases().then(purchases => purchases.forEach(consumePurchase));

function consumePurchase(purchase) {
    if (purchase.productID === 'gold500') {
        player.incrementStats({ gold: 500 })
            .then(() => {
                payments.consumePurchase(purchase.purchaseToken)
            });
    }
}



 

Защита от накруток
Чтобы обезопасить себя от возможных накруток показателей в игре, обрабатывайте покупки на стороне сервера:

Инициализируйте YaGames.init() или ysdk.getPayments() с параметром { signed: true }.
Полученную подпись в ответах payments.purchase() и payments.getPurchases() передайте на свой сервер, расшифруйте ее с помощью секретного ключа.
На своем сервере начислите игроку полученные в игре предметы.
// Убедитесь что покупки инициализированы с параметром { signed: true }.

payments.purchase({ id: 'gold500' })
    .then(purchase => {
        // Покупка успешно совершена!
        // Начисляем на сервере 500 золотых...
        serverPurchase(purchase.signature); // Проверяем подпись и начисляем игроку данные.
    });

function serverPurchase(signature) {
    return fetch('https://your.game.server?purchase', {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: signature
        });
}

Параметр signature передаваемого на сервер запроса содержит данные о покупке и подпись. Представляет собой две строки в кодировке base64: <подпись>.<JSON с данными о покупке>.

Пример signature
hQ8adIRJWD29Nep+0P36Z6edI5uzj6F3tddz6Dqgclk=.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImlzc3VlZEF0IjoxNTcxMjMzMzcxLCJyZXF1ZXN0UGF5bG9hZCI6InF3ZSIsImRhdGEiOnsidG9rZW4iOiJkODVhZTBiMS05MTY2LTRmYmItYmIzOC02ZDJhNGNhNDQxNmQiLCJzdGF0dXMiOiJ3YWl0aW5nIiwiZXJyb3JDb2RlIjoiIiwiZXJyb3JEZXNjcmlwdGlvbiI6IiIsInVybCI6Imh0dHBzOi8veWFuZGV4LnJ1L2dhbWVzL3Nkay9wYXltZW50cy90cnVzdC1mYWtlLmh0bWwiLCJwcm9kdWN0Ijp7ImlkIjoibm9hZHMiLCJ0aXRsZSI6ItCR0LXQtyDRgNC10LrQu9Cw0LzRiyIsImRlc2NyaXB0aW9uIjoi0J7RgtC60LvRjtGH0LjRgtGMINGA0LXQutC70LDQvNGDINCyINC40LPRgNC1IiwicHJpY2UiOnsiY29kZSI6IlJVUiIsInZhbHVlIjoiNDkifSwiaW1hZ2VQcmVmaXgiOiJodHRwczovL2F2YXRhcnMubWRzLnlhbmRleC5uZXQvZ2V0LWdhbWVzLzE4OTI5OTUvMmEwMDAwMDE2ZDFjMTcxN2JkN2EwMTQ5Y2NhZGM4NjA3OGExLyJ9fX0=

Пример передаваемых данных о покупке (в формате JSON)
Обратите внимание, что формат данных параметра signature в функции serverPurchase(signature) отличается от используемого в методе payments.getPurchases().

В методе payments.getPurchases() параметр signature содержит массив объектов покупок в поле data. В функции serverPurchase(signature) — объект покупки.

{
  "algorithm": "HMAC-SHA256",
  "issuedAt": 1571233371,
  "requestPayload": "qwe",
  "data": {
    "token": "d85ae0b1-9166-4fbb-bb38-6d2a4ca4416d",
    "status": "waiting",
    "errorCode": "",
    "errorDescription": "",
    "url": "https://yandex.ru/games/sdk/payments/trust-fake.html",
    "product": {
      "id": "noads",
      "title": "Без рекламы",
      "description": "Отключить рекламу в игре",
      "price": {
        "code": "YAN",
        "value": "49"
      },
      "imagePrefix": "https://avatars.mds.yandex.net/get-games/1892995/2a0000016d1c1717bd7a0149ccadc86078a1/"
    },
    "developerPayload": "TEST DEVELOPER PAYLOAD"
  }
}

Пример секретного ключа
t0p$ecret

Секретный ключ для проверки подписи является уникальным для игры. Формируется автоматически при создании покупок в Консоли разработчика. Размещен под таблицей с покупками.

Пример проверки подписи на сервере
import hashlib
import hmac
import base64
import json

usedTokens = {}

key = 't0p$ecret' # Держите ключ в секрете.
secret = bytes(key, 'utf-8')
signature = 'hQ8adIRJWD29Nep+0P36Z6edI5uzj6F3tddz6Dqgclk=.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImlzc3VlZEF0IjoxNTcxMjMzMzcxLCJyZXF1ZXN0UGF5bG9hZCI6InF3ZSIsImRhdGEiOnsidG9rZW4iOiJkODVhZTBiMS05MTY2LTRmYmItYmIzOC02ZDJhNGNhNDQxNmQiLCJzdGF0dXMiOiJ3YWl0aW5nIiwiZXJyb3JDb2RlIjoiIiwiZXJyb3JEZXNjcmlwdGlvbiI6IiIsInVybCI6Imh0dHBzOi8veWFuZGV4LnJ1L2dhbWVzL3Nkay9wYXltZW50cy90cnVzdC1mYWtlLmh0bWwiLCJwcm9kdWN0Ijp7ImlkIjoibm9hZHMiLCJ0aXRsZSI6ItCR0LXQtyDRgNC10LrQu9Cw0LzRiyIsImRlc2NyaXB0aW9uIjoi0J7RgtC60LvRjtGH0LjRgtGMINGA0LXQutC70LDQvNGDINCyINC40LPRgNC1IiwicHJpY2UiOnsiY29kZSI6IlJVUiIsInZhbHVlIjoiNDkifSwiaW1hZ2VQcmVmaXgiOiJodHRwczovL2F2YXRhcnMubWRzLnlhbmRleC5uZXQvZ2V0LWdhbWVzLzE4OTI5OTUvMmEwMDAwMDE2ZDFjMTcxN2JkN2EwMTQ5Y2NhZGM4NjA3OGExLyJ9fX0='

sign, data = signature.split('.')
message = base64.b64decode(data)

purchaseData = json.loads(message)
result = base64.b64encode(hmac.new(secret, message, digestmod=hashlib.sha256).digest())
if result.decode('utf-8') == sign:
  print('Signature check ok!')

  if not purchaseData['data']['token'] in usedTokens:
    usedTokens[purchaseData['data']['token']] = True; # Используйте базу данных.
    print('Double spend check ok!')

    print('Apply purchase:', purchaseData['data']['product'])
    # Здесь можно безопасно начислить купленное.