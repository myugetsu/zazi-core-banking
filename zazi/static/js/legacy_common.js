$(document).ready(function() {
    $('#leave-request-form #industry').on('change', function(e) {
        if ($(this).val() == 'other') {
            $('#other_industry').removeAttr('disabled').attr('required', 'required');
            $('#other_industry').slideToggle();
        } else {
            if ($('#other_industry').is(':visible')) {
                $('#other_industry').slideToggle().attr('disabled', 'disabled').removeAttr('required');
            }
        }
    });

    $('#edit-data-request-price #client_id').on('change', function(e) {
        top.location.href = edit_url + '/' + $(this).val();
    });
});

function isNumberKey(evt) {
    var charCode = (evt.which) ? evt.which : event.keyCode
    if (charCode > 31 && (charCode < 48 || charCode > 57))
        return false;
    return true;
}