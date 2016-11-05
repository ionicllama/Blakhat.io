//MODELS
BH.models.BankAccount = BH.models.BaseModel.extend({
    urlRoot: '/bank/account',
    initialize: function () {
        if (this.get('_id') && !this.get('account'))
            this.fetchAccount();
    },
    fetchAccount: function () {
        var fetchData = null;
        if (this.get('account')) {
            fetchData.password = this.get('account').password;
        }
        var fetchParams = {
            data: $.param(fetchData)
        };
        this.fetch(fetchParams);
    },
    parse: function (response) {
        if (response.account)
            response._id = response.account._id;
        return response;
    }
});

BH.models.BrowserBankAccount = BH.models.BankAccount.extend({
    initialize: function () {
        this.on('sync', this.renderAccount, this);
        this.fetchAccount();
    },
    rightAfterRender: function () {
    },
    fetchAccount: function () {
        var fetchData = {};

        if (this.get('sourceMachine'))
            fetchData.sourceMachine = this.get('sourceMachine')._id;

        if (!this.get('_id')) {

            if (this.get('bank')._id)
                fetchData.bank_id = this.get('bank')._id;

            if (this.get('account').accountNumber)
                fetchData.accountNumber = this.get('account').accountNumber;

            if (this.get('account').password)
                fetchData.password = this.get('account').password;
        }
        var fetchParams = {
            data: $.param(fetchData)
        };
        this.fetch(fetchParams);
    },
    renderAccount: function () {
        if (this.get('browserModel')) {
            this.get('browserModel').set({
                activeAccount: this
            });
        }
    },
    getPatchData: function (extraData) {
        var data = {
            account: {
                accountNumber: this.get('account').accountNumber,
                password: this.get('account').password
            }
        };
        return _.extend(data, extraData);
    },
    transferFunds: function (destination, amount) {
        this.save(
            this.getPatchData({
                transfer: {
                    amount: amount,
                    accountNumber: destination
                }
            }),
            {
                patch: true,
                success: function (data) {
                    BH.helpers.Toastr.showSuccessToast("Funds transferred successfully", null);
                },
                error: function (model, response) {
                    BH.helpers.Toastr.showBBResponseErrorToast(response, null);
                },
                wait: true
            }
        );
    },
    accountLogout: function () {
        this.get('browserModel').trigger('change:activeAccount')
    }
});

//COLLECTIONS
BH.collections.UserBankAccounts = BH.collections.BaseCollection.extend({
    model: BH.models.BankAccount,
    url: '/bank/accounts',
    afterInit: function () {
        this.fetch();
        this.on("change:selected", this.accountSelected, this);
    }
});

BH.collections.UserBankAccountSelect = BH.collections.UserBankAccounts.extend({
    model: BH.models.BankAccount,
    afterInit: function () {
        this.on('sync', this.renderAccounts, this);
        this.fetch();
    },
    renderAccounts: function () {
        this.on("change:selected", this.accountSelected, this);
        this.view = new BH.views.BaseCollectionModal({
            template: '/views/partials/modals/modal_bankaccount_select.ejs',
            collection: this,
            childView: BH.views.BankAccountSelect,
            childOptions: {
                amount: this.options.amount
            },
            header: "Select an account",
            extras: {
                amount: this.options.amount,
                accountCount: this.models.length
            }
        });
    },
    accountSelected: function (model, val, options) {
        if (this.view)
            this.view.removeModal();

        if (this.options.callback)
            this.options.callback(model, this.options);
    }
});

BH.collections.UserBankAccountManagement = BH.collections.UserBankAccounts.extend({
    afterInit: function () {
        this.on('sync', this.renderAccounts, this);
        this.fetch();
    },
    renderAccounts: function () {
        this.view = new BH.views.UserBankAccountManagement({
            el: this.options.el,
            collection: this
        });
    }
});


