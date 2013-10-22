(function() {
  'use strict';
  
  $(document).ready(function () {
    $("[rel='tooltip']").tooltip();
    
    $('#screenModal').on('show.bs.modal', function (e) {
      $('#screenModal img').attr('src', $(e.relatedTarget).find('img').attr('src'));
    });
  });
})();
