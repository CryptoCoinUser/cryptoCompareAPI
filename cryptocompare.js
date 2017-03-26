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
  addRow(newCoin); // add row and add price later with callback
  removeCoinFromSelect(newCoin); // so the same coin cannot be added twice
  var priceIn = getPriceIn($('form'));
  // TODO: setInterval to refresh or update on change in qty
  if(!coinPriceObjects[newCoin]){
    coinPriceObjects[newCoin] = { USD: 0, EUR: 0, BTC: 0, ETH: 0, DASH:0, ZEC: 0};
  }
  /* var newCoinObject = {coinKey: newCoin}
  newCoinObject[priceIn] = 0; 
  priceArray.push(newCoinObject); */
  var priceIn = getPriceIn($(this).closest('form'));
  if(newCoin == priceIn){
    lastObject[returnedPriceIn] = 1;
    displayPriceOfNewCoin(1);
  }
  var priceInCurrenciesArray = Object.keys(coinPriceObjects[newCoin]);
  var queryObject = { fsym: newCoin, tsymsArray: priceInCurrenciesArray}
  getDataFromApi(queryObject, updateNewCoinPrice.bind(null, newCoin));
});

function updateNewCoinPrice(newCoin, returnedData){
  console.log(returnedData);
  coinPriceObjects[newCoin] = returnedData;



  /*
  var returnedDataKeysArray = Object.keys(returnedData);
  var returnedPriceIn = returnedDataKeysArray[0];
  returnedPrice = returnedData[returnedPriceIn];
  
  var lastIndex = priceArray.length - 1;
  var lastObject = priceArray[lastIndex];
  var coin = lastObject['coinKey'];
  lastObject[returnedPriceIn] = returnedPrice; 
  */
  displayPriceOfNewCoin(returnedData); // put price in last row of tbody
}

function displayPriceOfNewCoin(priceObject){
  var priceIn = getPriceIn('form');
  var wantedPrice = priceObject[priceIn];
  console.log(wantedPrice);
  $('.asset:last-child').find('.price').html(wantedPrice.toFixed(2));  
}

function addRow(coin){
  var newRow = $('<tr class="asset"><td class="coin"> <span class="apiName"></span> <a href="#" class="delete">delete</a></td><td class="qty"><input class="qty" type="text" size="7" value="0"></td><td class="price">0</td><td class="total">0</td></tr>');
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

function removeCoinFromSelect(newCoin){
  $('table').find('select.coin option:selected').remove();
}

$('table tbody').on('click', 'a.delete', function(event){
  event.preventDefault();
  event.stopPropagation();
  var coin = $(this).closest('tr.asset').find('span.apiName').html();
  addCoinToSelect(coin);
  var NthCoin = $(this).closest('tr.asset').index();
  //removeCoinFromPriceArray(NthCoin);
  $(this).closest('tr.asset').remove();
  updateGrandTotal();
})
/*
function removeCoinFromPriceArray(NthCoin){
  priceArray = priceArray.splice(NthCoin,1);
}
*/

function addCoinToSelect(coin){
  console.log('addCoinToSelect TODO optimization: insert the option in A-Z order, so its place does not chagne while coins are added and deleted');
  var coinLongName = lookupCoinLongName(coin);
  $('table thead').find('select.coin').append('<option value="' + coin + '">' + coinLongName + '</option>');
}


function getDataFromApi(queryObject, callback) {
  var BASE_URL = 'https://min-api.cryptocompare.com/data/price';
  var query = { fsym: queryObject.fsym,
                tsyms: queryObject.tsymsArray.toString()       
              }
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
  	var queryObject = { fsym: coin,	tsymsArray: [priceIn]} // TODO: to optimize, add the common priceIns as well
  	getDataFromApi(queryObject, extractPriceAndDisplayItInRow);
  	function extractPriceAndDisplayItInRow(returnedData){
      var returnedDataKeysArray = Object.keys(returnedData);
      var returnedPriceIn = returnedDataKeysArray[0];
      returnedPrice = returnedData[returnedPriceIn];
      $(htmlRow).find('.price').html(returnedPrice);
      //assuming this coin does not have this priceIn price OR it needs to be updated
      coinPriceObjects[coin][priceIn] = returnedPrice;
      callbackUpdateTotal();
    }
  }
}

/* WHEN PriceIn IS CHANGED */
$('form').on('change', 'select.priceIn', function(event){
  if($('form .asset')){
    refreshPrices();
    updateTotals();  // including grand total
  }
});

function refreshPrices(){
  $('form .asset').each(function(rowNumber){
    var htmlRow = $('form .asset')[rowNumber];
    var coin = getCoinFromRow(htmlRow);
    var priceIn = getPriceIn($('form'));
    lookupPriceAndDisplayItInRow(coin, priceIn, htmlRow, rowNumber, function(){
      updateTotal(htmlRow);
    });
  })
  
  //setTimeout(function(){
     updateGrandTotal();
  //}, 2000);
}
/* WHEN QTY IS CHAGGED */
$('table').on('change', 'input.qty', function(event){
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
  clearCache();
  updateTotals();
})
/*
function clearCache(){
  for(var i = 0; i < priceArray.length; i++){
    var coinObject = priceArray[i];
    var coinApiName = coinObject['coinKey'];
    coinObject = {coinKey: coinApiName};
  }
}
*/



