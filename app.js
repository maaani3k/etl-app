let filmData; // zmienna daty załadowania filmów

// extract data from website function
// guzik akcja -> funkcja ładuje dane ze st
$('#extract-button').click(function () {
    $('#extract-button').addClass('disabled')//wyłacza przycisk
    $('#etl-button').addClass('disabled')// etl główny

    let genreUrl = {
        url: $('.ui.dropdown').dropdown('get value')// wybiera url na podstawie gatunku filmu
    }

    $.ajax({ // w zależności od URL generuje dane filmów req POST do servera
        url: "http://localhost:4000/api/extract",
        type: "POST",
        data: JSON.stringify(genreUrl),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (resp) { //jeśli bez błędu nasza data filmów to odpowiedź servera (dane przypisuje do zmienniej)
            filmData = resp;
            $('#transform-button').removeClass('disabled') //odblokowuje guzik dodaje niebieski kolor
            $('#transform-button').addClass('blue')
            $('#extract-button').addClass('green')// po zakończeniu przypisuje zielony
            $('#informations').append('<div> Data from IMDb extracted successfuly. <strong>'+ filmData.length + ' elements </strong> extracted. </div>')
        }// do div id=informations przypisuje komunikat o sukcesie akcji / funkcji - filmy w zmiennej filmData
    });
});

// transform data function
$('#transform-button').click(function () {
    $('#transform-button').addClass('disabled')

    $.ajax({
        url: "http://localhost:4000/api/transform",
        type: "POST",
        data: JSON.stringify(filmData), // wysyłamy dane ze zmiennej do servera i robimy transform na serwerze
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (resp) {  // po sukcesie przypisuje przetransformowane dane do zmienniej filmData
            console.log("Pure jQuery Pure JS object");
            filmData = resp;
            console.log('transform res', resp)
            $('#load-button').removeClass('disabled') // tak jak wyżej
            $('#transform-button').addClass('green')
            $('#load-button').addClass('blue')
            $('#informations').append('<div> Data from IMDb transformed successfuly. <strong>'+ filmData.length + ' elements </strong> transformed. </div>')
        } // komunikat jak wyżej
    });
});

// load data function
$('#load-button').click(function () {
    $('#load-button').addClass('disabled') // wyłącza przysick

    $.ajax({
        url: "http://localhost:4000/api/load",
        type: "POST",
        data: JSON.stringify(filmData), // wysyła dane przetransformowane do servera a server obłsuguje zapytanie i zapisuje do bazy danych
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (resp) { // sukcess tak jak wyżej
            $('#load-button').addClass('green')
            $('#drop-table-button').removeClass('disabled')

            $('.table-container').removeClass('not-visible')
            $('.spinner-container').addClass('not-displayed')
            filmData = resp;
            console.log("Server data:");
            console.log(resp);
            $('#informations').append('<div> Data from IMDb loaded to database successfuly. <strong>'+ filmData.length + ' elements </strong> loaded/updated. </div>')
// tak jak wyżej

            var table = $('#example').DataTable({ // tworzenie tabeli po stronie aplikacji do wyświetlenia wyniku
                data: resp,
                columns: [ // kolumna z przyciskiem (zieolonym)
                    {
                        "className": 'details-control',
                        "orderable": false,
                        "data": null,
                        "defaultContent": ''
                    },
                    { data: 'index' }, //reszta kolumn
                    { data: 'rank' },
                    { data: 'title' },
                    { data: 'year' },
                    { data: 'director' },
                    { data: 'runtime' },
                    { data: 'rating' },
                    { data: 'votes' },
                    { data: 'income' }
                ],
                dom: 'Bfrtip', // przycisk csv
                buttons: [
                    {
                        extend: 'csv',
                        exportOptions: {
                             columns: [1,2,3,4,5,6,7,8,9] // kolumny zapisane w pliku .csv
                         }

                    },
                ]
            });
            $('#example tbody').on('click', 'td.details-control', function () { // funkcja która pokazuje szczegóły o filmie
                var tr = $(this).closest('tr');
                var row = table.row(tr);

                if (row.child.isShown()) {
                    // This row is already open - close it
                    row.child.hide();
                    tr.removeClass('shown');
                }
                else {
                    // Open this row
                    row.child(format(row.data())).show();
                    tr.addClass('shown');
                }
            });
        }
    });
});

