import ccxt from 'ccxt'
import asciichart from 'asciichart'

// from variable id
const binance = new ccxt.binance ({
    apiKey: 'DLkMYBwmTHoajAL25xa9LSAVrBXkrwTS87j6yf78TwqYYmLs4IT9HUQTVMwpxXlw',
    secret: 'NpsbtQwYP1SkkK1HlAckSnevT59REkSMfPwulViaspoop5N1rZEvBfKwYLEpuX8L',
    timeout: 30000,
    enableRateLimit: true,
    rateLimit: 10000
//  'verbose': false, // set to true to see more debugging output,
//  'options': { 'defaultType': 'future', },
//  'url': 'wss://fstream.binance.com/ws',
});

const askBindsMy = async (symbol = 'ETH/USDT') => {
    async function tick (binance) {
        const response = await binance.fetchOrderBook (symbol);
        return response;
    }
        const result = await tick(binance);
       // console.log(result.asks);

        const minBids = result.bids[result.bids.length - 1];
        const maxBids = result.bids[0];

        const maxMinBinds = 'Max : '+ maxBids + ' ------ Min : ' + minBids;

        const minAsks = result.asks[result.asks.length - 1];
        const maxAsks = result.asks[0];

        const maxMinAsks = 'Max : '+ maxAsks + ' ------ Min : ' + minAsks;

        return { maxMinBinds, maxMinAsks};
}

//Amount & Price Formatted  // amount in base currency BTC  // price in quote currency USDT
const amountPriceFormatted = async (symbol = 'ETH/USDT', amount = '1.2345678', price = '87654.321') => {
    await binance.loadMarkets ()
    const formattedAmount = binance.amountToPrecision (symbol, amount)
    const formattedPrice = binance.priceToPrecision (symbol, price)
    return {formattedAmount, formattedPrice}
}

//Loading Markets
const LoadMarkets = async () => {
    let result = await binance.load_markets ()
    return result;
}

//Loading Market
const LoadMarket = async (marketName = 'ETH/USDT') => {
    await binance.loadMarkets ()
    const result = await binance.markets[marketName]      
    return result;
}

//Hesaptaki Coinler
const getAccountBalance = async () => {
    try {
        // fetch account balance from the exchange
        let binanceBalance = await binance.fetchBalance ()

        // output the result
        // console.log (binance.name, 'balance', binanceBalance)

        const coinKeys = Object.keys(binanceBalance.free);

        let result = [];
        coinKeys.forEach( keys => {
            if (binanceBalance.free[keys] > 0) {

                const coin = {
                [keys]: {
                        free: binanceBalance.free[keys],
                        used: binanceBalance.used[keys],
                        total: binanceBalance.total[keys]
                    }
                }

                result.push(coin);

                // result.push('Free ' + keys + ' ' + binanceBalance.free[keys] + ' ' + 
                // 'Used ' + keys + ' ' + binanceBalance.used[keys] + ' ' +
                // 'Total ' + keys + ' ' + binanceBalance.total[keys] )
            }
        })
        return result
    } catch (e) {

        if (e instanceof ccxt.DDoSProtection || e.message.includes ('ECONNRESET')) {
            return '[DDoS Protection] ' + e.message
        } else if (e instanceof ccxt.RequestTimeout) {
            return '[Request Timeout] ' + e.message
        } else if (e instanceof ccxt.AuthenticationError) {
            return '[Authentication Error] ' + e.message
        } else if (e instanceof ccxt.ExchangeNotAvailable) {
            return '[Exchange Not Available Error] ' + e.message
        } else if (e instanceof ccxt.ExchangeError) {
            return '[Exchange Error] ' + e.message
        } else if (e instanceof ccxt.NetworkError) {
            return '[Network Error] ' + e.message
        } else {
            throw e;
        }
    }
}

