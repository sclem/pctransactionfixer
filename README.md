# pctransactionfixer

An extension to properly balance transactions in Personal Capital.

## What it does

Transaction fixer for Personal Capital's "Cash Flow" feature. Negative
transactions in an "Income" category deduct from the "Income" tab instead of
"Expenses", and vice-versa.

## Example

Lets say you purchase something at a store and you decide to return it.
Personal Capital will report the reimbursement as "Income" from the store, and
the expense will remain for budgeting purposes.

In traditional double-entry accounting, this is incorrect. The reimbursement
should be a positive "Expense" and zero-out the original purchase.

Another use case: Your friend pays you back 50% of the cost of a shared
purchase. Personal capital, by default, will report the transaction from your
friend as income, and the expense is reported at twice what you "really paid".

## How it works

When personal capital requests the user's transactions, the extension goes
through the list of transactions and finds "Credits" that fall within an
"Expense" category (custom categories are supported). It then rewrites them as
the opposite ("Debit") and negates the amount.

This extension does not affect any data on personal capital's servers. It only
changes the way expenses and income transactions are displayed in the UI.

#### Notice:

This extension only supports Firefox 57 and higher. The transaction rewrite
relies on a WebRequest API function that is not available in Chrome yet. See:
https://bugs.chromium.org/p/chromium/issues/detail?id=104058

