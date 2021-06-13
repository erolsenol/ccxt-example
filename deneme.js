import ccxt from 'ccxt'
import ansi from 'ansicolor'
import log from 'ololog'
import asTable from 'as-table'
import asciichart from 'asciichart'

ansi.nice;
log.noLocate
asTable.configure ({
        delimiter: ' | '.dim,
        right: true,
    })

//require ('ansicolor').nice

const binance = new ccxt.binance ({
    apiKey: 'DLkMYBwmTHoajAL25xa9LSAVrBXkrwTS87j6yf78TwqYYmLs4IT9HUQTVMwpxXlw',
    secret: 'NpsbtQwYP1SkkK1HlAckSnevT59REkSMfPwulViaspoop5N1rZEvBfKwYLEpuX8L',
    timeout: 30000,
    enableRateLimit: true,
    rateLimit: 10000,
    nonce () { return this.milliseconds () }
});

const testOrder = async ( exchange = binance ) => {
    const result = await binance.has['cancelOrder']
    console.log(result);
}


//Karma işlemler
const denemee = async (exchange = binance, symbol = 'ETH/USDT', takerOrMaker = 'maker') => {
    try {
        const sandBox = exchange.setSandboxMode(true)

        const response = await exchange.fetchTicker(symbol)
        console.log(response)

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

        console.log(tickerInfo)

        console.log('Open Time:', new Date(parseInt(response.info.openTime)), 'Close Time:', 
        new Date(parseInt(response.info.closeTime)), 'Current Time:', 
        new Date(response.timestamp))

        console.log(sandBox)
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

const deneme = async (exchange = binance, symbol = 'ETH/USDT', time = '5m') => {
    const index = 4 // [ timestamp, open, high, low, close, volume ]
    
    const ohlcv = await exchange.fetchOHLCV (symbol, time)
    let highestA = []
    let lowestA = []

    ohlcv.forEach(x => {
        highestA.push(x[2]);
        lowestA.push(x[3]);
        console.log(new Date(parseInt(x[0])), 'Open Price:', x[1], 'Highest Price:', x[2], 'Lowest Price:',
         x[3], 'Closing Price:', x[4], 'Volume:', x[5])
    })
    let highestP = Math.max(...highestA);
    let lowestP =  Math.min(...lowestA);

    const first = ohlcv[0]
    const last = ohlcv[ohlcv.length - 1]
    console.log (
        'Fetched', ohlcv.length, symbol, 'candles',
        'from', exchange.iso8601 (first[0]),
        'to', exchange.iso8601 (last[0])
    )

    console.log('Top Highest Price:', highestP, ' Top LowestPrice:', lowestP);

    const lastPrice = ohlcv[ohlcv.length - 1][index] // closing price
    const series = ohlcv.slice (-80).map (x => x[index])         // closing price
    const bitcoinRate = ('₿ = $' + lastPrice)
    const chart = asciichart.plot (series, { height: 15, padding: '            ' })
    console.log ("\n" + chart, bitcoinRate, "\n")
    process.exit ()
}

const denemeee = async (exchange = binance, symbol = 'ETH/USDT', time = '5m', since = undefined, limit = undefined) => {
    limit = 25;
    const ohlcv = await exchange.fetchOHLCV (symbol, time, since, limit)

    console.log(new Date(parseInt(ohlcv[4][0])), ohlcv[4])
    console.log(new Date(parseInt(ohlcv[3][0])), ohlcv[3])
    console.log(new Date(parseInt(ohlcv[2][0])), ohlcv[2])
    console.log(new Date(parseInt(ohlcv[1][0])), ohlcv[1])
    console.log(new Date(parseInt(ohlcv[0][0])), ohlcv[0])

    console.log(ohlcv.length);

    let startAndFinishAv = 0
    for(let x = ohlcv.length - 1; x >= 0; x--) {
        let Av = Number((((100 / ohlcv[x][1]) * ohlcv[x][4]) - 100).toFixed(4))
        startAndFinishAv += Av
        
        console.log(new Date(parseInt(ohlcv[x][0])), 'Open Price:', ohlcv[x][1], 'Closing Price:', 
        ohlcv[x][4], 'Volume:', ohlcv[x][5], 'Avarage Chance:', Av , '▽', startAndFinishAv)
   
       // console.log(new Date(parseInt(ohlcv[x][0])), 'Open Price:', ohlcv[x][1], 'Highest Price:', ohlcv[x][2], 'Lowest Price:',
       // ohlcv[x][3], 'Closing Price:', ohlcv[x][4], 'Volume:', ohlcv[x][5], 'Avarage Chance:', Av)
    }

    let percentChange = []
    let allAvarage = 0

    ohlcv.forEach(item => {
        allAvarage += item[1] + item[4]
    })

    console.log("Total:", allAvarage, "Avarage:", Number((allAvarage / (ohlcv.length * 2)).toFixed(2)));
    
    //ohlcv.forEach(x => {
    //    console.log(new Date(parseInt(x[0])), 'Open Price:', x[1], 'Highest Price:', x[2], 'Lowest Price:',
    //     x[3], 'Closing Price:', x[4], 'Volume:', x[5])
    //})
}

//Geçmiş İşlemler
const getDepositss = async () => {

    const exchange = binance;

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
    for (let i = 0; i < allTransactions.length; i++) {
        const transaction = allTransactions[i]
        console.log (i, transaction['datetime'], transaction['txid'], transaction['currency'], transaction['amount'])
    }
}

export { deneme, denemee, denemeee, getDepositss, testOrder }