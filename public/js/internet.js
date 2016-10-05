//MODELS
BH.models.InternetBrowser = BH.models.BaseModel.extend({
    urlRoot: '/machine',
    initialize: function () {
        this.on('sync', this.renderMachine, this);
        this.fetch();
    },
    renderMachine: function () {
        new BH.views.InternetBrowser({
            sourceIP: this.get('machine').ip,
            el: this.get('el')
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
    fetchPage: function () {
        this.get('browser').$('#internetSearchText').val(this.get('search'));
        this.get('browser').renderHistoryButtons();
        var data = {
            source: this.get('sourceIP'),
            search: this.get('search')
        };
        if (this.get('password')) {
            data.password = this.get('password');
        }
        var fetchParams = {
            data: $.param(data)
        };
        this.fetch(fetchParams);
    },
    renderInternetDOM: function () {
        var path = "",
            search = this.get('search');

        if (search.length > 0 && search.indexOf('/') != -1)
            path = search.substr(search.indexOf('/'));

        if (this.browserDOM)
            this.browserDOM.remove();

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
        else if (machine && machine.bank || path == '/account') {
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
    }
});


//VIEWS
BH.views = BH.views ? BH.views : {};
BH.views.InternetBrowser = BH.views.BaseView.extend({
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
            this.model.setSilent({search: search});
            this.model.trigger('change:search');
        }
        else {
            this.model = new BH.models.InternetBrowserDOM({
                el: this.$('#internetBrowserDOM'),
                search: search,
                browser: this,
                sourceIP: this.options.sourceIP
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
        this.model.fetchPage();
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

BH.views.InternetBrowserDOM = BH.views.BaseView.extend({
    defaults: {
        template: '/views/partials/internet/internetbrowserdom.ejs'
    },
    events: {
        "click .navigate-admin-login": "navigateAdminLogin",
        "click .admin-login-button": "attemptAdminLogin"
    },
    beforeFirstRender: function () {
        this.renderData = {
            model: this.model,
            path: this.options.path,
            search: this.model.get('search')
        };
    },
    afterRender: function () {
        this.setElement(this.$('#internetContent'));
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
    }
});

BH.views.InternetBrowserBankDOM = BH.views.InternetBrowserDOM.extend({
    events: {
        "click .navigate-admin-login": "navigateAdminLogin",
        "click .admin-login-button": "attemptAdminLogin",
        'click .bank-login-button': 'attemptBankLogin',
        'click .create-bank-account-button': 'createBankAccountBegin'
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
    createBankAccountBegin: function () {
        if (this.model.get('machine').bank.accountCost == 0) {
            new BH.views.ConfirmModal({
                header: "Confirm New Bank Account",
                body: "Are you sure you want to create a new free bank account with " + this.model.get('machine').bank.name + "?",
                onConfirm: this.createBankAccountConfirm.bind(this)
            });
        }
        else {
            new BH.collections.UserBankAccountSelect([], {
                amount: this.model.get('machine').bank.accountCost,
                callback: this.createBankAccountConfirm.bind(this)
            });
        }
    },
    createBankAccountConfirm: function (paymentAccount) {
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
                    loginCallback: this.attemptBankLogin.bind(this)
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
            this.connectedMachine = new BH.models.LocalMachine({
                el: this.$('.internet-admin-container'),
                _id: this.model.get('machine')._id,
                password: this.model.get('password'),
                sourceIP: this.model.get('sourceIP')
            });
        }
        else {
            this.connectedMachine = new BH.models.RemoteMachine({
                el: this.$('.internet-admin-container'),
                _id: this.model.get('machine')._id,
                password: this.model.get('password'),
                sourceIP: this.model.get('sourceIP')
            });
        }
        this.model.setSilent({password: null, isAuthenticated: null});
    }
});

$(function () {
    new BH.models.InternetBrowser({
        el: '#internetBrowser'
    });
});