// Para Yatırma İşlemlerini getir 
const getDeposits = async (exchange = binance) => {

    await exchange.loadMarkets ()

    // exchange.verbose = true // uncomment for debugging

    const ninetyDays = 90 * 24 * 60 * 60 * 1000;
    let startTime = exchange.parse8601 ('2018-01-01T00:00:00')
    const now = exchange.milliseconds ()
    const currencyCode = undefined // any currency

    let allTransactions = []

    while (startTime < now) {

        const endTime = startTime + ninetyDays

        const transactions = await exchange.fetchDeposits (currencyCode, startTime, undefined, {
                'endTime': endTime,
        })
        if (transactions.length) {
            const lastTransaction = transactions[transactions.length - 1]
            startTime = lastTransaction['timestamp'] + 1
            allTransactions = allTransactions.concat (transactions)
        } else {
            startTime = endTime;
        }
    }

    console.log ('Fetched', allTransactions.length, 'transactions')

    // for (let i = 0; i < allTransactions.length; i++) {
    //     const transaction = allTransactions[i]
    //     console.log(i, transaction['datetime'], transaction['txid'], transaction['currency'], transaction['amount'])
    // }
    return allTransactions;
}

//Teklif ve İstekler
const getOrderBook = async (symbol = 'ETH/USDT', limit = 100) => {
    const aggregateOrderBookSide = function (orderbookSide, precision = undefined) {
        const result = []
        const amounts = {}
        for (let i = 0; i < orderbookSide.length; i++) {
            const ask = orderbookSide[i]
            let price = ask[0]
            if (precision !== undefined) {
                price = ccxt.decimalToPrecision (price, ccxt.ROUND, precision, ccxt.TICK_SIZE)
            }
            amounts[price] = (amounts[price] || 0) + ask[1]
        }
        Object.keys (amounts).forEach (price => {
            result.push ([
                parseFloat (price),
                amounts[price]
            ])
        })
        return result
    }
    
    const aggregateOrderBook = function (orderbook, precision = undefined) {
        let asks = aggregateOrderBookSide(orderbook['asks'], precision)
        let bids = aggregateOrderBookSide(orderbook['bids'], precision)
        return {
            'asks': ccxt.sortBy (asks, 0),
            'bids': ccxt.sortBy (bids, 0, true),
            'timestamp': orderbook['timestamp'],
            'datetime': orderbook['datetime'],
            'nonce': orderbook['nonce'],
        };
    }
    

    await binance.loadMarkets ()
    
        // exchange.verbose = true // uncomment for verbose debug output
    
        // level 2 (default)
    const orderbook = await binance.fetchOrderBook(symbol, limit)
    
        // or level 3
        // const orderbook = await exchange.fetchOrderBook('BTC/USD', undefined, { 'level': 3 })
    
    const step = 0.5 // 0.01, 0.1, 0.5, 1.0, 2.5, 5.0, 10.0
    const result = aggregateOrderBook (orderbook, step);
    return result;
}

//Ortalaması alınmamış birleştirilmemiş sipariş defteri 
const orderBookL2 = async (exchange = binance, symbol = 'ETH/USDT') => {
    //birleştirilmemiş sipariş defteri 
    const ordersL2 = await exchange.fetchL2OrderBook (symbol, limit)
    console.log(ordersL2);
}

//order Book döngü Şipariş ve İstekler
const orderBookLoop = async (symbol = 'ETH/USDT') => {
    await binance.loadMarkets ()
    
    for (let i = 0; i < 2000; i++) {
        const orderbook = await binance.fetchOrderBook (symbol)
        
        console.log (new Date (), i, symbol, orderbook.asks[0], orderbook.bids[0])
    }
}

// En iyi teklif ve fiyatı almak 
const bestOrderBook = async (exchange = binance, symbol = 'ETH/USDT') => {
    const orderbook  = await exchange.fetchOrderBook (symbol)
    let bid = orderbook.bids.length ? orderbook.bids[0][0] : undefined
    let ask = orderbook.asks.length ? orderbook.asks[0][0] : undefined
    let spread = (bid && ask) ? ask - bid : undefined
    console.log (exchange.id, 'market price', { bid, ask, spread })
}

