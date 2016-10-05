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
    fetchAccount: function () {
        var fetchData = {
            bank_id: this.get('bank')._id,
            accountNumber: this.get('account').accountNumber
        };
        if (this.get('account').password) {
            fetchData.password = this.get('account').password;
        }
        var fetchParams = {
            data: $.param(fetchData)
        };
        this.fetch(fetchParams);
    },
    renderAccount: function () {
        this.get('browserModel').set({
            activeAccount: this
        });
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
    url: 'bank/accounts',
    afterInit: function () {
        this.on('sync', this.renderAccounts, this);
        this.fetch();
        this.on("change:selected", this.accountSelected, this);
    }
});

BH.collections.UserBankAccountSelect = BH.collections.UserBankAccounts.extend({
    model: BH.models.BankAccount,
    url: 'bank/accounts',
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
            header: "Select a payment account",
            extras: {
                amount: this.options.amount
            }
        });
    },
    accountSelected: function (model, val, options) {
        if (this.view)
            this.view.removeModal();

        if (this.options.callback)
            this.options.callback(model);
    }
});

BH.collections.UserBankAccountManagement = BH.collections.UserBankAccounts.extend({
    afterInit: function () {
        this.on('sync', this.renderAccounts, this);
        this.fetch();
    },
    renderAccounts: function () {
        this.view = new BH.views.BaseCollectionView({
            el: this.options.el,
            collection: this,
            childView: BH.views.BankAccountManage
        });
    }
});


//VIEWS
BH.views.BrowserBankAccount = BH.views.BaseView.extend({
    defaults: {
        template: '/views/partials/bank/browserbankaccount.ejs'
    },
    events: {
        'keyup change #transferAccountNumber, #transferAmountDollars, #transferAmountCents': 'transferDataChanged',
        'keyup #transferAmountCents': 'transferAmountCentsKeyup',
        'change #transferAmountCents': 'transferAmountCentsChanged',
        'click #transferAmountDollars, #transferAmountCents': 'inputClickSelectAll',
        'click #transferConfirmButton': 'transferFunds',
        'click #bankAccountLogoutButton': 'accountLogout'
    },
    beforeFirstRender: function () {
        this.listenTo(this.model, "change", this.render);
        this.renderData = {
            model: this.model
        };
    },
    afterRender: function () {
        this.$dollarsInput = this.$('#transferAmountDollars');
        this.$centsInput = this.$('#transferAmountCents');
    },
    transferDataChanged: function (e) {
        var currentTransfer = this.getCurrentTransferAmount(),
            isCostError = false,
            isAccountNumberError = false;
        if (currentTransfer.totalCents > this.model.get('account').balance)
            isCostError = true;

        if (this.$('#transferAccountNumber').val().length < 10)
            isAccountNumberError = true;

        this.setInputError(this.$('.transfer-account-number-input-group'), isAccountNumberError);
        this.setInputError(this.$('.transfer-amount-input-group'), isCostError);
        this.$('#transferConfirmButton').prop('disabled', isCostError || isAccountNumberError);
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
        var currentTransfer = this.getCurrentTransferAmount();
        this.model.transferFunds(this.$('#transferAccountNumber').val(), currentTransfer.totalCents);
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
    beforeFirstRender: function () {
        this.renderData = {
            model: this.model
        };
    }
});