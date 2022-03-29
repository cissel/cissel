
const url = "wss://stream.data.alpaca.markets/v1beta1/crypto";
const socket = new WebSocket(url);

const auth = {
    
    "action": "auth", 
    "key": "AKGNBG6FMQEWRBELM45U", 
    "secret": "86eND4Pe8NJp4wNoBzkFGrS2PAvHo3UhOy4xAIlL"

}

const subscribe = {

    "action": "subscribe",
    "quotes": ["BTCUSD"],
    "trades": ["BTCUSD"],
    "bars": ["BTCUSD"]

}

const quotesElement = document.getElementById('quotes');
const tradesElement = document.getElementById('trades');

let currentBar = {};
let trades = [];

var chart = LightweightCharts.createChart(document.getElementById('chart'), {
	width: 1000,
    height: 515,
	layout: {
		backgroundColor: '#1c2e4a',
		textColor: '#ffffff',
	},
	grid: {
		vertLines: {
			color: '#274066',
		},
		horzLines: {
			color: '#274066',
		},
	},
	crosshair: {
		mode: LightweightCharts.CrosshairMode.Normal,
	},
	priceScale: {
		borderColor: '#cccccc',
	},
	timeScale: {
		borderColor: '#cccccc',
		timeVisible: true,
	},
});

var candleSeries = chart.addCandlestickSeries();

var start = new Date(Date.now() - (7200 * 1000)).toISOString();

console.log(start);

var bars_url = 'https://data.alpaca.markets/v1beta1/crypto/BTCUSD/bars?exchanges=CBSE&timeframe=1Min&start=' + start;

fetch(bars_url, {
    headers: {
        'APCA-API-KEY-ID': "AKGNBG6FMQEWRBELM45U",
        'APCA-API-SECRET-KEY': "86eND4Pe8NJp4wNoBzkFGrS2PAvHo3UhOy4xAIlL"
    }
}).then((r) => r.json())
    .then((response) => {
        console.log(response);
        
        const data = response.bars.map(bar => (
            {
                open: bar.o,
                high: bar.h,
                low: bar.l,
                close: bar.c,
                time: Date.parse(bar.t) / 1000
            }
        ));

        currentBar = data[data.length-1];

        console.log(data);

        candleSeries.setData(data);

    })

socket.onmessage = function(event) {

    const data = JSON.parse(event.data);
    const message = data[0]['msg']

    if (message == 'connected') {

        console.log('Start Authentication');
        socket.send(JSON.stringify(auth));

    }

    if (message == 'authenticated') {

        socket.send(JSON.stringify(subscribe));

    }

    for (var key in data) {

        const type = data[key].T;

        if (type == 'q') {

            console.log('New Quote');
            console.log(data[key]);

            const quoteElement = document.createElement('div');
            quoteElement.className = 'quote';
            quoteElement.innerHTML = `<b>${data[key].t}</b> // ASK: $${data[key].ap} // BID: $${data[key].bp}`
            quotesElement.appendChild(quoteElement);

            var elements = document.getElementsByClassName('quote');
            if (elements.length > 1) {
                quotesElement.removeChild(elements[0]);
            }

        }

        if (type == 't') {

            console.log('New Trade');
            console.log(data[key]);

            const tradeElement = document.createElement('div');
            tradeElement.className = 'trade';
            tradeElement.innerHTML = `<b>${data[key].t}</b> // $${data[key].p} // ${data[key].s} // ${data[key].x} // <b>${data[key].tks}`
            tradesElement.appendChild(tradeElement);

            var elements = document.getElementsByClassName('trade');
            if (elements.length > 21) {
                tradesElement.removeChild(elements[0]);
            }

            trades.push(data[key].p);
            
            var open = trades[0];
            var high = Math.max(...trades);
            var low = Math.min(...trades);
            var close = trades[trades.length - 1];

            console.log(open, high, low, close);

            candleSeries.update({
                time: currentBar.time + 60,
                open: open,
                high: high,
                low: low,
                close: close
            })
        }

        if (type == 'b' && data[key].x == 'CBSE') {
            console.log('got a new bar');
            console.log(data[key]);

            var bar = data[key];
            var timestamp = new Date(bar.t).getTime() / 1000;

            currentBar = {
                time: timestamp,
                open: bar.o,
                high: bar.h,
                low: bar.l,
                close: bar.c
            }

            candleSeries.update(currentBar);
            
            trades = [];
        

        }



    }

}
