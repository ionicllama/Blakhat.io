//VIEWS

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