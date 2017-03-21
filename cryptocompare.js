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
  refreshPrices();
  setTimeout(function(){
    updateTotals();
  }, 1000); 
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
  //refreshPrices();
  //var qty = $(this).val();
  updateTotal($(this).closest('tr.asset'));
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





