console.log('coinPriceObjects TODO: get common currencies from select');
var coinPriceObjects = { 
  BTC: { USD: 0, EUR: 0, ETH: 0, DASH:0, ZEC: 0},
  ETH: { USD: 0, EUR: 0, BTC: 0, DASH:0, ZEC: 0},
  DASH:{ USD: 0, EUR: 0, BTC: 0, ETH: 0, ZEC: 0},
  ZEC: { USD: 0, EUR: 0, BTC: 0, ETH: 0, DASH:0}
};  

function getCommonCurrenciesFromSelect(){

}

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
  $(this).closest('tr.asset').remove();
  updateGrandTotal();
})

function getDataFromApi(queryObject, callback) {
  var BASE_URL = 'https://min-api.cryptocompare.com/data/price';
  var query = { fsym: queryObject.fsym,
                tsyms: queryObject.tsymsArray.toString()       
              };
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
  var useMulti = true;
  if(useMulti){
    console.log('refreshPrices using Multi API BASE_URL to lookup all rows of added coins in a single call');
    lookupAllPricesAndDisplayThemInRows(function(){
      updateTotals();
    });
  }else{
    var priceIn = getPriceIn($('form'));
    $('form .asset').each(function(rowNumber){
      var htmlRow = $('form .asset')[rowNumber];
      var coin = getCoinFromRow(htmlRow);
      lookupPriceAndDisplayItInRow(coin, priceIn, htmlRow, rowNumber, function(){
        updateTotal(htmlRow);
      });
    }) 
    updateGrandTotal();
  } // end else
}
/*
var sampleMultiQueryObject = {
  fsyms: ['BTC', 'ETH', 'DASH', 'ZEC'],
  tsyms: ['USD', 'EUR']
};

getMultiDataFromApi(sampleMultiQueryObject, mergeMultiReturnedData);
*/
function lookupAllPricesAndDisplayThemInRows(callbackUpdateTotals){
  /* https://min-api.cryptocompare.com/data/pricemulti?fsyms=BTC,ETH,DASH,ZEC&tsyms=USD,EUR */
  var addedCoins = [];
  var priceIn = getPriceIn($('form'));
  $('form .asset').each(function(rowNumber){
    var htmlRow = $('form .asset')[rowNumber];
    var coin = getCoinFromRow(htmlRow);
    addedCoins.push(coin);
  });
  console.log('lookupAllPricesAndDisplayThemInRows TODO: get commonCurrenciesArray from select');
  var commonCurrenciesArray = Object.keys(coinPriceObjects["BTC"]);
  if(commonCurrenciesArray.indexOf(priceIn) === -1){ /*  */
    commonCurrenciesArray.push(priceIn);
  }
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
  console.log('mergeMultiReturnedData');
  console.log(multiReturnedData);
  var coinsToMergeArray = Object.keys(multiReturnedData);
  for (var i = 0; i < coinsToMergeArray.length; i++){
    var coin = coinsToMergeArray[i];
    var coinReturnedPrices = multiReturnedData[coin];
    console.log('coinReturnedPrices');
    console.log(coinReturnedPrices);
    var coinReturnedPriceInsArray = Object.keys(coinReturnedPrices);
    var price;
    var priceIn;
    for(var j = 0; j < coinReturnedPriceInsArray.length; j++){
      priceIn = coinReturnedPriceInsArray[j];
      price = multiReturnedData[coin][priceIn];
      coinPriceObjects[coin][priceIn] = price;
    }
    
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
  $(row).find('.price').html(price); // necessery when priceIn changes or for refresh, but not for qty change.
  $(row).find('.total').html(total);
}

function updateTotals(){ // including grandTotal
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
  console.log('getPrice TODO: get price from coinPriceObject for current priceIn');
  var coin = getCoinFromRow(row);
  var priceIn = getPriceIn($('form'));
  var price;
  if(coin === priceIn){
    price = 1;
  } else {
      var pricesForThisCoin = coinPriceObjects[coin];
      price = pricesForThisCoin[priceIn];
  }

  /*
  var price = $(row).find('td.price').html()
  */
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




