//noinspection SillyAssignmentJS
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
                return new Date(date.setTime(date.getTime() + (days * 86400000)));
            }
        },
        getNewDateAddHours: function (date, hours) {
            if (!date)
                return date;
            else {
                date = new Date(date);
                return new Date(date.setTime(date.getTime() + (hours * 3600000)));
            }
        },
        getNewDateAddSeconds: function (date, seconds) {
            if (!date)
                return date;
            else {
                date = new Date(date);
                return new Date(date.setTime(date.getTime() + (seconds * 1000)));
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
        cpuDefaults: {
            speed: 666,
            cores: 1
        },
        getCPUName: function (cpu) {
            return cpu.cores + '-core ' + cpu.speed + ' MHz';
        },
        getCPUCost: function (cpu) {
            //total cents cost
            if (!cpu || (cpu.speed === this.cpuDefaults.speed && cpu.cores === this.cpuDefaults.cores))
                return 0;
            else
                return Math.floor((Math.pow(cpu.speed * 20, 2) / 10000000) * Math.pow(cpu.cores * 5, 2)) * 100;
        },
        getCPUCostDisplay: function (cpu) {
            return exports.sharedHelpers.formatCurrency(this.getCPUCost(cpu));
        },
        getCPUModifier: function (cpu) {
            //divide by 1.1 for degredation
            return cpu ? Math.round((cpu.cores * cpu.speed) / 1.1) : 0;
        }
    };

    exports.sharedHelpers.gpuHelpers = {
        gpuDefaults: {
            speed: 800,
            cores: 8
        },
        getGPUName: function (gpu) {
            if (gpu)
                return gpu.cores + '-core ' + gpu.speed + ' MHz';
            else
                return "None";
        },
        getGPUCost: function (gpu) {
            //total cents cost
            if (!gpu || (gpu.speed === this.gpuDefaults.cores && gpu.cores === this.gpuDefaults.cores))
                return 0;
            else
                return Math.floor((Math.pow(gpu.speed * 5, 2) / 10000000) * Math.pow(gpu.cores * 2, 2)) * 160;
        },
        getGPUCostDisplay: function (gpu) {
            return exports.sharedHelpers.formatCurrency(this.getGPUCost(gpu));
        },
        getGPUModifier: function (gpu) {
            //divide by 1.1 for degredation
            return gpu ? Math.round((gpu.cores * gpu.speed) / 1.1) : 0;
        }
    };

    exports.sharedHelpers.hddHelpers = {
        hddDefaults: {
            size: 10240
        },
        getHDDName: function (hdd) {
            if (hdd)
                return (hdd.size / 1024).toString() + "gb";
            else
                return "None";
        },
        getHDDCost: function (hdd) {
            //total cents cost
            if (!hdd || (hdd.size === this.hddDefaults.size))
                return 0;
            else
                return Math.floor((Math.pow(hdd.size / 40, 2) * .01)) * 100;
        },
        getHDDCostDisplay: function (hdd) {
            return exports.sharedHelpers.formatCurrency(this.getHDDCost(hdd));
        }
    };

    exports.sharedHelpers.externalHDDHelpers = {
        externalHDDDefaults: {
            size: 5120
        },
        getExternalHDDName: function (hdd) {
            return exports.sharedHelpers.hddHelpers.getHDDName(hdd);
        },
        getExternalHDDCost: function (hdd) {
            //total cents cost
            if (!hdd || (hdd.size === this.externalHDDDefaults.size))
                return 0;
            else
                return Math.floor((Math.pow(hdd.size / 40, 2) * .1)) * 140;
        },
        getExternalHDDCostDisplay: function (hdd) {
            return exports.sharedHelpers.formatCurrency(this.getExternalHDDCost(hdd));
        }
    };

    exports.sharedHelpers.internetHelpers = {
        internetDefaults: {
            upSpeed: 3,
            downSpeed: 5
        },
        getInternetName: function (internet) {
            return internet.downSpeed + 'mb/s down - ' + internet.upSpeed + 'mb/s up';
        },
        getInternetCost: function (internet) {
            //total cents cost
            if (!internet || (internet.upSpeed === this.internetDefaults.upSpeed && internet.downSpeed === this.internetDefaults.downSpeed))
                return 0;
            else
                return Math.floor(Math.pow(internet.downSpeed * internet.upSpeed * 25, 1.1) * .03) * 100;
        },
        getInternetCostDisplay: function (internet) {
            return exports.sharedHelpers.formatCurrency(this.getInternetCost(internet));
        },
        getInternetModifier: function (internet) {
            return internet ? (internet.downSpeed * internet.upSpeed) : 0;
        }
    };

    exports.sharedHelpers.fileHelpers = {
        types: {
            FIREWALL: 'fl',
            FIREWALL_BYPASSER: 'bps',
            PASSWORD_CRACKER: 'ck',
            SPAM: 'spm',
            WAREZ: 'wrz',
            MINER: 'mnr',
            DDOS: 'ds',
            ANTIVIRUS: 'av',
            HIDER: 'hdr',
            FINDER: 'fdr',
            ANALYZER: 'az'
        },
        getFileName: function (file) {
            if (file && file.fileDef && file.fileDef.name)
                return file.fileDef.name + '.' + file.fileDef.type;
            else if (file && file.name)
                return file.name + '.' + file.fileDef.type;
            else
                return 'no_name.txt';
        },
        getFileNameWithSize: function (file) {
            return this.getFileName(file) + " Lv. " + file.fileDef.level + " (" + file.fileDef.size + " Mb)"
        },
        getFiletypeName: function (file) {
            if (file) {
                switch (file.fileDef.type.toLowerCase()) {
                    case this.types.FIREWALL:
                        return 'Firewall';
                    case this.types.FIREWALL_BYPASSER:
                        return 'Firewall Bypasser';
                    case this.types.PASSWORD_CRACKER:
                        return 'Password Cracker';
                    case this.types.SPAM:
                        return file.isInstalled ? 'Spam (Installed)' : 'Spam (Not Installed)';
                    case this.types.WAREZ:
                        return file.isInstalled ? 'Spam (Installed)' : 'Spam (Not Installed)';
                    case this.types.MINER:
                        return file.isInstalled ? 'Miner (Installed)' : 'Miner (Not Installed)';
                    case this.types.DDOS:
                        return file.isInstalled ? 'DDOS (Installed)' : 'DDOS (Not Installed)';
                    case this.types.ANTIVIRUS:
                        return 'Anti-Virus';
                    case this.types.HIDER:
                        return 'File Hider';
                    case this.types.FINDER:
                        return 'File Finder';
                    case this.types.ANALYZER:
                        return 'Hardware Analyzer';
                    default:
                        return 'Text';
                }
            }
            else {
                return 'Text';
            }
        },
        getFilesSizeTotal: function (files) {
            var size = 0;
            for (var i = 0; i < files.length; i++) {
                if (files[i].fileDef && files[i].fileDef.size)
                    size += files[i].fileDef.size
            }
            return size;
        },
        getHDDSpaceProgress: function (hdd, files) {
            var size = 0;
            for (var i = 0; i < files.length; i++) {
                if (files[i].file && files[i].fileDef.size)
                    size += files[i].fileDef.size
            }
            return size / hdd.size;
        },
        getFileStats: function (files) {
            var stats = {
                firewall: 0,
                firewallBypasser: 0,
                passwordCracker: 0,
                spam: 0,
                warez: 0,
                miner: 0,
                ddos: 0,
                antivirus: 0,
                hider: 0,
                finder: 0,
                analyzer: 0
            };
            if (files) {
                for (var i = 0; i < files.length; i++) {
                    if (!files[i].fileDef)
                        continue;
                    switch (files[i].fileDef.type.toLowerCase()) {
                        case this.types.FIREWALL:
                            stats.firewall = files[i].fileDef.level;
                            break;
                        case this.types.FIREWALL_BYPASSER:
                            stats.firewallBypasser = files[i].fileDef.level;
                            break;
                        case this.types.PASSWORD_CRACKER:
                            stats.passwordCracker = files[i].fileDef.level;
                            break;
                        case this.types.SPAM:
                            stats.spam = files[i].fileDef.level;
                            break;
                        case this.types.WAREZ:
                            stats.warez = files[i].fileDef.level;
                            break;
                        case this.types.MINER:
                            stats.bitcoin = files[i].fileDef.level;
                            break;
                        case this.types.DDOS:
                            stats.ddos = files[i].fileDef.level;
                            break;
                        case this.types.ANTIVIRUS:
                            stats.antivirus = files[i].fileDef.level;
                            break;
                        case this.types.HIDER:
                            stats.hider = files[i].fileDef.level;
                            break;
                        case this.types.FINDER:
                            stats.finder = files[i].fileDef.level;
                            break;
                        case this.types.ANALYZER:
                            stats.analyzer = files[i].fileDef.level;
                            break;
                    }
                }
            }
            return stats;
        },
        isVirus: function (fileDef) {
            return (fileDef.type === this.types.SPAM ||
            fileDef.type === this.types.WAREZ ||
            fileDef.type === this.types.MINER ||
            fileDef.type === this.types.DDOS);
        },
        canRun: function (fileDef) {
            return (fileDef.type === BH.sharedHelpers.fileHelpers.types.ANTIVIRUS ||
            fileDef.type === BH.sharedHelpers.fileHelpers.types.FINDER ||
            fileDef.type === BH.sharedHelpers.fileHelpers.types.HIDER)
        }
    };

    exports.sharedHelpers.processHelpers = {
        types: {
            UPDATE_LOG: 0,
            CRACK_PASSWORD_MACHINE: 1,
            CRACK_PASSWORD_BANK: 2,
            FILE_DOWNLOAD: 3,
            FILE_UPLOAD: 4,
            FILE_INSTALL: 5,
            FILE_RUN: 6,
            FILE_COPY_EXTERNAL: 7,
            FILE_MOVE_EXTERNAL: 8,
            FILE_COPY_INTERNAL: 9,
            FILE_MOVE_INTERNAL: 10,
            FILE_DELETE: 11
        },
        getProcessNameHTML: function (process) {
            switch (process.type) {
                case this.types.UPDATE_LOG:
                    return "<strong>Update Log</strong>";
                    break;
                case this.types.CRACK_PASSWORD_MACHINE:
                    return "<strong>Crack Admin Password</strong>";
                    break;
                case this.types.CRACK_PASSWORD_BANK:
                    return "<strong>Crack Bank Password</strong>";
                    break;
                case this.types.FILE_DOWNLOAD:
                    return "<strong>Download file:</strong> " + process.file.fileDef.name + " - Lv. " + process.file.fileDef.level;
                    break;
                case this.types.FILE_UPLOAD:
                    return "<strong>Upload file:</strong> " + process.file.fileDef.name + " - Lv. " + process.file.fileDef.level;
                    break;
                case this.types.FILE_INSTALL:
                    return "<strong>Install file:</strong> " + process.file.fileDef.name + " - Lv. " + process.file.fileDef.level;
                    break;
                case this.types.FILE_RUN:
                    return "<strong>Run file:</strong> " + process.file.fileDef.name + " - Lv. " + process.file.fileDef.level;
                    break;
                case this.types.FILE_COPY_EXTERNAL:
                    return "<strong>Copy file to External HDD:</strong> " + process.file.fileDef.name + " - Lv. " + process.file.fileDef.level;
                    break;
                case this.types.FILE_MOVE_EXTERNAL:
                    return "<strong>Move file to External HDD:</strong> " + process.file.fileDef.name + " - Lv. " + process.file.fileDef.level;
                    break;
                case this.types.FILE_COPY_INTERNAL:
                    return "<strong>Copy file to Internal HDD:</strong> " + process.file.fileDef.name + " - Lv. " + process.file.fileDef.level;
                    break;
                case this.types.FILE_MOVE_INTERNAL:
                    return "<strong>Move file to Internal HDD:</strong> " + process.file.fileDef.name + " - Lv. " + process.file.fileDef.level;
                    break;
                case this.types.FILE_DELETE:
                    if (process.file && process.file.fileDef)
                        return "<strong>Delete file:</strong> " + process.file.fileDef.name + " - Lv. " + process.file.fileDef.level;
                    else
                        return "<strong>Delete file</strong>";
                    break;
            }
        },
        getProgress: function (process) {
            var start = new Date(process.start),
                end = new Date(process.end);
            return Math.floor(((new Date() - start) / (end - start)) * 100);
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