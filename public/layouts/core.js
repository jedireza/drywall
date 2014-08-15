/* global app:true */
/* exported app */

var app; //the main declaration

(function() {
  'use strict';

  $(document).ready(function() {
    //active (selected) navigation elements
    $('.nav [href="'+ window.location.pathname +'"]').closest('li').toggleClass('active');

    //register global ajax handlers
    $(document).ajaxStart(function(){ $('.ajax-spinner').show(); });
    $(document).ajaxStop(function(){  $('.ajax-spinner').hide(); });
    $.ajaxSetup({
      beforeSend: function (xhr) {
        xhr.setRequestHeader('x-csrf-token', $.cookie('_csrfToken'));
      }
    });

    //ajax spinner follows mouse
    $(document).bind('mousemove', function(e) {
      $('.ajax-spinner').css({
        left: e.pageX + 15,
        top: e.pageY
      });
    });
  });
}());
