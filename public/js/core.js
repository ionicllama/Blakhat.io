var BH = BH ? BH : {};

//CONSTANTS
BH.constants = {};
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
        this.afterInit();
    },
    afterInit: function () {
    }
});

//VIEWS
BH.views = BH.views ? BH.views : {};

BH.views.BaseView = Backbone.View.extend({
    defaults: {
        isAppend: false
    },
    initialize: function (options) {
        this.options = _.defaults(options ? options : {}, this.defaults);
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
    setInputError: function (input, isError) {
        if (input) {
            if (isError)
                input.addClass('has-error');
            else
                input.removeClass('has-error');
        }
    }
});

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

BH.views.BaseCollectionView = BH.views.BaseView.extend({
    afterRender: function () {
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


//Base Utils
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
        "timeOut": "3000",
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
    render: function (isAppend, tmpl, $el, data, callback) {
        var content = $(tmpl(data ? data : {}));
        if (isAppend)
            $el.append(content);
        else
            $el.html(content);
        callback(content);
    }
};