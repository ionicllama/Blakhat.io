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
        getNewDateAddDays: function (date, days) {
            if (!date)
                return date;
            else
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
        }
    };

    exports.sharedHelpers.cpuHelpers = {
        getCPUName: function (cpu) {
            return cpu.cores + '-core ' + cpu.speed + ' MHz';
        },
        getCPUCost: function (cpu) {
            if (!cpu || (cpu.speed === 666 && cpu.cores === 1))
                return 0;
            else
                return Math.floor((Math.pow(cpu.speed, 3) / 10000000) * Math.pow(cpu.cores, 2));
        },
        getCPUModifier: function (cpu) {
            //todo: probably change this to be a bit more sophisticated
            return cpu ? (cpu.cores * cpu.speed) : 0;
        }
    };

    exports.sharedHelpers.hddHelpers = {
        getHDDCost: function (hdd) {
            if (!hdd || (hdd.size === 20))
                return 0;
            else
                return Math.floor((Math.pow(hdd.size * 3, 2) * .01));
        },
        getHDDModifier: function (hdd) {
            //todo: probably change this to be a bit more sophisticated
            return hdd ? hdd.size : 0;
        }
    };

    exports.sharedHelpers.internetHelpers = {
        getInternetName: function (internet) {
            return internet.downSpeed + 'mb/s down - ' + internet.upSpeed + 'mb/s up';
        },
        getInternetCost: function (internet) {
            if (!internet || (internet.upSpeed === 1 && internet.downSpeed === 5))
                return 0;
            else
                return Math.floor(Math.pow(internet.downSpeed * internet.upSpeed * 25, 1.1) * .03)
        },
        getInternetModifier: function (internet) {
            //todo: probably change this to be a bit more sophisticated
            return internet ? (internet.downSpeed * internet.upSpeed) : 0;
        }
    };

    exports.sharedHelpers.firewallHelpers = {
        getFirewallName: function (firewall) {
            if (!firewall || !firewall.level || firewall.level === 0)
                return "None";
            else
                return ("Level" + firewall.level.toString());
        }
    };

}(typeof exports === 'undefined' ? (!this.NH ? this.NH = {} : this.NH = this.NH) : exports));