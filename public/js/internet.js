//MODELS
BH.models.InternetBrowser = BH.models.BaseModel.extend({
    urlRoot: '/machine',
    initialize: function () {
        this.on('sync', this.renderMachine, this);
        this.fetch();
    },
    renderMachine: function () {
        new BH.views.InternetBrowser({
            sourceMachine: this.get('machine'),
            el: this.get('el'),
            browserLoadData: this.get('browserLoadData')
        });
    }
});

BH.models.InternetBrowserDOM = BH.models.BaseModel.extend({
    urlRoot: '/internetcontent',
    initialize: function () {
        this.on('sync', this.renderInternetDOM, this);
        this.fetchPage();
        this.listenTo(this, "change:search change:password change:activeAccount", this.fetchPage);
    },
    fetchPage: function (isRefresh) {
        this.get('browser').renderHistoryButtons();
        var path = this.getCurrentPath();
        if (isRefresh && path == '/admin') {
            this.set('isAuthenticated', true);
            this.renderInternetDOM();
        }
        else {
            var data = {
                search: this.get('search'),
                sourceMachine: this.get('sourceMachine')._id
            };
            if (this.get('browserLoadData')) {
                if (this.get('browserLoadData').bankAccount && this.get('browserLoadData').bank) {
                    this.set('bank', this.get('browserLoadData').bank);
                    new BH.models.BrowserBankAccount({
                        sourceMachine: this.get('sourceMachine'),
                        _id: this.get('browserLoadData').bankAccount._id,
                        bank: this.get('browserLoadData').bank,
                        browserModel: this
                    });
                }
                else if (this.get('browserLoadData').ip)
                    data.search = this.get('browserLoadData').ip;
                this.unset('browserLoadData');
            }
            else if (this.get('bank')) {
                data.bank_id = this.get('bank')._id;
                this.unset('bank');
            }
            else {
                data.search = this.get('search');
                if (this.get('password')) {
                    data.password = this.get('password');
                }
            }

            var fetchParams = {
                data: $.param(data)
            };
            this.fetch(fetchParams);
        }
    },
    renderInternetDOM: function () {
        var path = this.getCurrentPath(),
            search = this.get('search');

        if (this.get('machine') && this.get('machine').ip)
            this.get('browser').$('#internetSearchText').val(this.get('machine').ip + path);
        else
            this.get('browser').$('#internetSearchText').val(search);

        if (this.browserDOM)
            this.browserDOM.remove();

        if (path == '/account' && !this.get('activeAccount'))
            path = '';

        var machine = this.get('machine');
        if (machine && this.get('isAuthenticated')) {
            path = '/admin';
            if (this.get('browser'))
                this.browserDOM = new BH.views.InternetBrowserAdminDOM({
                    el: this.get('el'),
                    model: this,
                    path: path,
                    _id: machine._id
                });
        }
        else if (machine && machine.bank) {
            if (path == '/admin')
                path = '/login';
            else if (this.get('activeAccount') && this.get('activeAccount').get('isAuthenticated'))
                path = '/account';
            else if (path == '/account' && (!this.get('activeAccount') || !this.get('activeAccount').get('isAuthenticated')))
                path = '';
            this.browserDOM = new BH.views.InternetBrowserBankDOM({
                el: this.get('el'),
                model: this,
                path: path
            });
        }
        else {
            if (path == '/admin')
                path = '/login';
            this.browserDOM = new BH.views.InternetBrowserDOM({
                el: this.get('el'),
                model: this,
                path: path
            });
        }
        var newSearch = this.get('machine').ip + path;
        if (this.get('machine').ip) {
            this.get('browser').$('#internetSearchText').val(newSearch);
            this.setSilent({search: newSearch})
        }
    },
    getCurrentPath: function () {
        var path = "",
            search = this.get('search');

        if (search.length > 0 && search.indexOf('/') != -1)
            path = search.substr(search.indexOf('/'));

        return path;
    }
});


