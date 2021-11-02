/* tut2 report generator client side helpers */

'use strict';

(function() {

    // Take a Date object and turn it into something like "2015-01-22"
    var dateStr=function(d) {
        return dayName(d) + "<br />" + prefixWithZeroes(d.getFullYear(),4)+
        '-'+prefixWithZeroes(d.getMonth()+1)+
        '-'+prefixWithZeroes(d.getDate());
    };

    // get the name of the day
    var dayName=function(d) {
        var names=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        return names[d.getDay()];
    }

    var prefixWithZeroes=function(v, d=2) {
        while(v.toString().length<d) {
            v='0'+v;
        }
        return v;
    };

    /** Calculate start- and end times for current or one of the previous weeks.
     * @param origin Date() to base our calculations around
     */
    var calc_times_for_week = function(origin) {
        var daynr = origin.getDay();  // 0-Sun ... 6-Sat
        // We want the week to start on Monday instead
        if(daynr==0) {
            daynr=6;
        } else {
            daynr--;
        }
        origin.setDate(origin.getDate()-daynr);
        origin.setHours(0);
        origin.setMinutes(0);
        origin.setSeconds(0);
        origin.setMilliseconds(0);
        $("#starttime").val(origin.getTime());

        $("#endtime").val(origin.getTime() + 7*24*60*60*1000);

        $("#interval").val(24*60*60*1000);
    }

    $(document).ready(function(){
        console.info("reporting helpers reporting for duty");

        $("#this_week").on('click',null,null,function() {
            calc_times_for_week(new Date());
            $("#generate").click()
        });

        $("#last_week").on('click',null,null,function() {
            var d=new Date();
            d.setDate(d.getDate()-7);
            calc_times_for_week(d);
            $("#generate").click()
        });

        $("#last_last_week").on('click',null,null,function() {
            var d=new Date();
            d.setDate(d.getDate()-14);
            calc_times_for_week(d);
            $("#generate").click()
        });

        $("#generate").on('click',null,null,function() {
            console.info("generate button was clicked");
            // was: we use a synchronous ajax call (bad)
            var handle = $.ajax({
                dataType: "html",
                url: "report_table",
                cache:false,
                data: {
                    "starttime": $("#starttime").val(),
                    "endtime": $("#endtime").val(),
                    "interval":$("#interval").val(),
                    "currenttime": new Date().getTime()
                },
                //success: success
                async: true,
                success: function(data, textStatus, jqXHR) {
                    //console.info("retrieved via AJAX asynchronous:",data, "result:", textStatus);
                    $("#report_table").html(data);
                },
                complete: function(result, resultstr) {
                    console.info("complete");
                    console.info("retrieved via AJAX asynchronous:",result);
                    console.info("resultstr:", resultstr);

                    // convert table header ms values to readable Dates in current timezone
                    $(".columnheader").each(function(idx) {
                        console.log("idx", idx, "element:", $(this).text());
                        var millis = parseInt($(this).text());
                        var d = new Date(millis);
                        $(this).html(dateStr(d));
                    });

                    // colour in project names
                    $(".projectname").each(function(idx) {
                        var s = $(this).text();
                        console.log("Colouring...", idx, "'"+s+"'");
                        var colval = tut2_pick_colour_for_project(s);
                        $(this).css({'background-color':colval});
                    });
                }
            });

        });

        // Populate form fields sensible defaults
        calc_times_for_week(new Date());

        // start generating the most useful report right away
        $("#this_week").click()
    });
})();
