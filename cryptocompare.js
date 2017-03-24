/* Need to rewrite priceArray as object of objects
var cache = {
  BTC: {
    USD: X,
    EUR: Y,
  },
  LTC: {
    USD: X,
    EUR: Y,
  },
  ETH: {
    USD: X,
    EUR: Y,
  },
}
*/

var priceArray = []; // coin prices in the order they were added (will have to remove one on delete)
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
  var newCoinObject = {coinKey: newCoin}
  newCoinObject[priceIn] = 0; // it's possible a coinObject to be like {coinKey: "BTC", USD: 1092.95, EUR: 0}
  priceArray.push(newCoinObject);
  var priceIn = getPriceIn($(this).closest('form'));
  if(newCoin == priceIn){
    lastObject[returnedPriceIn] = 1;
    displayPriceOfNewCoin(1);
  }
  var queryObject = { fsym: newCoin, tsymsArray: [priceIn]}
  getDataFromApi(queryObject, updateNewCoinPrice);
});

function updateNewCoinPrice(returnedData){
  var returnedDataKeysArray = Object.keys(returnedData);
  var returnedPriceIn = returnedDataKeysArray[0];
  returnedPrice = returnedData[returnedPriceIn];
  var lastIndex = priceArray.length - 1;
  var lastObject = priceArray[lastIndex];
  //var lastObjectKeysArray = Object.keys(lastObject);
  var coin = lastObject['coinKey'];
  lastObject[returnedPriceIn] = returnedPrice; // cache the price in priceArray, overwrite the default -1 or the last price;
  displayPriceOfNewCoin(returnedPrice); // put price in last row of tbody
}

function displayPriceOfNewCoin(price){
  $('.asset:last-child').find('.price').html(price.toFixed(2));  
}

function addRow(coin){
  var newRow = $('<tr class="asset"><td class="coin"> <span class="apiName"></span> <a href="#" class="delete">delete</a></td><td class="qty"><input class="qty" type="text" placeholder="number of coins" value="0"></td><td class="price">TBLookedUp</td><td class="total">0</td></tr>');
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
  removeCoinFromPriceArray(NthCoin);
  $(this).closest('tr.asset').remove();
})

function removeCoinFromPriceArray(NthCoin){
  priceArray = priceArray.splice(NthCoin,1);
}


function addCoinToSelect(coin){
  console.log('addCoinToSelect TODO optimization: insert the option in A-Z order, so its place does not chagne while coins are added and deleted');
  var coinLongName = lookupCoinLongName(coin);
  console.log(coinLongName);
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

  console.log('lookupPriceAndDisplayItInRow');
  console.log(priceArray[rowNumber][priceIn]);
  if(priceArray[rowNumber][priceIn]){
    price = priceArray[rowNumber][priceIn];
    $(htmlRow).find('.price').html(price);
    callbackUpdateTotal();
  } else if(coin == priceIn){ // API returns only {} for fsym=BTC&tsyms=BTC, instead of {"BTC": 1}
     $(htmlRow).find('.price').html(1);
     priceArray[rowNumber][priceIn] = 1;
  } else{
  	var queryObject = { fsym: coin,	tsymsArray: [priceIn]}
  	getDataFromApi(queryObject, extractPriceAndDisplayItInRow);
  	function extractPriceAndDisplayItInRow(returnedData){
      var returnedDataKeysArray = Object.keys(returnedData);
      var returnedPriceIn = returnedDataKeysArray[0];
      returnedPrice = returnedData[returnedPriceIn];
      $(htmlRow).find('.price').html(returnedPrice);
      //console.log('extractPriceAndDisplayItInRow TODO: add this PriceIn price to priceArray object for this coin');
      //assuming this coin does not have this priceIn price OR it needs to be updated
      priceArray[rowNumber][priceIn] = returnedPrice;
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
      console.log('callback called');
    });

    /* updateTotal for this row AFTER the price is updated (from API or from priceArray)
    var priceContainer = $($(this).closest('.asset').find('.price'));
    console.log('priceContainer');
    console.log(priceContainer);
    $('table').on('change', priceContainer, function(event){
      event.preventDefault();
      event.stopPropagation();
      updateTotal(htmlRow);
    }); 
    */
   // setTimeout(function(){
      //updateTotal(htmlRow);
   // }, 1000); 
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
    console.log('getTotal: total is false');
    console.log(row);
    console.log('total');
    
  }
  return Number(total);
}

$('form').on('click', '#refresh', function(event){
  event.preventDefault();
  event.stopPropagation();
  clearCache();
  updateTotals();
})

function clearCache(){
  console.log('clearCache() called');
  console.log(priceArray);
  for(var i = 0; i < priceArray.length; i++){
    var coinObject = priceArray[i];
    var coinApiName = coinObject['coinKey'];
    coinObject = {coinKey: coinApiName};
  }
  console.log(priceArray);
}




