/* -------------------------------------------------------------------------- */
/*                               Map JS File                                  */
/*								              Author: Yifu Yao              							  */
/*							           Last Updated Date: 6/14/2020            					  */
/* -------------------------------------------------------------------------- */

/* ------------------------------- Map setting ------------------------------ */

// var map = new Datamap({
//     element: document.getElementById("map"),
//     geographyConfig: {
//       popupOnHover: false,
//       highlightOnHover: false
//     },
//     fills: {
//       defaultFill: '#ccc',
//       B: 'blue'
//     }
//   })

//   map.addPlugin("fadingBubbles", fadingBubbles);

//   drawBubbles = function (data) {
//     data.forEach(function (datum, index) {

//       setTimeout(function () {

//         map.fadingBubbles([datum]);

//       }, index * 100);

//     });
//   }

//   var bubblesURL = "/process/location/"
//   $.get(bubblesURL, function (bubbles_list, status) {
//     drawBubbles(bubbles_list);
//     var sleep = (bubbles_list.length - 1) * 100;
//     setInterval(function () {
//       drawBubbles(bubbles_list);
//     }, sleep);
//   })


/* ----------------------- Get and show statistic data ---------------------- */
  // $("#userNumHead").fadeIn(1000);
  // $("#userNumber").fadeIn(1000);
  // var statisticUserURL = '/process/statistic/users';
  // $.get(statisticUserURL, function (data, status) {
  //   console.log(data);
  //   $("#userNumber").numberAnimate({num: data.user, speed:3000, symbol:","});
  // });

  // $("#queryNumHead").fadeIn(2000);
  // $("#queryNumber").fadeIn(2000);
  // var statisticQueryURL = '/process/statistic/querys';
  // $.get(statisticQueryURL, function (data, status) {
  //   console.log(data);
  //   $("#queryNumber").numberAnimate({num: data.querys, speed:4000, symbol:","});
  // });

  // $("#proteinsNumHead").fadeIn(3000);
  // $("#proteinsNumber").fadeIn(3000);
  // var statisticQueryURL = '/process/statistic/proteins';
  // $.get(statisticQueryURL, function (data, status) {
  //   console.log(data);
  //   $("#proteinsNumber").numberAnimate({num: data.proteins, speed:4000, symbol:","});
  // });

  window.addEventListener('resize', function(){
    document.getElementById('welcomecard').contentDocument.location.reload(true);
}, true);