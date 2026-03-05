using { SalesOrderService } from './salesOrderService';

annotate SalesOrderService.SalesOrders with @(
  UI.LineItem: [
    { Value: customerName },
    { Value: orderDate },
    { Value: totalAmount },
    { Value: status }
  ],
  UI.HeaderInfo: {
    TypeName: 'Sales Order',
    TypeNamePlural: 'Sales Orders',
    Title: { Value: customerName }
  }
);