//Sipariş iptal etmek
const cancelOrderId = async (exchange = binance, order) => {
    if(order['remaining'] > 0) {
        const response = exchange.cancelOrder(order['id'])
        console.log(response);
        return response;
    }
}

const stopLimitCreateOrder = async (exchange = binance, symbol = 'ETH/USDT', orderType = 'limit', side = 'buy',
amount = 0.1, price = 100, params = { 'stopPrice': 100, 'type': 'stopLimit' }) => {
    while (true) {
        try {
            await exchange.loadMarkets ();
            break;
        } catch (e) {
            if (e instanceof ccxt.RequestTimeout)
            console.log (exchange.iso8601 (Date.now ()), e.constructor.name, e.message)
        }
    }

    try {
        const response = await exchange.createOrder (symbol, orderType, side, amount, price, params)
        console.log (response);
        console.log ('Succeeded');
    } catch (e) {
        console.log (exchange.iso8601 (Date.now ()), e.constructor.name, e.message)
        console.log ('Failed');
    }
}

//Limit Alış Satış İşlemi
const limitCreateOrder = async (exchange = binance, symbol = 'ETH/USDT', orderType = 'limit', side = 'sell', 
amount = 0.1, price = 10000) => {
    while (true) {
        try {
            await exchange.loadMarkets ();
            break;
        } catch (e) {
            if (e instanceof ccxt.RequestTimeout)
                console.log (exchange.iso8601 (Date.now ()), e.constructor.name, e.message)
        }
    }

    try {
        const response = await exchange.createOrder (symbol, orderType, side, amount, price);
        console.log (response);
        console.log ('Succeeded');

    } catch (e) {
        console.log (exchange.iso8601 (Date.now ()), e.constructor.name, e.message)
        console.log ('Failed');
    }
}



//Anında Markete Satmak
const marketCreateOrder = async (exchange = binance, symbol = 'ETH/USDT', orderType = 'market', side = 'buy', 
amount = 0.2, price = 100) => {
    if(exchange.has['createMarketOrder']) {
        const result = exchange.createOrder(symbol, orderType, side, amount, price)
        console.log(result);
    }
}

const noLoadMarketCreate = async (exchange = binance, symbol = 'ETH/USDT', orderType = 'limit', side = 'buy', 
amount = 0.1, price = 100, params = {}) => {
    const tryToCreateOrder = async function (exchange, symbol, orderType, side, amount, price, params) {
        try {
            const order = await exchange.createOrder (symbol, orderType, side, amount, price, params)
            return order
        } catch (e) {
            console.log (e.constructor.name, e.message)
            if (e instanceof ccxt.NetworkError) {
                // retry on networking errors
                return false
            } else {
                throw e // break on all other exceptions
            }
        }
    }

    let order = false
    while (true) {
        order = await tryToCreateOrder (exchange, symbol, orderType, side, amount, price, params)
        if (order !== false) {
            break
        }
    }
    console.log (order)
}

//Ticaret Çifti Detaylı Bilgi
const marketInfo = async (exchange = binance, symbol = 'ETH/USDT') => {
    await exchange.loadMarkets ()
    const fee = await exchange.markets[symbol];
    console.log(fee);
}

//Ticaret Alıcı Yapısı Komisyonu
const marketTakerMakerFee = async (exchange = binance, symbol = 'ETH/USDT', takerOrMaker = 'maker') => {
    await exchange.loadMarkets ()
    const fee = await exchange.markets[symbol][takerOrMaker];
    console.log(fee);
}

//Ticaret Komisyonu
const getFee = async (exchange = binance, symbol = 'ETH/USDT') => {
    const trades = (await exchange.fetchTradingFees())[symbol]
    console.log(trades)
}

//Borsadan Çıkma Komisyonu
const getWithdrawFee = async (exchange = binance, code = 'ETH') => {
    const transactions = (await exchange.fetchFundingFees()).info[code]
    //.withdraw[code]
    console.log(transactions)
}