//  droping table request
$('#drop-table-button').click(function () { // fukcja która kasuje dane z tabeli i bazy danych
    $('#drop-table-button').addClass('disabled')
    $('.table-container ').addClass('not-visible')

    $('#extract-button').removeClass('green')
    $('#transform-button').removeClass('green')
    $('#load-button').removeClass('green')

    fetch("http://localhost:4000/api/drop") // pobiera informacje o wykasowanej ilości danych z bazy i usuwa dane z bazy
        .then(resp => resp.json())
        .then(resp => {
            let table = $('#example').DataTable();
            table.destroy(); // niszczy tabelę
            $('#extract-button').removeClass('disabled')
            $('#extract-button').addClass('blue')
            $('#etl-button').removeClass('disabled')
            $('#transform-button').removeClass('blue')
            $('#load-button').removeClass('blue')

            // let dropCount = resp;
            setTimeout(
  function()
  {
    location.reload();
    //waits for refresh to go ready
  }, 1500);
            $('#informations').html('Database dropped successfuly. <strong>'+ resp.movieCount + ' elements </strong> deleted from database.')
            console.log(dropCount);
        })
})

function format(d) {
  // funkcja przekształcająca rząd aby był rozwijalny (wykorzystaba przy tworzeniu tabeli - zielony przycisk)
    // `d` is the original data object for the row
    return '<table cellpadding="5" cellspacing="0" border="0" style="padding-left:50px;">' +
        '<tr>' +
        '<td>Actors:</td>' +
        '<td>' + d.actors + '</td>' +
        '</tr>' +
        '<tr>' +
        '<td>Description: </td>' +
        '<td>' + d.description + '</td>' +
        '</tr>' +
        '<tr>' +
        '<td>Extra info:</td>' +
        '<td><a href=' + d.link + '>' + d.link + '</a></td>' +
        '</tr>' +
        '</table>';
}

// doin complex etl process by request and sending data to datatable

$('#etl-button').click(function () { // robi wszystko na serverze jak wyżej
    $('#etl-button').addClass('loading disabled')
    $('#extract-button').addClass('disabled')
    $('.spinner-container').removeClass('not-displayed')
    fetch("http://localhost:4000/api/etl")
        .then(resp => resp.json())
        .then(resp => {
            $('#etl-button').removeClass('loading')
            $('#drop-table-button').removeClass('disabled')
            $('.table-container').removeClass('not-visible')
            $('.spinner-container').addClass('not-displayed')
            data = resp;
            console.log("Server data:");
            console.log(resp);
            $('#informations').append('<div> Extracted, transformed and loaded data to database successfuly. <strong>'+ data.length + ' elements </strong> loaded/updated. </div>')


            var table = $('#example').DataTable({
                data: resp,
                columns: [
                    {
                        "className": 'details-control',
                        "orderable": false,
                        "data": null,
                        "defaultContent": ''
                    },
                    { data: 'index' },
                    { data: 'rank' },
                    { data: 'title' },
                    { data: 'year' },
                    { data: 'director' },
                    { data: 'runtime' },
                    { data: 'rating' },
                    { data: 'votes' },
                    { data: 'income' }

                ],
                dom: 'Bfrtip',
                buttons: [
                    {
                        extend: 'csv',
                        exportOptions: {
                             columns: [1,2,3,4,5,6,7,8,9]
                         }

                    },
                ]
            });
            $('#example tbody').on('click', 'td.details-control', function () {
                var tr = $(this).closest('tr');
                var row = table.row(tr);

                if (row.child.isShown()) {
                    // This row is already open - close it
                    row.child.hide();
                    tr.removeClass('shown');
                }
                else {
                    // Open this row
                    row.child(format(row.data())).show();
                    tr.addClass('shown');
                }
            });
        })

});

