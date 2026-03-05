import cds from '@sap/cds';

const log = cds.log('salesOrderService');

const VALID_STATUSES = ['Open', 'Confirmed', 'Shipped', 'Cancelled'];

export default (srv: cds.ApplicationService) => {

  const { SalesOrders } = srv.entities;

  // ── CREATE ────────────────────────────────────────────
  srv.before('CREATE', SalesOrders, async (req: cds.Request) => {
    log.info('CREATE SalesOrders — user:', req.user.id);

    // Set default status if not provided
    if (!req.data.status) {
      req.data.status = 'Open';
    }

    // Validate status value
    if (!VALID_STATUSES.includes(req.data.status)) {
      req.error(400, `Invalid status '${req.data.status}'. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    // customerName is required
    if (!req.data.customerName) {
      req.error(400, 'customerName is required');
    }
  });

  // ── UPDATE ────────────────────────────────────────────
  srv.before('UPDATE', SalesOrders, async (req: cds.Request) => {
    log.info('UPDATE SalesOrders — user:', req.user.id);

    // Validate status if being changed
    if (req.data.status && !VALID_STATUSES.includes(req.data.status)) {
      req.error(400, `Invalid status '${req.data.status}'. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }
  });

};