//VIEWS
BH.views = BH.views ? BH.views : {};
BH.views.InternetBrowser = BH.views.BaseCollectionChildView.extend({
    internetHistory: {},
    historyIndex: 0,
    defaults: {
        template: '/views/partials/internet/internetbrowser.ejs',
        homepage: '1.1.1.1'
    },
    events: {
        'click .history-back': 'historyBack',
        'click .history-next': 'historyNext',
        'click .internet-refresh': 'refreshPage',
        'click .internet-home': 'goToHomepage',
        'click .internet-search': 'searchInternet'
    },
    afterRender: function () {
        this.$('#internetSearchText').on({
            'keyup': $.proxy(function (e) {
                if (e.keyCode == 13) {
                    this.getInternetContent(this.$('#internetSearchText').val());
                    this.$('#internetSearchText').blur();
                }
            }, this),
            click: this.inputClickSelectAll.bind(this)
        });

        $(window).resize($.proxy(function () {
            this.resize();
        }, this));
        this.resize();

        this.getInternetContent(this.options.homepage);
    },
    navigateToSubPath: function (path) {
        this.getInternetContent(this.model.get('machine').ip + path);
    },
    searchInternet: function () {
        this.getInternetContent(this.$('#internetSearchText').val());
    },
    getInternetContent: function (search, excludeFromHistory) {
        this.showLoading();
        if (!excludeFromHistory)
            this.addToHistory(search);

        if (this.model) {
            //set silent and then trigger in case we're setting it to the same value
            // if its the same value its considered a dom refresh
            this.model.setSilent({search: search});
            this.model.trigger('change:search');
        }
        else {
            this.model = new BH.models.InternetBrowserDOM({
                el: this.$('#internetBrowserDOM'),
                search: search,
                browserLoadData: this.options.browserLoadData,
                browser: this,
                sourceMachine: this.options.sourceMachine
            });
        }
    },
    showLoading: function (isShow) {
        if (isShow || isShow == null)
            this.$('.internet-search-loading').show();
        else
            this.$('.internet-search-loading').hide();
    },
    resize: function () {
        var browserHeight = $(window).height() - 200;
        this.$el.height(browserHeight);
        this.$('#internetBrowserDOM').height(browserHeight - 55);
        this.$('#internetSearchText').width(this.$('#internetSearchContainer').width() - 240);
    },
    goToHomepage: function () {
        this.getInternetContent(this.options.homepage);
    },
    refreshPage: function () {
        this.showLoading();
        this.model.fetchPage(true);
    },
    addToHistory: function (search) {
        if (this.internetHistory && this.internetHistory[this.historyIndex - 1] && this.internetHistory[this.historyIndex - 1] == search)
            return;

        this.internetHistory[this.historyIndex] = search;
        this.historyIndex++;
        var deleteHistory = [],
            i;
        for (i in this.internetHistory) {
            if (i > this.historyIndex)
                deleteHistory.push(i);
        }
        for (i = 0; i < deleteHistory.length; i++) {
            if (this.internetHistory[deleteHistory[i]])
                delete this.internetHistory[deleteHistory[i]];
        }
    },
    historyBack: function () {
        this.historyIndex--;
        if (!this.getHistoryItem())
            BH.helpers.Toastr.showErrorToast("Failed to go to previous page");
    },
    historyNext: function () {
        this.historyIndex++;
        if (!this.getHistoryItem())
            BH.helpers.Toastr.showErrorToast("Failed to go to next page");
    },
    getHistoryItem: function () {
        var historySearch = this.internetHistory[this.historyIndex - 1];
        if (historySearch) {
            this.getInternetContent(historySearch, true);
            return true;
        }
        return false;
    },
    renderHistoryButtons: function () {
        if (this.historyIndex > 1) {
            this.$('#historyBackButton').prop('disabled', false);
        }
        else {
            this.$('#historyBackButton').prop('disabled', true);
        }

        if (this.historyIndex < Object.keys(this.internetHistory).length) {
            this.$('#historyNextButton').prop('disabled', false);
        }
        else {
            this.$('#historyNextButton').prop('disabled', true);
        }
    }
});

BH.views.InternetBrowserDOM = BH.views.BaseCollectionChildView.extend({
    defaults: {
        template: '/views/partials/internet/internetbrowserdom.ejs'
    },
    events: {
        "click .navigate-admin-login": "navigateAdminLogin",
        "click .admin-login-button": "attemptAdminLogin",
        "click .admin-crack-password": "crackMachinePassword"
    },
    beforeFirstRender: function () {
        var crackInProgress = false,
            processes = BH.app.localMachine.get('machine').processes;
        if (BH.app.localMachine && BH.app.localMachine.get('machine') && processes) {
            for (var i = 0; i < processes.length; i++) {
                if (processes[i].machine &&
                    this.model.get('machine') &&
                    processes[i].machine._id === this.model.get('machine')._id &&
                    processes[i].processSuccess != false &&
                    processes[i].type === BH.sharedHelpers.fileHelpers.types.CRACK_PASSWORD_MACHINE)
                    crackInProgress = true;
            }
        }

        this.renderData = {
            model: this.model,
            path: this.options.path,
            search: this.model.get('search'),
            crackInProgress: crackInProgress,
            localFileStats: BH.sharedHelpers.fileHelpers.getFileStats(BH.app.localMachine.get('machine').files)
        };
    },
    afterRender: function () {
        this.$('.admin-login-password').on({
            'keyup': $.proxy(function (e) {
                if (e.keyCode == 13) {
                    this.attemptAdminLogin();
                }
            }, this)
        });
        this.model.get('browser').showLoading(false);
    },
    navigateAdminLogin: function () {
        this.model.get('browser').navigateToSubPath('/login');
    },
    attemptAdminLogin: function () {
        this.model.set('password', this.$('.admin-login-password').val());
    },
    crackMachinePassword: function () {
        new BH.models.Process({
            type: BH.sharedHelpers.processHelpers.types.CRACK_PASSWORD_MACHINE,
            processMachine_id: BH.app.localMachine.get('machine')._id,
            machine_id: this.model.get('machine')._id
        }).save(null, {
                patch: true,
                success: $.proxy(function (data) {
                    BH.helpers.Toastr.showSuccessToast("Process started: Crack password", null);

                    this.$('.admin-crack-password').addClass('disabled').removeClass('btn-danger').text('Crack in progress...');

                    if (BH.app.localMachine.processes)
                        BH.app.localMachine.processes.fetch();
                }, this),
                error: function (model, response) {
                    BH.helpers.Toastr.showBBResponseErrorToast(response, null);
                },
                wait: true
            }
        );
    }
});

