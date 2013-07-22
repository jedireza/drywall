/*!
 * Drywall Core Layout Javascript
 */

//register ajax start|stop handlers
jQuery(document).ajaxStart(function(){
  $('.ajax-spinner').show();
});
jQuery(document).ajaxStop(function(){
  $('.ajax-spinner').hide();
});

//globally when ready
$(document).ready(function() {
  //active tabs and navigation
  $('.nav [href="'+ window.location.pathname +'"]').closest('li').toggleClass('active');
  
  //ajax spinner follows mouse
  $(document).bind('mousemove', function(e) {
    $('.ajax-spinner').css({
      left: e.pageX + 15,
      top: e.pageY
    });
  });
});