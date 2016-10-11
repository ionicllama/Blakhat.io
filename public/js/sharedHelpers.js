/**
 * Created by Evan on 9/25/2016.
 */

(function (exports) {
    exports.sharedHelpers = {
        checkDateIsBeforeToday: function (date) {
            if (!date) {
                return true;
            }
            else {
                return (date < new Date());
            }
        },
        randomNumber_255: function (minLength) {
            var startNum = 1;
            if (minLength && minLength === 2)
                startNum = 10;
            else if (minLength && minLength === 3)
                startNum = 100;

            return Math.floor(Math.random() * (startNum - 254) + 255);
        },
        getTimeRemaining: function (date) {
            var t = Date.parse(date) - Date.parse(new Date());
            var seconds = Math.floor((t / 1000) % 60);
            var minutes = Math.floor((t / 1000 / 60) % 60);
            var hours = Math.floor((t / (1000 * 60 * 60)) % 24);
            var days = Math.floor(t / (1000 * 60 * 60 * 24));
            return {
                'total': t,
                'days': days,
                'hours': hours,
                'minutes': minutes,
                'seconds': seconds
            };
        },
        getNewDateAddDays: function (date, days) {
            if (!date)
                return date;
            else {
                date = new Date(date);
                return new Date(date.setTime(date.getTime() + days * 86400000));
            }
        },
        getNewDateAddHours: function (date, hours) {
            if (!date)
                return date;
            else {
                date = new Date(date);
                return new Date(date.setTime(date.getTime() + hours * 3600000));
            }
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
        },
        getDateDiffString: function (compareDate) {
            var date = new Date(),
                totalMinutes = this.getDateMinutesDiff(compareDate ? compareDate : date, date),
                hours = Math.floor(totalMinutes / 60),
                minutes = totalMinutes % 60;
            if (hours > 0)
                return (hours + 'hrs ' + minutes + 'min');
            else
                return (minutes + 'min');
        },
        parseIPFromString: function (string) {
            var regex = new RegExp(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/),
                result = string.match(regex);
            return result ? result : "";
        },
        formatCurrency: function (money) {
            //divide by 100, we store it in the database as cents for exact accuracy to one cent
            return '$' + (money / 100).toFixed(2).toString().replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
        },
        formatCurrencyNoDecimals: function (money) {
            return '$' + (money / 100).toString().replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
        }
    };

    exports.sharedHelpers.cpuHelpers = {
        getCPUName: function (cpu) {
            return cpu.cores + '-core ' + cpu.speed + ' MHz';
        },
        getCPUCost: function (cpu) {
            //total cents cost
            if (!cpu || (cpu.speed === 666 && cpu.cores === 1))
                return 0;
            else
                return Math.floor((Math.pow(cpu.speed * 20, 2) / 10000000) * Math.pow(cpu.cores * 5, 2)) * 100;
        },
        getCPUCostDisplay: function (cpu) {
            return exports.sharedHelpers.formatCurrency(this.getCPUCost(cpu));
        },
        getCPUModifier: function (cpu) {
            //todo: probably change this to be a bit more sophisticated
            return cpu ? (cpu.cores * cpu.speed) : 0;
        }
    };

    exports.sharedHelpers.hddHelpers = {
        getHDDName: function (hdd) {
            return hdd.size.toString() + "gb";
        },
        getHDDCost: function (hdd) {
            //total cents cost
            if (!hdd || (hdd.size === 20))
                return 0;
            else
                return Math.floor((Math.pow(hdd.size * 20, 2) * .01)) * 100;
        },
        getHDDCostDisplay: function (hdd) {
            return exports.sharedHelpers.formatCurrency(this.getHDDCost(hdd));
        }
    };

    exports.sharedHelpers.internetHelpers = {
        getInternetName: function (internet) {
            return internet.downSpeed + 'mb/s down - ' + internet.upSpeed + 'mb/s up';
        },
        getInternetCost: function (internet) {
            //total cents cost
            if (!internet || (internet.upSpeed === 1 && internet.downSpeed === 5))
                return 0;
            else
                return Math.floor(Math.pow(internet.downSpeed * internet.upSpeed * 25, 1.1) * .03) * 100;
        },
        getInternetCostDisplay: function (internet) {
            return exports.sharedHelpers.formatCurrency(this.getInternetCost(internet));
        },
        getInternetModifier: function (internet) {
            //todo: probably change this to be a bit more sophisticated
            return internet ? (internet.downSpeed * internet.upSpeed) : 0;
        }
    };

    exports.sharedHelpers.fileHelpers = {
        getFileName: function (file) {
            if (file)
                return file.file.name + '.' + file.file.type;
            else
                return 'no_name.txt';
        },
        getFiletypeName: function (file) {
            if (file) {
                switch (file.file.type.toLowerCase()) {
                    case 'fl':
                        return 'Firewall';
                    case 'bps':
                        return 'Firewall Bypasser';
                    case 'ck':
                        return 'Password Cracker';
                    default:
                        return Text
                }
            }
            else {
                return 'Text';
            }
        }
    };

    exports.sharedHelpers.bankHelpers = {
        parseBankBalance: function (balance) {
            var result = {};
            result.dollars = balance / 100;
            result.cents = balance % 100;
            return result;
        }
    };

    exports.sharedHelpers.events = {
        isNumberKey: function (e) {
            return !(e.keyCode > 31 && (e.keyCode < 48 || e.keyCode > 57));
        }
    };

}(typeof exports === 'undefined' ? (!this.BH ? this.BH = {} : this.BH = this.BH) : exports));