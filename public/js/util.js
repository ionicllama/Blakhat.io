//VIEWS
BH.views.BaseModal = BH.views.BaseView.extend({
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

        this.listenTo(this.model, "change", this.render);

        //force element to null in case one was passed in
        //this view uses modals only so it creates its own container to insert into in the <body>
        this.setElement(null);
        this.createModal();
    },
    createModal: function () {
        this.createModalContainer();
        var modal = $('<div class="modal fade" role="dialog">');
        this.modalContainer.append(modal);
        this.setElement(modal);
        this.$el.modal('show');
    },
    createModalContainer: function () {
        this.modalContainer = $('#modalsContainer');
        if (this.modalContainer.length == 0) {
            this.modalContainer = jQuery('<div id="modalsContainer" />');
            $('body').append(this.modalContainer);
        }
    }
});

BH.views.NotifyModal = BH.views.BaseModal.extend({
    defaults: {
        template: '/views/partials/modals/modal_notify.ejs'
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