const loadSymbolsFetchTicker = (symbols = ['BTC/USDT', 'ETH/USDT']) => {
    const exchange = new ccxt.binance ({
        'enableRateLimit': true,
        'verbose': process.argv.includes ('--verbose'),
    })
    
    let printTickersAsTable = function (exchange, tickers) {
        log (exchange.id.green, exchange.iso8601 (exchange.milliseconds ()))
        log ('Fetched', Object.values (tickers).length.toString ().green, 'tickers:')
        log (asTable (ccxt.sortBy (Object.values (tickers), 'symbol', false)))
    }
    
    async function fetchAllAndPrint () {
        const tickers = await exchange.fetchTickers ()
        log ('---------------------------------------- fetchTickers ----------------------------------------')
        printTickersAsTable (exchange, tickers)
    }
    
    async function fetchOneByOneAndPrint () {
        const markets = await exchange.loadMarkets ()
      //  const symbols = Object.keys (markets)
        const tickers = []
    
        log ('---------------------------------------- fetchTicker (one by one) ----------------------------------------')
    
        for (let i = 0; i < symbols.length; i++) {
            const ticker = await exchange.fetchTicker (symbols[i])
            log (ticker)
            tickers.push (ticker)
            log (`${i+1} / ${symbols.length}`)
            log ('\u001b[1A'.repeat (2))  // cursor up
        }
        
        printTickersAsTable (exchange, tickers)
    }
    
    ;(async () => {
       // await fetchAllAndPrint ()
       // log ('\n')
        await fetchOneByOneAndPrint ()
    }) ()
}

//Şuanki Bilgileri getir Değişimde 1 günlük baz alınıyor
const fetchTickerInfoOneDay = async (exchange = binance, symbol = 'ETH/USDT') => {
    //if(Array.isArray(symbol)) 
    //    ticker  = await exchange.fetchTickers  (symbol)
    //else 
    //    ticker  = await exchange.fetchTicker  (symbol)
    try {
        const response = await exchange.fetchTicker (symbol)
        const tickerInfo = {
            symbol: response.symbol,
            timestamp: response.timestamp,
            datetime: response.datetime,
            high24H: response.high,
            low24H: response.low,
            bid: response.bid,
            ask: response.ask,
            weightedAvgPrice: response.info.weightedAvgPrice,
            open: response.open,
            close: response.close,
            previousClose: response.previousClose,
            change: response.change,
            percentage: response.percentage
        }

        return tickerInfo
    } catch (e) {
        // if the exception is thrown, it is "caught" and can be handled here
        // the handling reaction depends on the type of the exception
        // and on the purpose or business logic of your application
        if (e instanceof ccxt.NetworkError) {
            console.log (exchange.id, 'fetchTicker failed due to a network error:', e.message)
            // retry or whatever
            // ...
        } else if (e instanceof ccxt.ExchangeError) {
            console.log (exchange.id, 'fetchTicker failed due to exchange error:', e.message)
            // retry or whatever
            // ...
        } else {
            console.log (exchange.id, 'fetchTicker failed with:', e.message)
            // retry or whatever
            // ...
        }
    }
}

//Karma işlemler
const manyTransactions = async (exchange = binance, symbol = 'ETH/USDT', day = 1) => {
    const nowDate = new Date(Date.now());
 //   const oneHourAgo = Math.floor(nowDate - (1000 * 60 * 60));
    console.log(nowDate)
  //  console.log((new Date(nowDate)).toUTCString());
   // Markets data
   const markets = await exchange.fetchMarkets ()
   console.log('Total number of markets: ', Object.keys(markets).length);

   // Currencies
   const currencies = await exchange.fetchCurrencies()
   console.log('Currencies: ', JSON.stringify(currencies));

   // Order book data
   const orderbook = await exchange.fetchOrderBook (symbol)
   console.log ('Order book ', symbol, orderbook.asks[0], orderbook.bids[0])
   
   // Ticker
   const ticker = await exchange.fetchTicker (symbol)
   console.log ('Ticker ', symbol, " bid ", ticker.bid, " ask ", ticker.ask)

   // Trades
   let since = exchange.milliseconds () - (86400000 * day) // -1 day from now
   const response = await exchange.fetchTrades (symbol, since)
   console.log (asTable (response))

   // OHLC data
   const candles = await exchange.fetchOHLCV (symbol, '1m', undefined, 10);
   const first = candles[0]
   const last = candles[candles.length - 1]
   console.log (
       'Fetched', candles.length, symbol, 'candles',
       'from', exchange.iso8601 (first[0]),
       'to', exchange.iso8601 (last[0])
   )
}

