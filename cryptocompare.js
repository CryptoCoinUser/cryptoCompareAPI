var coinPriceObjects = { 
  BTC: { USD: 0, EUR: 0, ETH: 0, DASH:0, ZEC: 0},
  ETH: { USD: 0, EUR: 0, BTC: 0, DASH:0, ZEC: 0},
  DASH:{ USD: 0, EUR: 0, BTC: 0, ETH: 0, ZEC: 0},
  ZEC: { USD: 0, EUR: 0, BTC: 0, ETH: 0, DASH:0}
};
var priceArray = []; // (DEPRECATING) coin prices in the order they were added (will have to remove one on delete)
var coinLongNames = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  DASH:'DASH',
  ZEC: 'ZCash'
}

/* WHEN A NEW COIN IS ADDED */
$('form').on('change', 'select.coin', function(event){
  //get coin
  var newCoin = $('table').find('select.coin option:selected').val();
  if(newCoin != 'Add Coin'){
    addRow(newCoin); // add row; later, add price via callback
    hideCoinInSelect(newCoin);
    var priceIn = getPriceIn($('form'));
    // TODO: setInterval to refresh or update on change in qty
    if(!coinPriceObjects[newCoin]){
      coinPriceObjects[newCoin] = { USD: 0, EUR: 0, BTC: 0, ETH: 0, DASH:0, ZEC: 0};
    }
    var priceIn = getPriceIn($(this).closest('form'));
    if(newCoin == priceIn){
      lastObject[returnedPriceIn] = 1;
      displayPriceOfNewCoin(1);
    }
    var commonCurrenciesArray = Object.keys(coinPriceObjects[newCoin]);
    var queryObject = { fsym: newCoin, tsymsArray: commonCurrenciesArray}
    getDataFromApi(queryObject, updateNewCoinPrice.bind(null, newCoin));
  } // end if newCoin != 'Add Coin'
});

function updateNewCoinPrice(newCoin, returnedData){
  coinPriceObjects[newCoin] = returnedData;
  displayPriceOfNewCoin(returnedData); // put price in last row of tbody
}

function displayPriceOfNewCoin(priceObject){
  var priceIn = getPriceIn('form');
  var wantedPrice = priceObject[priceIn];
  $('.asset:last-child').find('.price').html(wantedPrice.toFixed(2));  
}

function addRow(coin){
  var newRow = $('<tr class="asset"><td class="coin"> <span class="apiName"></span> <a href="#" class="delete" title="Delete this coin">X</a></td><td class="qty"><input class="qty" type="text" size="7" value="0"></td><td class="price">0</td><td class="total">0</td></tr>');
  newRow.find('.asset').addClass(coin);   //add class to row
  var coinLongName = lookupCoinLongName(coin);  //add long coin name
  newRow.find('.coin').prepend(coinLongName);   
  newRow.find('span.apiName').html(coin); //add coin apiName
  $('tbody').append(newRow); //ship new row
}

function lookupCoinLongName(coinApiName){
  var coinLongName = coinLongNames[coinApiName]
  return coinLongNames[coinApiName];
}

function hideCoinInSelect(newCoin){
  $('form').find('select.coin option[value="' + newCoin + '"]').prop("disabled", true);
  $('form').find('select.coin option[value="' + newCoin + '"]').css("display", "none");
}
function unhideCoinInSelect(deletedCoin){
  $('table thead').find('select.coin option[value="' + deletedCoin + '"]').prop("disabled", false);
  $('table thead').find('select.coin option[value="' + deletedCoin + '"]').css("display", "block");
}

$('table tbody').on('click', 'a.delete', function(event){
  event.preventDefault();
  event.stopPropagation();
  var coin = $(this).closest('tr.asset').find('span.apiName').html();
  unhideCoinInSelect(coin);
  var NthCoin = $(this).closest('tr.asset').index();
  //removeCoinFromPriceArray(NthCoin);
  $(this).closest('tr.asset').remove();
  updateGrandTotal();
})

