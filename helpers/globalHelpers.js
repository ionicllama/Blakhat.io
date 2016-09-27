/**
 * Created by Evan on 9/25/2016.
 */
module.exports = {
    randomNumber: function () {
        return Math.floor(Math.random() * (1 - 254) + 255)
    },
    getNewDateAddDays: function (date, days) {
        return new Date(date.setTime(date.getTime() + days * 86400000));
    },
    getDateHoursDiff: function (date1, date2) {
        return this.getDateDiff('hours', date1, date2);
    },
    getDateMinutesDiff: function (date1, date2) {
        return this.getDateDiff('minutes', date1, date2);
    },
    getDateDiff: function (type, date1, date2) {
        var diff = parseInt(date1.getTime() - date2.getTime()) / 1000;
        var result = 0;
        switch (type) {
            case 'days':
                result = parseInt(diff / 86400);
                break;
            case 'hours':
                result = parseInt(diff / 3600);
                break;
            case 'minutes':
                result = parseInt(diff / 60);
                break;
        }

        result = Math.floor(result);

        return result;
    }
};