// picking up genre dropdown
// funkcja która tworzy listę wysuwalną gatunków filmów
$('.ui.dropdown')
    .dropdown({
        values: [
            {
                name: 'Action',
                value: 'https://www.imdb.com/search/title?genres=action&sort=user_rating,desc&title_type=feature&num_votes=25000,&pf_rd_m=A2FGELUUNOQJNL&pf_rd_p=5aab685f-35eb-40f3-95f7-c53f09d542c3&pf_rd_r=5JKH7Z8RCE10W2SNT9Y4&pf_rd_s=right-6&pf_rd_t=15506&pf_rd_i=top&ref_=chttp_gnr_1'
            },
            {
                name: 'Adventure',
                value: 'https://www.imdb.com/search/title?genres=adventure&sort=user_rating,desc&title_type=feature&num_votes=25000,&pf_rd_m=A2FGELUUNOQJNL&pf_rd_p=5aab685f-35eb-40f3-95f7-c53f09d542c3&pf_rd_r=5JKH7Z8RCE10W2SNT9Y4&pf_rd_s=right-6&pf_rd_t=15506&pf_rd_i=top&ref_=chttp_gnr_2',
            },
            {
                name: 'Animation',
                value: 'https://www.imdb.com/search/title?genres=animation&sort=user_rating,desc&title_type=feature&num_votes=25000,&pf_rd_m=A2FGELUUNOQJNL&pf_rd_p=5aab685f-35eb-40f3-95f7-c53f09d542c3&pf_rd_r=5JKH7Z8RCE10W2SNT9Y4&pf_rd_s=right-6&pf_rd_t=15506&pf_rd_i=top&ref_=chttp_gnr_3',
            },
            {
                name: 'Biography',
                value: 'https://www.imdb.com/search/title?genres=biography&sort=user_rating,desc&title_type=feature&num_votes=25000,&pf_rd_m=A2FGELUUNOQJNL&pf_rd_p=5aab685f-35eb-40f3-95f7-c53f09d542c3&pf_rd_r=5JKH7Z8RCE10W2SNT9Y4&pf_rd_s=right-6&pf_rd_t=15506&pf_rd_i=top&ref_=chttp_gnr_4',
            },
            {
                name: 'Comedy',
                value: 'https://www.imdb.com/search/title?genres=comedy&sort=user_rating,desc&title_type=feature&num_votes=25000,&pf_rd_m=A2FGELUUNOQJNL&pf_rd_p=5aab685f-35eb-40f3-95f7-c53f09d542c3&pf_rd_r=5JKH7Z8RCE10W2SNT9Y4&pf_rd_s=right-6&pf_rd_t=15506&pf_rd_i=top&ref_=chttp_gnr_5',
            },
            {
                name: 'Crime',
                value: 'https://www.imdb.com/search/title?genres=crime&sort=user_rating,desc&title_type=feature&num_votes=25000,&pf_rd_m=A2FGELUUNOQJNL&pf_rd_p=5aab685f-35eb-40f3-95f7-c53f09d542c3&pf_rd_r=5JKH7Z8RCE10W2SNT9Y4&pf_rd_s=right-6&pf_rd_t=15506&pf_rd_i=top&ref_=chttp_gnr_6',
            },
            {
                name: 'Drama',
                value: 'https://www.imdb.com/search/title?genres=drama&sort=user_rating,desc&title_type=feature&num_votes=25000,&pf_rd_m=A2FGELUUNOQJNL&pf_rd_p=5aab685f-35eb-40f3-95f7-c53f09d542c3&pf_rd_r=5JKH7Z8RCE10W2SNT9Y4&pf_rd_s=right-6&pf_rd_t=15506&pf_rd_i=top&ref_=chttp_gnr_7',
            },
            {
                name: 'Family',
                value: 'https://www.imdb.com/search/title?genres=family&sort=user_rating,desc&title_type=feature&num_votes=25000,&pf_rd_m=A2FGELUUNOQJNL&pf_rd_p=5aab685f-35eb-40f3-95f7-c53f09d542c3&pf_rd_r=5JKH7Z8RCE10W2SNT9Y4&pf_rd_s=right-6&pf_rd_t=15506&pf_rd_i=top&ref_=chttp_gnr_8',
            },
            {
                name: 'Fantasy',
                value: 'https://www.imdb.com/search/title?genres=fantasy&sort=user_rating,desc&title_type=feature&num_votes=25000,&pf_rd_m=A2FGELUUNOQJNL&pf_rd_p=5aab685f-35eb-40f3-95f7-c53f09d542c3&pf_rd_r=5JKH7Z8RCE10W2SNT9Y4&pf_rd_s=right-6&pf_rd_t=15506&pf_rd_i=top&ref_=chttp_gnr_9',
            },
            {
                name: 'Film-Noir',
                value: 'https://www.imdb.com/search/title?genres=film_noir&sort=user_rating,desc&title_type=feature&num_votes=25000,&pf_rd_m=A2FGELUUNOQJNL&pf_rd_p=5aab685f-35eb-40f3-95f7-c53f09d542c3&pf_rd_r=5JKH7Z8RCE10W2SNT9Y4&pf_rd_s=right-6&pf_rd_t=15506&pf_rd_i=top&ref_=chttp_gnr_10',
            },
            {
                name: 'History',
                value: 'https://www.imdb.com/search/title?genres=history&sort=user_rating,desc&title_type=feature&num_votes=25000,&pf_rd_m=A2FGELUUNOQJNL&pf_rd_p=5aab685f-35eb-40f3-95f7-c53f09d542c3&pf_rd_r=5JKH7Z8RCE10W2SNT9Y4&pf_rd_s=right-6&pf_rd_t=15506&pf_rd_i=top&ref_=chttp_gnr_11',
            },
            {
                name: 'Horror',
                value: 'https://www.imdb.com/search/title?genres=horror&sort=user_rating,desc&title_type=feature&num_votes=25000,&pf_rd_m=A2FGELUUNOQJNL&pf_rd_p=5aab685f-35eb-40f3-95f7-c53f09d542c3&pf_rd_r=5JKH7Z8RCE10W2SNT9Y4&pf_rd_s=right-6&pf_rd_t=15506&pf_rd_i=top&ref_=chttp_gnr_12',
            },
            {
                name: 'Music',
                value: 'https://www.imdb.com/search/title?genres=music&sort=user_rating,desc&title_type=feature&num_votes=25000,&pf_rd_m=A2FGELUUNOQJNL&pf_rd_p=5aab685f-35eb-40f3-95f7-c53f09d542c3&pf_rd_r=5JKH7Z8RCE10W2SNT9Y4&pf_rd_s=right-6&pf_rd_t=15506&pf_rd_i=top&ref_=chttp_gnr_13',
            },
            {
                name: 'Musical',
                value: 'https://www.imdb.com/search/title?genres=musical&sort=user_rating,desc&title_type=feature&num_votes=25000,&pf_rd_m=A2FGELUUNOQJNL&pf_rd_p=5aab685f-35eb-40f3-95f7-c53f09d542c3&pf_rd_r=5JKH7Z8RCE10W2SNT9Y4&pf_rd_s=right-6&pf_rd_t=15506&pf_rd_i=top&ref_=chttp_gnr_14',
            },
            {
                name: 'Mystery',
                value: 'https://www.imdb.com/search/title?genres=mystery&sort=user_rating,desc&title_type=feature&num_votes=25000,&pf_rd_m=A2FGELUUNOQJNL&pf_rd_p=5aab685f-35eb-40f3-95f7-c53f09d542c3&pf_rd_r=5JKH7Z8RCE10W2SNT9Y4&pf_rd_s=right-6&pf_rd_t=15506&pf_rd_i=top&ref_=chttp_gnr_15',
            },
            {
                name: 'Romance',
                value: 'https://www.imdb.com/search/title?genres=romance&sort=user_rating,desc&title_type=feature&num_votes=25000,&pf_rd_m=A2FGELUUNOQJNL&pf_rd_p=5aab685f-35eb-40f3-95f7-c53f09d542c3&pf_rd_r=5JKH7Z8RCE10W2SNT9Y4&pf_rd_s=right-6&pf_rd_t=15506&pf_rd_i=top&ref_=chttp_gnr_16',
            },
            {
                name: 'Science-Fiction',
                value: 'https://www.imdb.com/search/title?genres=sci_fi&sort=user_rating,desc&title_type=feature&num_votes=25000,&pf_rd_m=A2FGELUUNOQJNL&pf_rd_p=5aab685f-35eb-40f3-95f7-c53f09d542c3&pf_rd_r=5JKH7Z8RCE10W2SNT9Y4&pf_rd_s=right-6&pf_rd_t=15506&pf_rd_i=top&ref_=chttp_gnr_17',
                selected: true
            },
            {
                name: 'Sport',
                value: 'https://www.imdb.com/search/title?genres=sport&sort=user_rating,desc&title_type=feature&num_votes=25000,&pf_rd_m=A2FGELUUNOQJNL&pf_rd_p=5aab685f-35eb-40f3-95f7-c53f09d542c3&pf_rd_r=5JKH7Z8RCE10W2SNT9Y4&pf_rd_s=right-6&pf_rd_t=15506&pf_rd_i=top&ref_=chttp_gnr_18',
            },
            {
                name: 'Thriller',
                value: 'https://www.imdb.com/search/title?genres=thriller&sort=user_rating,desc&title_type=feature&num_votes=25000,&pf_rd_m=A2FGELUUNOQJNL&pf_rd_p=5aab685f-35eb-40f3-95f7-c53f09d542c3&pf_rd_r=5JKH7Z8RCE10W2SNT9Y4&pf_rd_s=right-6&pf_rd_t=15506&pf_rd_i=top&ref_=chttp_gnr_19',
            },
            {
                name: 'War',
                value: 'https://www.imdb.com/search/title?genres=war&sort=user_rating,desc&title_type=feature&num_votes=25000,&pf_rd_m=A2FGELUUNOQJNL&pf_rd_p=5aab685f-35eb-40f3-95f7-c53f09d542c3&pf_rd_r=5JKH7Z8RCE10W2SNT9Y4&pf_rd_s=right-6&pf_rd_t=15506&pf_rd_i=top&ref_=chttp_gnr_20',
            },
            {
                name: 'Western',
                value: 'https://www.imdb.com/search/title?genres=western&sort=user_rating,desc&title_type=feature&num_votes=25000,&pf_rd_m=A2FGELUUNOQJNL&pf_rd_p=5aab685f-35eb-40f3-95f7-c53f09d542c3&pf_rd_r=5JKH7Z8RCE10W2SNT9Y4&pf_rd_s=right-6&pf_rd_t=15506&pf_rd_i=top&ref_=chttp_gnr_21',
            }
        ]
    });
