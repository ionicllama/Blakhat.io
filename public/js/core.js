var BH = BH ? BH : {};

//CONSTANTS
BH.constants = BH.constants ? BH.constants : {};
BH.constants.dataTypes = {
    JSON: "json"
};

//MODELS
BH.models = BH.models ? BH.models : {};

BH.models.BaseModel = Backbone.Model.extend({
    idAttribute: "_id",
    setSilent: function (attrs) {
        for (var i in attrs) {
            this.attributes[i] = attrs[i];
        }
    }
});

//COLLECTIONS
BH.collections = BH.collections ? BH.collections : {};

BH.collections.BaseCollection = Backbone.Collection.extend({
    defaults: {},
    initialize: function (models, options) {
        this.options = _.defaults(options ? options : {}, this.defaults);
        if (models && models.length > 0)
            this.add(models, this.options);
        this.afterInit();
    },
    afterInit: function () {
    }
});

//VIEWS
BH.views = BH.views ? BH.views : {};

BH.views.BaseView = Backbone.View.extend({
    defaults: {
        isAppend: false,
    },
    initialize: function (options) {
        this.options = _.defaults(options ? options : {}, this.defaults);

        if (this.model)
            this.listenTo(this.model, "reset", this.render);

        if (this.beforeFirstRender() != false)
            this.render();
    },
    beforeFirstRender: function () {
        return true;
    },
    beforeRender: function () {
        return true;
    },
    render: function () {
        if (this.beforeRender() != false && this.options.template && this.$el)
            BH.helpers.TemplateRenderer.renderTemplate(this.options.isAppend, this.options.template, this.$el, this.renderData ? this.renderData : {}, this.rightAfterRender.bind(this));
        else
            this.rightAfterRender();
        return this;
    },
    rightAfterRender: function (content) {
        if (content)
            this.setElement(content);
        this.afterRender();
    },
    afterRender: function () {
    },
    inputClickSelectAll: function (e) {
        if (e.target)
            $(e.target).select();
    },
    setInputError: function (input, isError, errorText) {
        if (input) {
            this.removeInputError(input);
            if (isError) {
                input.addClass('has-error');
                if (errorText)
                    input.append("<span class='help-block'>" + errorText + "</span>");
            }
        }
    },
    removeInputError: function (input) {
        input.removeClass('has-error');
        input.find('.help-block').remove();
    },
    pageNumberChanged: function () {
        if (this.upgradeTable.page)
            this.options.dataTablePage = this.upgradeTable.page.info().page;
    },
    pageLengthChanged: function (e, settings, len) {
        this.dataTableLength = len;
    }
});

BH.views.BaseCollectionView = BH.views.BaseView.extend({
    beforeRender: function () {
        if (!this.childEl)
            this.childEl = this.el;
        this.$el.empty();
    },
    beforeChildrenRender: function () {
        return true;
    },
    afterRender: function () {
        if (this.beforeChildrenRender() != false) {
            if (this.options.childView && this.options.collection) {
                for (model in this.options.collection.models) {
                    var options = {
                        model: this.options.collection.models[model],
                        el: this.childEl
                    };

                    if (this.options.childOptions)
                        options = _.extend(this.options.childOptions, options);
                    new this.options.childView(options);
                }
            }
        }
        this.afterChildrenRender();
    },
    afterChildrenRender: function () {
    }
});


