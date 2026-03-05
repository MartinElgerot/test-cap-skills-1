namespace com.salesApp;

using { managed, cuid } from '@sap/cds/common';

// Add your entities here using /generate-entity

/**
 * SalesOrders — Sales order records with customer, date, amount, and status
 */
@title: 'Sales Order'
@description: 'Sales order with customer name, order date, total amount, and status'
entity SalesOrders : managed, cuid {
  // --- key is provided by cuid ---

  @title: 'Customer Name'
  customerName : String(100);

  @title: 'Order Date'
  orderDate    : Date;

  @title: 'Total Amount'
  totalAmount  : Decimal(15,2);

  @title: 'Status'
  status       : String(100);
}
