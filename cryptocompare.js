var priceArray = []; // coin prices in the order they were added (will have to remove one on delete)
var coinLongNames = {
  BTC: 'Bitcoin',
  ETH: 'Etherem',
  DASH:'DASH',
  ZEC: 'ZCash'
}

$('table').on('change', 'select.coin', function(event){
  //get coin
  var newCoin = $('table').find('select.coin option:selected').val();
  addRow(newCoin);
  removeCoinFromSelect(newCoin);
  var newCoinObject = {coinKey: newCoin, priceKey: -1}
  priceArray.push(newCoinObject);
  var priceIn = getPriceIn($(this).closest('table'));
  var queryObject = { fsym: newCoin, tsymsArray: [priceIn]}
  getDataFromApi(queryObject, updateNewCoinPrice);
});

function updateNewCoinPrice(data){
  var lastIndex = priceArray.length - 1;
  var dataKeysArray = Object.keys(data);
  var priceIn = dataKeysArray[0];
  price = data[priceIn];
  var lastObject = priceArray[lastIndex];
  //var lastObjectKeysArray = Object.keys(lastObject);
  var coin = lastObject['coinKey'];
  lastObject['priceKey'] = price;
  // console.log('updateNewCoinPrice');
  // console.log(lastObject);
  // console.log(price);

}

function addRow(coin){
  var newRow = $('<tr class="asset"><td class="coin"> <span class="apiName"></span> <a href="#" class="delete">delete</a></td><td class="qty"><input class="qty" type="text" placeholder="number of coins"></td><td class="price">TBLookedUp</td><td class="total">TBMultiplied</td></tr>');
  //add class to row
  newRow.find('tr.asset').addClass(coin);
  //add long coin name
  var coinLongName = lookupCoinLongName(coin);
  newRow.find('td.coin').prepend(coinLongName);
  //add coin apiName
  newRow.find('span.apiName').html(coin);
  //long coin name to placeholder
  console.log(newRow);
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
  var coinToAddBackToSelect = $(this).closest('tr.asset').find('span.apiName').html();
  addCoinToSelect(coinToAddBackToSelect);
  $(this).closest('tr.asset').remove();

})


function addCoinToSelect(coin){
  console.log('addCoinToSelect TODO optimization: sort select options so the A-Z order does not chagne while coins are added and deleted');
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

function getPriceIn(table){
  var priceIn = $('table').find('select.priceIn option:selected').val();
  return priceIn;
}

function lookupPriceAndDisplayItInRow(coin, priceIn, htmlRow){
  var price;
	var queryObject = { fsym: coin,	tsymsArray: [priceIn]}
	getDataFromApi(queryObject, extractPriceAndDisplayItInRow);
	
    function extractPriceAndDisplayItInRow(data){
      var dataKeysArray = Object.keys(data);
      var priceIn = dataKeysArray[0];
      price = data[priceIn];
      $(htmlRow).find('td.price').html(price);
    }
    // syncronous vs async: how do I RETURN the price so i can pass it to another function? use Promise?
}

$(document).ready(function(){
  //assuming some asset rows
//  refreshPrices();
  // setTimeout(function(){
  //   updateTotals();
  // }, 1000); 
});

$('table').on('change', 'select.priceIn', function(event){
  refreshPrices();
  updateTotals();
});

function refreshPrices(){
  $('table tr.asset').each(function(rowNumber){
    var htmlRow = $('table tr.asset')[rowNumber];
    var coin = getCoinFromRow(htmlRow);
    var priceIn = getPriceIn($('table'));
    lookupPriceAndDisplayItInRow(coin, priceIn, htmlRow);
  })
}

$('table').on('change', 'input.qty', function(event){
  event.preventDefault();
  event.stopPropagation();
  refreshPrices();
  var qty = $(this).val();
  setTimeout(function(){
    updateTotal($(this).closest('tr.asset'));
  }, 1000); 
});

function updateTotal(row){
  var qty = getQty(row);
  var price = getPrice(row);
  var total = qty * price;
  $(row).find('td.total').html(total);
  // console.log('updateTotal');
  // console.log(qty);
  // console.log(price);
  // console.log(total);
}

function updateTotals(){
  console.log('updateTotals() called');
  var grandTotal = 0;
  $('table tr.asset').each(function(rowNumber){
    var htmlRow = $('table tr.asset')[rowNumber];
    
    console.log('updateTotals() for each row');
    
    console.log('htmlRow');
    console.log(htmlRow);
    
    console.log('calling updateTotal');
    updateTotal(htmlRow);

    console.log('calling getTotal');
    var total = getTotal(htmlRow);
    console.log('total');
    console.log(total);
    grandTotal += total;



  })
  $('td.gradTotal').html(grandTotal);
  //console.log(grandTotal);
}

function getQty(row){
  var qty = $(row).find('input.qty').val();
  //console.log('getQty');
  //console.log(qty);
  //console.log(row);
  if(!qty){
    console.log('getQty: qty is false');
    console.log('row is');
    console.log(row);
    console.log('qty is');
    console.log(qty);
  }
  return qty;
}
function getPrice(row){
  var price = $(row).find('td.price').html()
  return price;
}
function getTotal(row){
  var total = $(row).find('input.total').val();
  if(!total){
    total = updateTotal(row);
    // console.log('getTotal: total is false');
    // console.log(row);
    // console.log('total');
    // console.log(total);
  }

  return total;
}