//Geçmiş ticaretleri getir 
const getFetchTrades = async (exchange = binance, symbol = 'ETH/USDT', limit = 20)  => {
    if (exchange.has['fetchTrades']) {
        let since = exchange.milliseconds () - 86400000 // -1 day from now
        // alternatively, fetch from a certain starting datetime
        // let since = exchange.parse8601 ('2018-01-01T00:00:00Z')
        let allTrades = []
        console.log(exchange.milliseconds ());
        while (since < exchange.milliseconds ()) {
           // const symbol = undefined // change for your symbol
            limit = limit // change for your limit
            const trades = await exchange.fetchTrades (symbol, since, limit)
            if (trades.length) {
                since = trades[trades.length - 1]['timestamp']
                allTrades = allTrades.concat (trades)
            } else {
                break
            }
            since++
        }
    }
}

//Komisyonları getir
const tradingFees = async (exchange = binance) => {
    let tradingFees = await exchange.fetchTradingFees()
            console.log('tradingFees', tradingFees)
            let fundingFees = await exchange.fetchFundingFees()
            console.log('fundingFees', fundingFees)
}

const universalTransfer = async (exchange = binance) => {
    console.log (await exchange.transfer ('USDT', 1, 'spot', 'future'))
    const transfers = await exchange.fetchTransfers ();
    console.log ('got ', transfers.length, ' transfers')
    console.log (await exchange.transfer ('USDT', 1, 'spot', 'margin'))

    // binance requires from and to in the params
    console.log (await exchange.fetchTransfers (undefined, undefined, { from: 'spot', to: 'margin' }))

    // alternatively the same effect as above
    console.log (await exchange.fetchTransfers (undefined, undefined, { type: 'MAIN_MARGIN' })) // defaults to MAIN_UMFUTURE
}

const serverTimeTest = async ( exchange = binance) => {
    const recvWindow = exchange.options.recvWindow
    const aheadWindow = 1000

    const localStartTime = Date.now ()
    const { serverTime } = await exchange.publicGetTime ()
    const localFinishTime = Date.now ()
    const estimatedLandingTime = (localFinishTime + localStartTime) / 2

    const diff = serverTime - estimatedLandingTime

    log (`request departure time:     ${exchange.iso8601 (localStartTime)}`)
    log (`response arrival time:      ${exchange.iso8601 (localFinishTime)}`)
    log (`server time:                ${exchange.iso8601 (serverTime)}`)
    log (`request landing time (est): ${exchange.iso8601 (estimatedLandingTime)}, ${Math.abs (diff)} ms ${Math.sign (diff) > 0 ? 'behind' : 'ahead of'} server`)
    log ('\n')

    if (diff < -aheadWindow) {
        log.error.red (`your request will likely be rejected if local time is ahead of the server's time for more than ${aheadWindow} ms \n`)
    }

    if (diff > recvWindow) {
        log.error.red (`your request will likely be rejected if local time is behind server time for more than ${recvWindow} ms\n`)
    }
}

