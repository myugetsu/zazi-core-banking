$(document).ready(function() {
    $('.edit-client-form input[name^="data_request"]').each(function() {
        if ($(this).is(':checked')) {
            $(this).parent().parent().find('input[type="text"]').removeAttr('disabled');
        } else {
            $(this).parent().parent().find('input[type="text"]').attr('disabled', 'disabled');
        }
    });


    $('.edit-client-form input[name^="data_request"]').on('click', function() {
        if ($(this).is(':checked')) {
            $(this).parent().parent().find('input[type="text"]').removeAttr('disabled');
        } else {
            $(this).parent().parent().find('input[type="text"]').attr('disabled', 'disabled');
        }
    });

    $(document).on('change', '#accountType', function() {
        if ($(this).val() == 1) {
            $('#creditLimit').attr('disabled', true);
        } else {
            $('#creditLimit').attr('disabled', false);
        }
    });
});