//MODALS
BH.views.BaseModal = BH.views.BaseView.extend({
    defaults: {
        template: '/views/partials/modals/modal_default.ejs'
    },
    events: {
        'hidden.bs.modal': 'remove'
    },
    beforeFirstRender: function () {
        if (!this.options.renderData) {
            if ((this.options.header || this.options.body)) {
                this.renderData = {
                    header: this.options.header ? this.options.header : "",
                    body: this.options.body ? this.options.body : ""
                };
            }
            else if (this.options.type) {
                this.renderData = {
                    type: this.options.type
                };
            }
        }
        else {
            this.renderData = this.options.renderData;
        }

        if (this.options.extras)
            this.renderData.extras = this.options.extras;

        //force element to null in case one was passed in
        //this view uses modals only so it creates its own container to insert into in the <body>
        this.setElement(null);
        if (this.beforeModalCreated() != false)
            this.createModal();

        this.listenTo(this.model, "change", this.render);
    },
    beforeModalCreated: function () {
        return true;
    },
    createModal: function () {
        this.createModalContainer();
        this.modal = $('<div class="modal fade" role="dialog">');
        this.container.append(this.modal);
        this.setElement(this.modal);
        this.modal.on('hidden.bs.modal', $.proxy(function () {
            this.removeModal();
        }, this));
        this.afterModalCreated();
    },
    createModalContainer: function () {
        this.container = $('#modalsContainer');
        if (this.container.length == 0) {
            this.container = jQuery('<div id="modalsContainer" />');
            $('body').append(this.container);
        }
    },
    afterModalCreated: function () {
        this.modal.modal('show');
    },
    removeModal: function () {
        this.modal.modal('hide');
        this.modal.remove();
        this.remove();
        $('.modal-backdrop').remove();
    }
});

BH.views.NotifyModal = BH.views.BaseModal.extend({
    defaults: {
        template: '/views/partials/modals/modal_notify.ejs'
    }
});

BH.views.NotifyNewBankAccountModal = BH.views.NotifyModal.extend({
    defaults: {
        template: '/views/partials/modals/modal_notify.ejs'
    },
    events: {
        'click .new-account-login-button': 'accountLogin'
    },
    accountLogin: function () {
        if (this.options.loginCallback)
            this.options.loginCallback(this.options.extras.account.get('account').accountNumber, this.options.extras.account.get('account').password);
    }
});

BH.views.ConfirmModal = BH.views.BaseModal.extend({
    defaults: {
        template: '/views/partials/modals/modal_confirm.ejs'
    },
    events: {
        "click .modal-button-confirm": "confirmCallback",
        "click .modal-button-cancel": "cancelCallback"
    },
    confirmCallback: function () {
        if (typeof this.options.onConfirm === 'function')
            this.options.onConfirm();
    },
    cancelCallback: function () {
        if (typeof this.options.onCancel === 'function')
            this.options.onCancel();
    }
});

BH.views.DeleteModal = BH.views.ConfirmModal.extend({
    defaults: {
        template: '/views/partials/modals/modal_delete.ejs'
    },
    events: {
        "click .modal-button-delete": "confirmCallback",
        "click .modal-button-cancel": "cancelCallback"
    }
});

BH.views.BaseCollectionModal = BH.views.BaseModal.extend({
    afterRender: function () {
        this.setElement(this.$('.modal-body-inner'));
        if (this.options.childView && this.options.collection) {
            for (model in this.options.collection.models) {
                var options = {
                    model: this.options.collection.models[model],
                    el: this.el
                };

                if (this.options.childOptions)
                    options = _.extend(this.options.childOptions, options);
                new this.options.childView(options);
            }
        }
        this.$el.css("max-height", ($(window).height() - 250) + "px");
    }
});


