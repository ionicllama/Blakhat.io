var BH = BH ? BH : {};

//MODELS
BH.models.InternetContent = BH.models.BaseModel.extend({
    urlRoot: '/internetcontent',
    initialize: function () {

        this.on('sync', this.renderInternetDOM, this);

        this.fetchPage();

        this.listenTo(this, "change:search change:password", this.fetchPage);
    },
    fetchPage: function () {
        this.get('browser').$('#internetSearchText').val(this.get('search'));
        this.get('browser').renderHistoryButtons();
        var data = {search: this.get('search')};
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
        if (machine && machine.bank) {
            this.browserDOM = new BH.views.InternetBrowserBankDOM({
                el: this.get('el'),
                model: this,
                path: path
            });
        }
        else if (machine && this.get('isAuthenticated')) {
            path = '/admin';
            if (this.get('browser'))
                this.browserDOM = new BH.views.InternetBrowserAdminDOM({
                    el: this.get('el'),
                    model: this,
                    path: path,
                    _id: machine._id
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

BH.models.RemoteMachine = BH.models.Machine.extend({});


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
            click: function () {
                $(this).select();
            }
        });

        $(window).resize($.proxy(function () {
            this.resize();
        }, this));
        this.resize();

        this.getInternetContent(this.options.homepage);
    },
    searchInternet: function () {
        this.getInternetContent(this.$('#internetSearchText').val());
    },
    getInternetContent: function (search, excludeFromHistory) {
        if (!excludeFromHistory)
            this.addToHistory(search);

        if (this.model)
            this.model.set('search', search);
        else
            this.model = new BH.models.InternetContent({
                el: this.$('#internetBrowserDOM'),
                search: search,
                browser: this
            });
    },
    showLoading: function () {
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
        this.getInternetContent(this.internetHistory[this.historyIndex - 1], true);
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
        this.listenTo(this.model, "change", this.render);
        this.renderData = {
            machine: this.model.get('machine') ? this.model.get('machine') : {},
            path: this.options.path
        };
    },
    afterRender: function () {
        this.setElement(this.$('#internetContent'));
    },
    navigateAdminLogin: function () {
        this.model.get('browser').getInternetContent(this.model.get('machine').ip + '/login');
    },
    attemptAdminLogin: function (e) {
        this.model.set('password', this.$('.admin-login-password').val());
    }
});

BH.views.InternetBrowserBankDOM = BH.views.InternetBrowserDOM.extend({
    defaults: {
        template: '/views/partials/internet/internetbrowserdom_bank.ejs'
    }
});

BH.views.InternetBrowserAdminDOM = BH.views.InternetBrowserDOM.extend({
    afterRender: function () {
        this.setElement(this.$('#internetContent'));
        if (this.model.get('isOwner')) {
            this.connectedMachine = new BH.models.LocalMachine({
                el: this.$el,
                _id: this.model.get('machine')._id
            });
        }
        else {
            this.connectedMachine = new BH.models.RemoteMachine({
                el: this.$el,
                _id: this.model.get('machine')._id,
                password: this.model.get('password')
            });
        }
        this.model.setSilent({password: null});
    }
});

$(function () {
    new BH.views.InternetBrowser({
        el: '#internetBrowser'
    });
});