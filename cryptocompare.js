function getDataFromApi(queryObject, callback) {
  var BASE_URL = 'https://min-api.cryptocompare.com/data/price';
  //?fsym=ETH&tsyms=BTC,USD,EUR
  var query = { fsym: queryObject.fsym,
                //tsyms: ['ETH','USD', 'EUR', 'LTC'].toString()
                tsyms: queryObject.tsymsArray.toString()             
             }
  $.getJSON(BASE_URL, query, callback);
}

/*
getDataFromApi('notUsed', function(RES){
  console.log(RES);
});
*/

function getCoinFromRow(row){
	var coin;
	coin = $(row).find('td.coin span.apiName').html();
  return coin;


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
//

$('table').on('change', 'select.priceIn', function(event){
  refreshPrices();
});

function refreshPrices(){
  $('table tr.asset').each(function(row){
    var htmlRow = $('table tr.asset')[row];
    var coin = getCoinFromRow(htmlRow);
    var priceIn = getPriceIn($('table'));
    lookupPriceAndDisplayItInRow(coin, priceIn, htmlRow);
  })
}

function getPriceIn(table){
  var priceIn = $('table').find('select.priceIn option:selected').val();
  console.log('getPriceIn:');
  console.log(priceIn);
  return priceIn;
}