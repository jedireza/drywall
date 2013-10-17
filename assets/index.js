$(document).ready(function () {
  //make code pretty
  window.prettyPrint && prettyPrint()
  
  //tooltips
  $("[rel='tooltip']").tooltip();
  
  //thumbnails
  $("[rel='thumbnail']").click(function() {
    var prevClass = $(this).attr('class');
    
    $("[rel='thumbnail']").removeClass('thumbnail-open');
    $('.modal-backdrop').remove();
    
    if (prevClass != "thumbnail-open") {
      $('body').append('<div class="modal-backdrop fade in"></div>');
      $(this).toggleClass('thumbnail-open');
    }
  });
  
  //listen for esc
  $(document).keyup(function(e) {
    if (e.keyCode == 27) {
      $('.modal-backdrop').remove();
      $("[rel='thumbnail']").removeClass('thumbnail-open');
    }
  });
});