BH.views.InternetBrowserBankDOM = BH.views.InternetBrowserDOM.extend({
    events: {
        "click .navigate-admin-login": "navigateAdminLogin",
        "click .admin-login-button": "attemptAdminLogin",
        'click .bank-login-button': 'attemptBankLogin',
        "click .admin-crack-password": "crackMachinePassword",
        'click .create-bank-account-button': 'createBankAccountStart'
    },
    afterRender: function () {
        this.$('.bank-account-password').on({
            'keyup': $.proxy(function (e) {
                if (e.keyCode == 13) {
                    this.attemptBankLogin();
                    this.$('.bank-account-password').blur();
                }
            }, this)
        });
        this.$('.admin-login-password').on({
            'keyup': $.proxy(function (e) {
                if (e.keyCode == 13) {
                    this.attemptAdminLogin();
                }
            }, this)
        });

        if (this.model.get('activeAccount') && this.model.get('activeAccount').get('isAuthenticated')) {
            this.model.get('activeAccount').set('browserModel', this.model);
            new BH.views.BrowserBankAccount({
                el: this.$('.bank-account-container'),
                model: this.model.get('activeAccount')
            });
        }
        this.model.setSilent({activeAccount: null});
        this.model.get('browser').showLoading(false);
    },
    forceBankLogin: function (accountNumber, password) {
        new BH.models.BrowserBankAccount({
            machine: this.model.get('machine'),
            bank: this.model.get('machine').bank,
            account: {
                accountNumber: accountNumber,
                password: password
            },
            browserModel: this.model
        });
    },
    attemptBankLogin: function () {
        this.forceBankLogin(this.$('.bank-account-number').val(), this.$('.bank-account-password').val());
    },
    createBankAccountStart: function () {
        if (this.model.get('machine').bank.accountCost == 0) {
            new BH.views.ConfirmModal({
                header: "Confirm New Bank Account",
                body: "Are you sure you want to create a new free bank account with " + this.model.get('machine').bank.name + "?",
                onConfirm: this.createBankAccount.bind(this)
            });
        }
        else {
            new BH.collections.UserBankAccountSelect([], {
                amount: this.model.get('machine').bank.accountCost,
                callback: this.createBankAccount.bind(this)
            });
        }
    },
    createBankAccount: function (paymentAccount) {
        var newAccount = new BH.models.BankAccount({
            bank: this.model.get('machine').bank,
            paymentAccount: paymentAccount ? paymentAccount.get('account')._id : {}
        });
        newAccount.save(null, {
            success: $.proxy(function (data) {
                new BH.views.NotifyNewBankAccountModal({
                        type: 'newBankAccount',
                        extras: {
                            account: data
                        },
                    loginCallback: this.forceBankLogin.bind(this)
                    });
            }, this),
                error: function (model, response) {
                    BH.helpers.Toastr.showBBResponseErrorToast(response, null);
                },
                wait: true
            }
        );
    }
});

BH.views.InternetBrowserAdminDOM = BH.views.InternetBrowserDOM.extend({
    afterRender: function () {
        if (this.model.get('isOwner')) {
            BH.app.currentMachine = new BH.models.LocalMachine({
                el: this.$('.internet-admin-container'),
                _id: this.model.get('machine')._id,
                password: this.model.get('password'),
                sourceMachine: this.model.get('sourceMachine')
            });
        }
        else {
            BH.app.currentMachine = new BH.models.RemoteMachine({
                el: this.$('.internet-admin-container'),
                _id: this.model.get('machine')._id,
                password: this.model.get('password'),
                sourceMachine: this.model.get('sourceMachine')
            });
        }
        this.model.setSilent({password: null, isAuthenticated: null});

        this.model.get('browser').showLoading(false);
    }
});