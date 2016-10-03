//MODELS
BH.models.BankAccount = BH.models.BaseModel.extend({
    urlRoot: '/bank/account',
    initialize: function () {
        if (this.get('_id'))
            this.fetchAccount();
    },
    fetchAccount: function () {
        this.fetch();
    },
    parse: function (response) {
        if (response.bankAccount)
            response._id = response.bankAccount._id;
        return response;
    }
});

BH.models.BrowserBankAccount = BH.models.BankAccount.extend({
    initialize: function () {
        this.on('sync', this.renderAccount, this);
        this.fetchAccount();
    },
    fetchAccount: function () {
        var data = {
            bank_id: this.get('bank')._id,
            accountNumber: this.get('account').accountNumber
        };
        if (this.get('account').password) {
            data.password = this.get('account').password;
        }
        var fetchParams = {
            data: $.param(data)
        };
        this.fetch(fetchParams);
    },
    renderAccount: function () {
        this.get('browserModel').set({
            bankAccount: this
        });
    }
});

//VIEWS
BH.views.BankAccount = BH.views.BaseView.extend({
    defaults: {
        template: '/views/partials/bank/bankaccount.ejs'
    },
    events: {
        'keyup #transferAmountDollars': 'transferAmountDollarsChanged',
        'keyup #transferAmountCents': 'transferAmountCentsChanged',
        'click #transferAmountDollars, #transferAmountCents': 'inputClickSelectAll',
        'click #transferConfirmButton': 'transferFunds'
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
    transferAmountDollarsChanged: function (e) {
        var currentTransfer = this.getCurrentTransferAmount();
        if (currentTransfer.dollars + currentTransfer.cents > this.model.get('account').balance) {
            this.setTransferMaxiumums();
        }
    },
    getCurrentTransferAmount: function () {
        var currentDollars = parseInt(this.$dollarsInput.val()) * 100,
            currentCents = parseInt(this.$centsInput.val());
        var response = {};
        response.dollars = isNaN(currentDollars) ? 0 : currentDollars;
        response.cents = isNaN(currentCents) ? 0 : currentCents;
        response.totalCents = (response.dollars * 100) + response.cents;
        return response;
    },
    transferAmountCentsChanged: function (e) {
        var t = this.$centsInput;
        if (t.val() > 100)
            t.val(100);
    },
    setTransferMaxiumums: function () {
        var parsedBalance = BH.sharedHelpers.bankHelpers.parseBankBalance(this.model.get('account').balance);
        this.$dollarsInput.val(parsedBalance.dollars);
        this.$centsInput.val(parsedBalance.cents);
    },
    transferFunds: function () {
        var currentTransfer = this.getCurrentTransferAmount(),
            data = {
                account: {
                    accountNumber: this.model.get('account').accountNumber,
                    password: this.model.get('account').password
                },
                transfer: {
                    amount: currentTransfer.totalCents,
                    accountNumber: this.$('#transferAccountNumber').val()
                }
            };
        this.model.save(data, {
                patch: true,
                success: function (data) {
                    //inform user transfer was successful
                },
                error: function (model, response) {
                    //inform of an error and why

                },
                wait: true
            }
        );
    }
});