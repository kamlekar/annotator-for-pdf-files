$(function () {
    annotation.init({
        "data": {
            "annotations": [
                {
                    "top": "120",
                    "left": "200",
                    "width": "100",
                    "height": "100",
                    "shape": "rectangle",
                    "comments": [
                        {
                            "sender": "sender name",
                            "senttime": "2342232",
                            "text": "",
                            "categoryId": "3",
                            "statusId": "4",
                            "severityId": "2"
                        }
                    ]
                }
            ]
        },
        "afterLoadCallBack": function(){
            $('.toolbar').show();
            $('.screenBlocker').fadeOut("slow");
        }
    });
});