//HELPERS
BH.helpers = BH.helpers ? BH.helpers : {};
BH.helpers.viewHelpers = {
    createCountdownTimer: function ($el, date, finishCallback) {
        if ($el) {
            var t = BH.sharedHelpers.getTimeRemaining(date);
            this.createCountdownElement(t, $el);
            var interval = setInterval(_.bind(function () {
                t = BH.sharedHelpers.getTimeRemaining(date);

                if (t.total > 0) {
                    this.createCountdownElement(t, $el);
                }
                else {
                    clearInterval(interval);
                }
            }, this), 1000);
        }
        return interval;
    },
    createCountdownElement: function (remaining, $el) {
        var s = "";
        if (remaining.days > 0)
            s += (remaining.days + "d ");
        if (remaining.hours > 0 || remaining.days > 0)
            s += (remaining.hours + "h ");
        if (remaining.minutes > 0 || remaining.hours > 0 || remaining.days > 0)
            s += (remaining.minutes + "m ");
        if (remaining.seconds > 0 || remaining.minutes > 0 || remaining.hours > 0 || remaining.days > 0)
            s += (remaining.seconds + "s ");

        $el.html(s);
    },
    setActiveNav: function (id) {
        $(id).addClass('active');
        $('#navTabs').find('li').not(id).removeClass('active');
    }
};
BH.helpers.Toastr = {
    defaults: {
        "closeButton": false,
        "debug": false,
        "newestOnTop": false,
        "progressBar": false,
        "positionClass": "toast-bottom-right",
        "preventDuplicates": true,
        "onclick": null,
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "5000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    },
    showSuccessToast: function (message, options) {
        toastr.options = this.options = _.defaults(options ? options : {}, this.defaults);
        toastr.success(message);
    },
    showErrorToast: function (message, options) {
        toastr.options = this.options = _.defaults(options ? options : {}, this.defaults);
        toastr.error(message);
    },
    showBBResponseErrorToast: function (response, options) {
        if (response.responseText)
            this.showErrorToast(response.responseText, options);
    }
};

BH.helpers.TemplateRenderer = {
    templates: {},
    renderTemplate: function (isAppend, url, $el, data, callback) {
        var tmpl = this.templates[url];
        if (tmpl) {
            this.render(isAppend, tmpl, $el, data, callback);
        }
        else {
            $.ajax({
                url: url,
                method: 'GET',
                async: false,
                dataType: 'html',
                success: $.proxy(function (html) {
                    tmpl = _.template(html);
                    this.templates[url] = tmpl;
                    this.render(isAppend, tmpl, $el, data, callback);
                }, this)
            });
        }
    },
    attachDefaultEventHandlers: function (content) {
        content.find('.ip-address').on('click', function (e) {
            var url = "#internet/ip" + $(e.currentTarget).text();
            BH.app.router.navigate(url, {trigger: true});
        });
    },
    render: function (isAppend, tmpl, $el, data, callback) {
        var content = $(tmpl(data ? data : {}));
        this.attachDefaultEventHandlers(content);
        if (isAppend)
            $el.append(content);
        else
            $el.html(content);
        callback(content);
    }
};


//ROUTER
BH.Router = Backbone.Router.extend({
    body: '#pageInnerContainer',
    routes: {
        "": "localMachine",
        "localmachine": "localMachine",
        "internet": "internetBrowser",
        "internet/b:bank_id/a:account_id": 'browserBankAccountLogin',
        "internet/ip:ip": 'browserIPNavigate',
        "finances": "userFinances"
    },
    localMachine: function () {
        BH.helpers.viewHelpers.setActiveNav('#navLocalMachine');
        new BH.models.LocalMachine({
            el: '#pageInnerContainer'
        });
    },
    internetBrowser: function () {
        BH.helpers.viewHelpers.setActiveNav('#navInternet');
        new BH.models.InternetBrowser({
            el: '#pageInnerContainer'
        });
    },
    browserIPNavigate: function (ip) {
        BH.helpers.viewHelpers.setActiveNav('#navInternet');
        $('#modalsContainer').remove();
        $('.modal-backdrop').remove();
        new BH.models.InternetBrowser({
            el: '#pageInnerContainer',
            browserLoadData: {
                ip: ip
            }
        });
    },
    browserBankAccountLogin: function (bank_id, account_id) {
        BH.helpers.viewHelpers.setActiveNav('#navFinances');
        new BH.models.InternetBrowser({
            el: '#pageInnerContainer',
            browserLoadData: {
                bankAccount: {
                    _id: account_id
                },
                bank: {
                    _id: bank_id
                }
            }
        });
    },
    userFinances: function () {
        BH.helpers.viewHelpers.setActiveNav('#navFinances');
        new BH.collections.UserBankAccountManagement([],
            {
                el: '#pageInnerContainer'
            });
    }
});


//APP
BH.app = BH.app ? BH.app : {};
$(function () {
    BH.app.router = new BH.Router();
    Backbone.history.start({pushState: true});
    $(document).on('mouseup', '.route', function (e) {
        var route = $(e.currentTarget).attr('route');
        if (route) {
            if (e.which == 2) {
                window.open(window.location.origin + route);
            }
            else {
                BH.app.router.navigate(route, {trigger: true});
            }
            e.preventDefault();
        }
    });
});