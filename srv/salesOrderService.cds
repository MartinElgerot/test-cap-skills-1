using { com.salesApp } from '../db/schema';

/**
 * SalesOrderService — Exposes SalesOrders for OData access
 */
@path: '/sales-order'
@requires: 'authenticated-user'
service SalesOrderService {

  // ── SalesOrders ──────────────────────────────────────
  @restrict: [
    { grant: ['READ'],                       to: 'viewer' },
    { grant: ['CREATE', 'UPDATE', 'DELETE'], to: 'admin'  }
  ]
  entity SalesOrders as projection on com.salesApp.SalesOrders;

}