function getDataFromApi(queryObject, callback) {
  var BASE_URL = 'https://min-api.cryptocompare.com/data/price';
  var query = { fsym: queryObject.fsym,
                tsyms: queryObject.tsymsArray.toString()       
              };
              console.log('getDataFromApi');
              console.log(queryObject.tsymsArray);
  $.getJSON(BASE_URL, query, callback);
}

function getCoinFromRow(row){
	var coin;
	coin = $(row).find('td.coin span.apiName').html();
  return coin;
}

function getPriceIn(form){
  var priceIn = $('form').find('select.priceIn option:selected').val();
  return priceIn;
}

function lookupPriceAndDisplayItInRow(coin, priceIn, htmlRow, rowNumber, callbackUpdateTotal){
  var price;
  if(coinPriceObjects[coin][priceIn]){
    price = coinPriceObjects[coin][priceIn];
    $(htmlRow).find('.price').html(price);
    callbackUpdateTotal();
  } else if(coin == priceIn){ // API returns only {} for fsym=BTC&tsyms=BTC, instead of {"BTC": 1}
     $(htmlRow).find('.price').html(1);
     coinPriceObjects[coin][priceIn] = 1;
  } else{ 
    console.log('lookupPriceAndDisplayItInRow else called');
    var commonCurrenciesArray = Object.keys(coinPriceObjects[coin]);
    if(commonCurrenciesArray.indexOf(priceIn) === -1){ /*  */
      commonCurrenciesArray.push(priceIn);
    }
    console.log(commonCurrenciesArray);
  	var queryObject = { fsym: coin,	tsymsArray: [commonCurrenciesArray]} 
  	getDataFromApi(queryObject, extractPriceAndDisplayItInRow);
  	function extractPriceAndDisplayItInRow(returnedData){
      console.log('extractPriceAndDisplayItInRow returnedData');
      console.log(returnedData);
      coinPriceObjects[coin] = returnedData
      callbackUpdateTotal();
    }
  }
}

/* WHEN PriceIn IS CHANGED */
$('form').on('change', 'select.priceIn', function(event){
  if($('form .asset')){
    refreshPrices();
    /*updateTotals();*/ 
  }
});

function refreshPrices(){
  
  var priceIn = getPriceIn($('form'));
  $('form .asset').each(function(rowNumber){
    var htmlRow = $('form .asset')[rowNumber];
    var coin = getCoinFromRow(htmlRow);
    lookupPriceAndDisplayItInRow(coin, priceIn, htmlRow, rowNumber, function(){
      updateTotal(htmlRow);
    });
  }) 
     updateGrandTotal();
  /*
  console.log('refreshPrices using Multi API BASE_URL to lookup all rows of added coins in a single call');
  lookupAllPricesAndDisplayThemInRows(function(){
      updateTotals();
    });
  */
}
/*
var sampleMultiQueryObject = {
  fsyms: ['BTC', 'ETH', 'DASH', 'ZEC'],
  tsyms: ['USD', 'EUR', 'BTC', 'ETH', 'DASH', 'ZEC']
};

getMultiDataFromApi(sampleMultiQueryObject, mergeMultiReturnedData);
*/
/* to optimize refreshPrices() */
function lookupAllPricesAndDisplayThemInRows(callbackUpdateTotals){
  /* https://min-api.cryptocompare.com/data/pricemulti?fsyms=BTC,ETH,DASH,ZEC&tsyms=USD,EUR,BTC,ETH,DASH,ZEC */
  var addedCoins = [];
  var priceIn = getPriceIn($('form'));
  $('form .asset').each(function(rowNumber){
    var htmlRow = $('form .asset')[rowNumber];
    var coin = getCoinFromRow(htmlRow);
    addedCoins.push(coin);
  });
  var commonCurrenciesArray = Object.keys(coinPriceObjects["BTC"]);
  var multiQueryObject = {
    fsyms: addedCoins, 
    tsyms: commonCurrenciesArray
  };

    getMultiDataFromApi(multiQueryObject, mergeMultiReturnedData);
    callbackUpdateTotals();
}

