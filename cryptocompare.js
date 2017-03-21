

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

//for each row, look up token inside <span class="apiName"></span>,
// and display its price in its Price column(for now in USD)

function getCoinFromRow(row){
	var coin;
	coin = $(row).find('td.token span.apiName').html();
  //console.log(row);
	console.log(coin);
  return coin;


}

function lookupPrice(coin, fiat){
	var queryObject = { fsym: coin,	tsymsArray: [fiat]}
	getDataFromApi(queryObject, returnPrice);

  /*var reply = $.getJSON(BASE_URL, query, function(RES){
  console.log(RES.USD);
	});
  */	
	//return reply.USD;
}
//
function returnPrice(data){
  var dataKeysArray = Object.keys(data);
  var fiat = dataKeysArray[0];
  var price = data[fiat];
  console.log(price);
  //akiva, how do I RETURN the price so i can pass it to another function like console.log(lookupPrice('BTC', 'USD'));
  //displayPrice(price);
  return price;

}
function displayPrice(price, row){
  $(row).find('td.price').html(price);
}

//lookupPrice('BTC', 'USD');
//console.log(lookupPrice('BTC', 'USD'));
$('table tr.asset').each(function(row){
  var htmlRow = $('table tr.asset')[row];
  var coin = getCoinFromRow(htmlRow);
  var price = lookupPrice(coin, 'USD');
  console.log('price is ' + price);
  displayPrice(price, htmlRow);
})