//VIEWS
BH.views.BrowserBankAccount = BH.views.BaseView.extend({
    defaults: {
        template: '/views/partials/bank/browserbankaccount.ejs'
    },
    events: {
        'change keyup #transferAmountCents': 'transferAmountCentsKeyup',
        'change #transferAmountCents': 'transferAmountCentsChanged',
        'click #transferAmountDollars, #transferAmountCents': 'inputClickSelectAll',
        'click #transferConfirmButton': 'transferFunds',
        'click #transferSetMaxButton': 'setTransferMaxiumums',
        'click #bankAccountLogoutButton': 'accountLogout'
    },
    beforeFirstRender: function () {

        this.renderData = {
            model: this.model
        };
    },
    afterRender: function () {
        this.$dollarsInput = this.$('#transferAmountDollars');
        this.$centsInput = this.$('#transferAmountCents');
    },
    validateTransferData: function (e) {
        var currentTransfer = this.getCurrentTransferAmount(),
            currentAccountNumber = this.$('#transferAccountNumber').val(),
            isCostError = false,
            isAccountNumberError = false,
            errorText = '';
        if (currentTransfer.totalCents > this.model.get('account').balance) {
            isCostError = true;
            errorText = "Transfer cannot exceed balance"
        }
        else if (currentTransfer.totalCents == 0) {
            isCostError = true;
            errorText = "Transfer must be for more than 0 dollars"
        }
        this.setInputError(this.$('.transfer-amount-input-group'), isCostError, errorText);

        if (currentAccountNumber.length < 10) {
            isAccountNumberError = true;
            errorText = "Destination account number must be 10 characters";
        }
        else if (currentAccountNumber == this.model.get('account').accountNumber) {
            isAccountNumberError = true;
            errorText = "Destination account can't be the source account";
        }
        this.setInputError(this.$('.transfer-account-number-input-group'), isAccountNumberError, errorText);

        return isCostError && isAccountNumberError;
    },
    transferAmountCentsKeyup: function (e) {
        var t = this.$centsInput;
        if (parseInt(t.val()) > 99)
            t.val(99);
    },
    transferAmountCentsChanged: function (e) {
        var t = this.$centsInput,
            v = parseInt(t.val());
        if (v > 0 && v < 10)
            t.val("0" + v.toString());
    },
    getCurrentTransferAmount: function () {
        var currentDollars = parseInt(this.$dollarsInput.val()),
            currentCents = parseInt(this.$centsInput.val());
        var response = {};
        response.dollars = isNaN(currentDollars) ? 0 : currentDollars;
        response.cents = isNaN(currentCents) ? 0 : currentCents;
        response.totalCents = (response.dollars * 100) + response.cents;
        return response;
    },
    setTransferMaxiumums: function () {
        var parsedBalance = BH.sharedHelpers.bankHelpers.parseBankBalance(this.model.get('account').balance);
        this.$dollarsInput.val(parsedBalance.dollars);
        this.$centsInput.val(parsedBalance.cents);
    },
    transferFunds: function () {
        if (!this.validateTransferData()) {
            var currentTransfer = this.getCurrentTransferAmount();
            this.model.transferFunds(this.$('#transferAccountNumber').val(), currentTransfer.totalCents);
        }
    },
    accountLogout: function () {
        this.model.accountLogout();
    }
});

BH.views.BankAccountSelect = BH.views.BaseView.extend({
    events: {
        'click .select-bank-account': 'accountSelected'
    },
    defaults: {
        template: '/views/partials/bank/userbankaccountselect.ejs',
        isAppend: true
    },
    beforeFirstRender: function () {
        this.renderData = {
            model: this.model,
            amount: this.options.amount ? this.options.amount : null
        };
    },
    accountSelected: function () {
        this.model.set('selected', true);
    }
});

BH.views.BankAccountManage = BH.views.BaseView.extend({
    defaults: {
        template: '/views/partials/bank/userbankaccountmanage.ejs',
        isAppend: true
    },
    events: {
        'click .login-manage-bank-account': 'bankAccountLogin',
        'click .delete-manage-bank-account': 'bankAccountDeleteConfirm'
    },
    beforeFirstRender: function () {
        this.listenTo(this.model, "destroy", this.remove);
        this.renderData = {
            model: this.model
        };
    },
    bankAccountLogin: function () {
        var url = "#internet/b" + this.model.get('account').bank._id + '/a' + this.model.get('_id');
        BH.app.router.navigate(url, {trigger: true});
    },
    bankAccountDeleteConfirm: function () {
        new BH.views.DeleteModal({
            header: "Delete Bank Account",
            body: "Are you sure you want to delete this bank account?",
            onConfirm: this.bankAccountDelete.bind(this)
        });
    },
    bankAccountDelete: function () {
        this.model.destroy();
    }
});

BH.views.UserBankAccountManagement = BH.views.BaseCollectionView.extend({
    defaults: {
        template: '/views/partials/bank/userbankaccountmanagement.ejs',
        childView: BH.views.BankAccountManage
    },
    beforeFirstRender: function (options) {
        this.renderData = {
            models: this.collection.models
        };
    }
});