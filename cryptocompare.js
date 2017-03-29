var coinPriceObjects = {};

function setCoins(){
  $('form select.coin option').each(function(index, option){
    var coinApiName = option.value;
    if (coinApiName === 'Add Coin'){return;} 
    coinPriceObjects[coinApiName] = {}; 
  });
}
setCoins();
setCommonCurrencies();

function getCommonCurrenciesFromSelect(){
  var commonCurrenciesWithPricesZeroedOut = {};
  $('form select.priceIn option').each(function(index, option){
    var priceIn = option.value;
    commonCurrenciesWithPricesZeroedOut[priceIn] = 0;
  });
  return commonCurrenciesWithPricesZeroedOut;
}

function setCommonCurrencies(){
  var commonCurrenciesWithPricesZeroedOut = getCommonCurrenciesFromSelect();
  for(coin in coinPriceObjects){
    coinPriceObjects[coin] = commonCurrenciesWithPricesZeroedOut;
  }
}

/* WHEN A NEW COIN IS ADDED */
$('form').on('change', 'select.coin', function(event){
  var newCoin = $('table').find('select.coin option:selected').val();   //get coin
  if(newCoin === 'Add Coin'){ return;}
  addRow(newCoin); // add row; later, add price via callback
  hideCoinInSelect(newCoin);
  var priceIn = getPriceIn();
  if(!coinPriceObjects[newCoin]){
    coinPriceObjects[newCoin] = getCommonCurrenciesFromSelect();
  }
  var priceIn = getPriceIn();
  if(newCoin == priceIn){
    lastObject[returnedPriceIn] = 1;
    displayPriceOfNewCoin(1);
  }
  var commonCurrenciesArray = Object.keys(coinPriceObjects[newCoin]);
  var queryObject = {fsym: newCoin, tsymsArray: commonCurrenciesArray}
  getDataFromApi(queryObject, updateNewCoinPrice.bind(null, newCoin));
});

function updateNewCoinPrice(newCoin, returnedData){
  coinPriceObjects[newCoin] = returnedData;
  displayPriceOfNewCoin(returnedData); // put price in last row of tbody
}

function displayPriceOfNewCoin(priceObject){
  var priceIn = getPriceIn();
  var price = priceObject[priceIn];
  $('.asset:last-child').find('.price').html(price.toFixed(2));  
}

function addRow(coin){
  var newRow = $('<tr class="asset"><td class="coin"> <span class="apiName"></span> <a href="#" class="delete" title="Delete this coin">X</a></td><td class="qty"><input class="qty" type="number" size="7" value="0"></td><td class="price">0</td><td class="total">0</td></tr>');
  newRow.find('.asset').addClass(coin);   //add class to row
  var coinLongName = lookupCoinLongName(coin);  //add long coin name
  newRow.find('.coin').prepend(coinLongName);   
  newRow.find('span.apiName').html(coin); //add coin apiName
  $('tbody').append(newRow); //ship new row
}

function lookupCoinLongName(coinApiName){
  return $('form select.coin option[value="' + coinApiName + '"]').html();
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

function getPriceIn(){
  var priceIn = $('form').find('select.priceIn option:selected').val();
  console.log('getPriceIn priceIn');
  console.log(priceIn);
  return priceIn;
}
 
/* WHEN PriceIn IS CHANGED */
$('form').on('change', 'select.priceIn', function(event){
  if($('form .asset')){
    updateTotals();
  }
});

function refreshPrices(){
  lookupAllPricesAndDisplayThemInRows(function(){
    updateTotals();
  });
}

function lookupAllPricesAndDisplayThemInRows(callbackUpdateTotals){  /* sample multi query: https://min-api.cryptocompare.com/data/pricemulti?fsyms=BTC,ETH,DASH,ZEC&tsyms=USD,EUR */
  var addedCoins = [];
  var priceIn = getPriceIn();
  $('form .asset').each(function(rowNumber){
    var htmlRow = $('form .asset')[rowNumber];
    var coin = getCoinFromRow(htmlRow);
    addedCoins.push(coin);
  });
  var commonCurrenciesArray = Object.keys(getCommonCurrenciesFromSelect());
  console.log('commonCurrenciesArray');
  console.log(commonCurrenciesArray);
  if(commonCurrenciesArray.indexOf(priceIn) === -1){  
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
  $.getJSON(BASE_URL, queryObject, callback);
}

function mergeMultiReturnedData(multiReturnedData){
  for(coin in multiReturnedData){
    var coinReturnedPrices = multiReturnedData[coin];
    for(priceIn in coinReturnedPrices){
      price = coinReturnedPrices[priceIn];
      coinPriceObjects[coin][priceIn] = price;
    }
  }
}

/* WHEN QTY IS CHAGGED */
$('table').on('keyup click', 'input.qty', function(event){
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
  console.log('updateTotal(row) coinPriceObjects');
  console.log(coinPriceObjects);
  var qty = getQty(row);
  var price = getPrice(row);
  var total = (qty * price).toFixed(2);
  $(row).find('.price').html(price); // necessery when priceIn changes or for refresh, but not for qty change.
  $(row).find('.total').html(total);
}

function updateTotals(){ // including grandTotal
  console.log('updateTotals coinPriceObjects');
  console.log(coinPriceObjects);
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
  var coin = getCoinFromRow(row);
  var priceIn = getPriceIn();
  if(coin === priceIn){ return 1;}
  var priceIn;
  var pricesForThisCoin = coinPriceObjects[coin];
  price = pricesForThisCoin[priceIn];
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
  //zeroOutCoinPriceObjects();
  refreshPrices();
})

function zeroOutCoinPriceObjects(){
  for(coin in coinPriceObjects){
    var thisCoinsPriceIns = coinPriceObjects[coin];
    for(priceIn in thisCoinsPriceIns){
      coinPriceObjects[coin][priceIn] = 0;
    }
  }
}