function getMultiDataFromApi(multiQueryObject, callback) {
  var BASE_URL = 'https://min-api.cryptocompare.com/data/pricemulti';
  var queryObject = { fsyms: multiQueryObject.fsyms.toString(),
                tsyms: multiQueryObject.tsyms.toString()       
              };
              console.log('getMultiDataFromApi');
              console.log(multiQueryObject.fsyms);
              console.log(multiQueryObject.tsyms);
  $.getJSON(BASE_URL, queryObject, callback);
}

function mergeMultiReturnedData(multiReturnedData){
  console.log('mergeMultiReturnedData TODO: merge coinPriceObjects and multiReturnedData, do not overwrite');
  console.log(multiReturnedData);
  var coinsToMergeArray = Object.keys(multiReturnedData);
  for (var i = 0; i < coinsToMergeArray.length; i++){
    var coin = coinsToMergeArray[i];
    var coinReturnedPrices = multiReturnedData.coin;
    coinPriceObjects.coin = coinReturnedPrices;
  }
  //coinPriceObjects = multiReturnedData;
}

/* WHEN QTY IS CHAGGED */
$('table').on('keyup', 'input.qty', function(event){
  event.preventDefault();
  event.stopPropagation();
  var thisRow = $(this).closest('.asset');
  updateTotal(thisRow);
  updateGrandTotal();
});

function updateGrandTotal(){ // without re-calculating each row's total
  var grandTotal = 0;
  $('form .asset').each(function(rowNumber){
    var htmlRow = $('form .asset')[rowNumber];
    var total = Number(getTotal(htmlRow));
    grandTotal += total;
  })
  $('.grandTotal').html(grandTotal.toFixed(2));
}

function updateTotal(row){
  var qty = getQty(row);
  var price = getPrice(row);
  var total = (qty * price).toFixed(2);
  $(row).find('td.total').html(total);
}

function updateTotals(){ // including grandTotal
  console.log('updateTotals called');
  var grandTotal = 0;
  $('form .asset').each(function(rowNumber){
    var htmlRow = $('form .asset')[rowNumber];
    updateTotal(htmlRow);
    var total = getTotal(htmlRow);
    grandTotal += total;
  })
  $('.grandTotal').html(grandTotal.toFixed(2));
}

function getQty(row){
  var qty = $(row).find('input.qty').val();
  return qty;
}
function getPrice(row){
  var price = $(row).find('td.price').html()
  return price;
}
function getTotal(row){
  var total = $(row).find('.total').html();
  if(!total){
    total = updateTotal(row);
  }
  return Number(total);
}

$('form').on('click', '#refresh', function(event){
  event.preventDefault();
  event.stopPropagation();
  zeroOutCoinPriceObjects();
  refreshPrices();
})

function zeroOutCoinPriceObjects(){
  //console.log('zeroOutCoinPriceObjects')
  coinsToZeroOutArray = Object.keys(coinPriceObjects);
  //console.log('coinsToZeroOut.length');
  //console.log(coinsToZeroOutArray.length);
  for(var i = 0; i < coinsToZeroOutArray.length; i++){
    var thisCoinsPriceIns = coinPriceObjects[coinsToZeroOutArray[i]];
    //console.log('thisCoinsPriceIns');
    //console.log(thisCoinsPriceIns);
    var priceInsToZeroOutArray = Object.keys(thisCoinsPriceIns);
    for(var j = 0; j < priceInsToZeroOutArray.length; j++){
      coinPriceObjects[coinsToZeroOutArray[i]][priceInsToZeroOutArray[j]] = 0;
    }
  }
}




