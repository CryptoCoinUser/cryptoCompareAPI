var priceArray = []; // coin prices in the order they were added (will have to remove one on delete) BUT in which priceIn?
var coinLongNames = {
  BTC: 'Bitcoin',
  ETH: 'Etherem',
  DASH:'DASH',
  ZEC: 'ZCash'
}
$('form').on('submit')
$('form').on('change', 'select.coin', function(event){
  //get coin
  var newCoin = $('table').find('select.coin option:selected').val();
  addRow(newCoin); // add row and add price later with callback
  removeCoinFromSelect(newCoin); // so the same coin cannot be added twice
  var priceIn = getPriceIn($('form'));
  var newCoinObject = {coinKey: newCoin}
  newCoinObject[priceIn] = -1; // it's possible a coinObject to be like {coinKey: "BTC", USD: 1092.95, EUR: -1}
  priceArray.push(newCoinObject);
  var priceIn = getPriceIn($(this).closest('table'));
  var queryObject = { fsym: newCoin, tsymsArray: [priceIn]}
  getDataFromApi(queryObject, updateNewCoinPrice);
});

function updateNewCoinPrice(data){
  var dataKeysArray = Object.keys(data);
  var priceIn = dataKeysArray[0];
  price = data[priceIn];
  var lastIndex = priceArray.length - 1;
  var lastObject = priceArray[lastIndex];
  //var lastObjectKeysArray = Object.keys(lastObject);
  var coin = lastObject['coinKey'];
  lastObject[priceIn] = price; // cache the price in priceArray, overwrite the default -1 or the last price;
  displayPriceOfNewCoin(price); // put price in last row of tbody
}

function displayPriceOfNewCoin(price){
  $('.asset:last-child').find('.price').html(price.toFixed(2));  
}

function addRow(coin){
  var newRow = $('<tr class="asset"><td class="coin"> <span class="apiName"></span> <a href="#" class="delete">delete</a></td><td class="qty"><input class="qty" type="text" placeholder="number of coins" value="0"></td><td class="price">TBLookedUp</td><td class="total">0</td></tr>');
  //add class to row
  newRow.find('tr.asset').addClass(coin);
  //add long coin name
  var coinLongName = lookupCoinLongName(coin);
  newRow.find('td.coin').prepend(coinLongName);
  //add coin apiName
  newRow.find('span.apiName').html(coin);
  //long coin name to placeholder
  //console.log(newRow);
  $('tbody').append(newRow);
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
                tsyms: queryObject.tsymsArray.toString() //tsyms: ['ETH','USD', 'EUR', 'LTC'].toString()            
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

function lookupPriceAndDisplayItInRow(coin, priceIn, htmlRow){
  console.log('lookupPriceAndDisplayItInRow TODO: check if this PriceIn price is aleady in priceArray object for this coin, BEFORE doing another getDataFromApi');
  var price;
	var queryObject = { fsym: coin,	tsymsArray: [priceIn]}
	getDataFromApi(queryObject, extractPriceAndDisplayItInRow);
	
    function extractPriceAndDisplayItInRow(data){
      console.log('extractPriceAndDisplayItInRow TODO: add this PriceIn price to priceArray object for this coin');
      var dataKeysArray = Object.keys(data);
      var priceIn = dataKeysArray[0];
      price = data[priceIn];
      $(htmlRow).find('td.price').html(price);
    }
}

/* WHEN PriceIn IS CHANGED */
$('form').on('change', 'select.priceIn', function(event){
  refreshPrices();
  updateTotals(); // including grand total
});

function refreshPrices(){
  $('form .asset').each(function(rowNumber){
    var htmlRow = $('form .asset')[rowNumber];
    var coin = getCoinFromRow(htmlRow);
    var priceIn = getPriceIn($('form'));
    lookupPriceAndDisplayItInRow(coin, priceIn, htmlRow);
    
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
    setTimeout(function(){
      updateTotal(htmlRow);
    }, 1000); 
  })
  
  setTimeout(function(){
     updateGrandTotal();
  }, 2000);
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
    //console.log('updateGrandTotal() called');
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
  console.log('updateTotals() called');
  var grandTotal = 0;
  $('form .asset').each(function(rowNumber){
    var htmlRow = $('form .asset')[rowNumber];
    updateTotal(htmlRow);
    var total = getTotal(htmlRow);
    grandTotal += total;
  })
  $('.grandTotal').html(grandTotal.toFixed(2));
  //console.log(grandTotal);
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