const simpleOHLCV = async (exchange = binance, symbol = 'ETH/USDT', time = '15m', limit = 1000) => {
    const index = 4 // [ timestamp, open, high, low, close, volume ]

    
    const ohlcv = await exchange.fetchOHLCV (symbol, time)
    ohlcv.forEach(x => {
        console.log(new Date(parseInt(x[0])), 'Open Price:', x[1], 'Highest Price:', x[2], 'Lowest Price:',
         x[3], 'Closing Price:', x[4], 'Volume:', x[5])
    })
    


    const lastPrice = ohlcv[ohlcv.length - 1][index] // closing price
    const series = ohlcv.slice (-80).map (x => x[index])         // closing price
    const bitcoinRate = ('₿ = $' + lastPrice)
    const chart = asciichart.plot (series, { height: 15, padding: '            ' })
    console.log ("\n" + chart, bitcoinRate, "\n")
    process.exit ()
}

const OHLCV = async (exchange = binance, symbol = 'ETH/USDT', time = '1d', limit = 1000) => {
    const index = 4 // [ timestamp, open, high, low, close, volume ]

    
    const ohlcv = await exchange.fetchOHLCV (symbol, time)


    const lastPrice = ohlcv[ohlcv.length - 1][index] // closing price
    const series = ohlcv.slice (-80).map (x => x[index])         // closing price
    const bitcoinRate = ('₿ = $' + lastPrice)
    const chart = asciichart.plot (series, { height: 15, padding: '            ' })
    console.log ("\n" + chart, bitcoinRate, "\n")
    process.exit ()
}

const apiStatus = async (exchange = binance) => {
    const result = await binance.fetchStatus();
    console.log(result);
}

const credentialValidation = async (exchange = binance, symbol = 'ETH/USDT') => {
    console.log (exchange.requiredCredentials) // prints required credentials
    const result = exchange.checkRequiredCredentials()
    console.log(result);
}

//id ye göre sipariş döndür
const orderId = async (exchange = binance, orderId) => {
    const result = await exchange.fetchOrder(orderId);
    console.log(result);
}

//Çalışmıyor gibi şuan açık siparişleri getir 
const openOrders = async (exchange = binance, symbol = 'ETH/USDT', day = 1, hours = 24, limit = undefined) => {
    const dateNow = Date.now();
    const result = await exchange.fetchOpenOrders (symbol, dateNow - day * hours * 60 * 60 * 1000, limit);
    console.log(result);
}

//kapanan siparişleri getir
const closedOrders = async (exchange = binance, symbol = 'ETH/USDT', day = 1, hours = 24, limit = undefined) => {
    const ress = await exchange.fetchClosedOrders (symbol, undefined, limit);
    console.log(ress);
}

//Walletı getir
const depositAddress = async (exchange = binance, symbol = 'ETH') => {
    const trades = await exchange.fetchDepositAddress (symbol)
    console.log(trades)
}

//Borsadan Coin Çıkar
const withDraww = async (exchange = binance, symbol = 'ETH', amount = 0.1, address = '', tag = undefined) => {
    const result = exchange.withdraw (symbol, amount, address, tag = undefined)
    console.log(result);

}

//Borsadan Coin Çıkarma işlemlerini getir
const fetchWithdrawalss = async (exchange = binance, symbol = 'ETH', day = 1, limit = 20) => {
    let since = exchange.milliseconds () - (86400000 * day)
    const trades = await exchange.fetchWithdrawals (symbol, since, limit)
    console.log(trades)
}

const limitSellOrder = async (exchange = binance, symbol = 'ETH/USDT', amount = 0.1, price = 6500) => {

}

const limitBuyOrder = async (exchange = binance, symbol = 'ETH/USDT', amount = 0.1, price = 500) => {
    
}


export { askBindsMy, getOrderBook, getDeposits, getAccountBalance, LoadMarket, LoadMarkets, 
    amountPriceFormatted, orderBookLoop, limitCreateOrder, marketCreateOrder, noLoadMarketCreate, marketTakerMakerFee, 
    loadSymbolsFetchTicker, manyTransactions, getFetchTrades, tradingFees, universalTransfer, serverTimeTest,
    OHLCV, orderBookL2, bestOrderBook, fetchTickerInfoOneDay, simpleOHLCV, apiStatus, credentialValidation, openOrders,
    orderId, closedOrders, depositAddress, getFee}